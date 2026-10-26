import { Course, Obstacle, ObstacleType } from './types';
import { dist, distanceForStrides } from './geometry';

const uid = () => Math.random().toString(36).slice(2, 10);

export type GeneratorOptions = {
  arenaW: number;
  arenaH: number;
  obstacleCount: number;      // 6..16
  heightCm: number;
  includeCombinations: boolean;
  includeWater: boolean;
  style: 'flowing' | 'technical' | 'mixed';
  seed?: number;              // combined seed (back-compat; sets both if specific seeds omitted)
  shapeSeed?: number;         // controls the ride-line shape + obstacle positions
  jumpSeed?: number;          // controls jump types + combo pick (so you can reroll jumps on same path)
};

// Mulberry32 — seedable RNG so same seed → same course.
function rng(seed: number) {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type PathShape = 'oval' | 'figure8' | 'serpentine';
type P = { x: number; y: number };

// Build a dense riding-line sampled as points. Shape determines style of flow.
// Closed shapes (oval, figure8) wrap; serpentine is open.
function buildPath(
  shape: PathShape,
  arenaW: number,
  arenaH: number,
  margin: number,
  dir: 1 | -1,
): { pts: P[]; closed: boolean } {
  const steps = 400;
  const cx = arenaW / 2;
  const cy = arenaH / 2;
  const rx = (arenaW - 2 * margin) / 2;
  const ry = (arenaH - 2 * margin) / 2;
  const pts: P[] = [];

  if (shape === 'oval') {
    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * Math.PI * 2 * dir;
      pts.push({ x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(t) });
    }
    return { pts, closed: true };
  }

  if (shape === 'figure8') {
    // Lissajous-based "figure 8" — scaled lemniscate.
    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * Math.PI * 2 * dir;
      const d = 1 + Math.sin(t) * Math.sin(t);
      pts.push({
        x: cx + (rx * Math.cos(t)) / d,
        y: cy + (ry * Math.sin(t) * Math.cos(t)) / d,
      });
    }
    return { pts, closed: true };
  }

  // Serpentine: S-curve down the long axis.
  const long = arenaW >= arenaH;
  const lobes = 2.5;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    if (long) {
      pts.push({
        x: margin + t * (arenaW - 2 * margin),
        y: cy + ry * 0.85 * Math.sin(t * lobes * Math.PI) * dir,
      });
    } else {
      pts.push({
        x: cx + rx * 0.85 * Math.sin(t * lobes * Math.PI) * dir,
        y: margin + t * (arenaH - 2 * margin),
      });
    }
  }
  return { pts, closed: false };
}

function cumulativeLengths(pts: P[]): number[] {
  const out: number[] = [0];
  for (let i = 1; i < pts.length; i++) out.push(out[i - 1] + dist(pts[i - 1], pts[i]));
  return out;
}

// Binary search for the path index at a given cumulative length.
function sampleAt(pts: P[], cum: number[], target: number): { pt: P; idx: number } {
  let lo = 1;
  let hi = cum.length - 1;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (cum[m] < target) lo = m + 1;
    else hi = m;
  }
  const i = Math.max(1, lo);
  const span = Math.max(1e-6, cum[i] - cum[i - 1]);
  const t = (target - cum[i - 1]) / span;
  return {
    pt: {
      x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t,
      y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t,
    },
    idx: i,
  };
}

// Travel-direction angle (degrees) along path near idx. Uses a short window to smooth.
function tangentAt(pts: P[], idx: number): number {
  const prev = pts[Math.max(0, idx - 4)];
  const next = pts[Math.min(pts.length - 1, idx + 4)];
  return (Math.atan2(next.y - prev.y, next.x - prev.x) * 180) / Math.PI;
}

export function generateCourse(opts: GeneratorOptions): Partial<Course> {
  const { arenaW, arenaH, obstacleCount, heightCm, includeCombinations, includeWater, style } = opts;
  const combined = opts.seed ?? Math.floor(Math.random() * 1e9);
  const shapeSeed = opts.shapeSeed ?? combined;
  const jumpSeed = opts.jumpSeed ?? combined;
  const rand = rng(shapeSeed);
  const randJump = rng(jumpSeed);
  const margin = 6;
  const minSpacing = 14;      // meters between non-combo jumps — horse needs ≥3 strides to set up

  // Pick shape biased by arena aspect ratio
  const aspect = arenaW / arenaH;
  const shapes: PathShape[] = aspect > 1.4
    ? ['oval', 'serpentine', 'figure8']
    : aspect < 0.7
    ? ['oval', 'serpentine']
    : ['oval', 'figure8'];
  const shape = shapes[Math.floor(rand() * shapes.length)];
  const dir: 1 | -1 = rand() > 0.5 ? 1 : -1;

  const { pts, closed } = buildPath(shape, arenaW, arenaH, margin, dir);
  const cum = cumulativeLengths(pts);
  const totalLen = cum[cum.length - 1];

  // Obstacle type pool by style
  const typePool: ObstacleType[] = ['vertical', 'vertical', 'oxer', 'oxer'];
  if (style !== 'flowing') typePool.push('wall', 'liverpool');
  if (style === 'technical') typePool.push('wall', 'triple');
  if (includeWater) typePool.push('water');
  const pickType = (): ObstacleType => typePool[Math.floor(randJump() * typePool.length)];

  // Reserve head/tail room on open paths for start/finish gallops.
  const headRoom = closed ? 0 : Math.min(16, totalLen * 0.1);
  const tailRoom = closed ? 0 : Math.min(16, totalLen * 0.1);
  const useLen = Math.max(1, totalLen - headRoom - tailRoom);
  const step = useLen / obstacleCount;

  const obstacles: Obstacle[] = [];
  const sampleTangents: number[] = [];

  for (let i = 0; i < obstacleCount; i++) {
    const target = headRoom + step * (i + 0.5);
    const { pt, idx } = sampleAt(pts, cum, target);
    const tangent = tangentAt(pts, idx);

    // Small perpendicular jitter so courses don't look stamped. Keep inside arena.
    const jitter = (rand() - 0.5) * 2.0;
    const perpX = -Math.sin((tangent * Math.PI) / 180);
    const perpY = Math.cos((tangent * Math.PI) / 180);
    const x = Math.max(margin, Math.min(arenaW - margin, pt.x + perpX * jitter));
    const y = Math.max(margin, Math.min(arenaH - margin, pt.y + perpY * jitter));

    // Enforce minimum spacing from all previously placed jumps.
    if (obstacles.some((o) => dist({ x, y }, o) < minSpacing)) continue;

    // Course-design rules:
    //  - First jump: inviting vertical, 10cm below nominal.
    //  - Last jump: friendly vertical/oxer, nominal height (no wall/liverpool/water to end on).
    //  - Mid-course: pick from full pool, with one "feature" obstacle +5cm.
    const isFirst = obstacles.length === 0;
    const isLast = i === obstacleCount - 1;
    let type: ObstacleType;
    let height: number;
    if (isFirst) {
      type = 'vertical';
      height = Math.max(30, heightCm - 10);
    } else if (isLast) {
      type = randJump() > 0.5 ? 'vertical' : 'oxer';
      height = heightCm;
    } else {
      type = pickType();
      // one random bump at a mid jump so profile isn't flat
      const bump = i === Math.floor(obstacleCount / 2) ? 5 : 0;
      height = type === 'water' ? 0 : heightCm + bump;
    }

    const spread =
      type === 'oxer' ? 1.0 + randJump() * 0.4 :
      type === 'triple' ? 1.6 + randJump() * 0.3 :
      type === 'wall' ? 0.4 :
      type === 'liverpool' ? 1.3 + randJump() * 0.4 :
      type === 'water' ? 2.8 + randJump() * 1.0 :
      0;

    obstacles.push({
      id: uid(),
      type,
      x,
      y,
      rotation: ((tangent % 360) + 360) % 360,
      width: type === 'water' ? 4 : 3.5,
      spread,
      height,
    });
    sampleTangents.push(tangent);
  }

  // Combination: find consecutive pair with smallest tangent change (straightest flow),
  // then snap the second obstacle to exactly 1 or 2 strides from the first along that tangent.
  if (includeCombinations && obstacles.length >= 4) {
    const strideCount = randJump() > 0.5 ? 1 : 2;
    const sD = distanceForStrides(strideCount);
    let best = -1;
    let bestDiff = Infinity;
    for (let i = 1; i < obstacles.length - 1; i++) {
      const delta = Math.abs(((obstacles[i + 1].rotation - obstacles[i].rotation + 540) % 360) - 180);
      // delta: 180 = same direction, 0 = reversed. Want closest to 180.
      const score = Math.abs(180 - delta);
      if (score < bestDiff) { bestDiff = score; best = i; }
    }
    if (best >= 0) {
      const a = obstacles[best];
      const b = obstacles[best + 1];
      const rad = (a.rotation * Math.PI) / 180;
      const bx = Math.max(margin, Math.min(arenaW - margin, a.x + Math.cos(rad) * sD));
      const by = Math.max(margin, Math.min(arenaH - margin, a.y + Math.sin(rad) * sD));
      // Only commit if arena bounds didn't clamp the stride distance
      if (Math.hypot(bx - a.x, by - a.y) >= sD - 0.5) {
        b.x = bx;
        b.y = by;
        b.rotation = a.rotation;
        b.type = (['vertical', 'oxer'] as ObstacleType[])[Math.floor(randJump() * 2)];
        b.height = heightCm;
        b.spread = b.type === 'oxer' ? 1.0 + randJump() * 0.3 : 0;
        const comboId = uid();
        a.comboGroupId = comboId;
        b.comboGroupId = comboId;
        a.letter = 'a';
        b.letter = 'b';
      }
    }
  }

  // Numbering: combos share leader number (a + b = same number, letters a/b).
  let nextNum = 1;
  const comboNum = new Map<string, number>();
  for (const o of obstacles) {
    if (o.comboGroupId) {
      if (!comboNum.has(o.comboGroupId)) comboNum.set(o.comboGroupId, nextNum++);
      o.number = comboNum.get(o.comboGroupId)!;
    } else {
      o.number = nextNum++;
    }
  }

  // Start = ~14m back along first obstacle's approach line.
  // Finish = ~14m forward along last obstacle's departure line.
  // Rotation = travel direction, so visual line is perpendicular to it (diagonal if path demands).
  const first = obstacles[0];
  const last = obstacles[obstacles.length - 1];
  const firstRad = (first.rotation * Math.PI) / 180;
  const lastRad = (last.rotation * Math.PI) / 180;
  const backoff = 14;
  const startX = Math.max(margin, Math.min(arenaW - margin, first.x - Math.cos(firstRad) * backoff));
  const startY = Math.max(margin, Math.min(arenaH - margin, first.y - Math.sin(firstRad) * backoff));
  const finishX = Math.max(margin, Math.min(arenaW - margin, last.x + Math.cos(lastRad) * backoff));
  const finishY = Math.max(margin, Math.min(arenaH - margin, last.y + Math.sin(lastRad) * backoff));

  return {
    obstacles,
    start: { x: startX, y: startY, rotation: ((first.rotation % 360) + 360) % 360 },
    finish: { x: finishX, y: finishY, rotation: ((last.rotation % 360) + 360) % 360 },
  };
}
