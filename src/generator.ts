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
  seed?: number;
};

// Simple seedable RNG (mulberry32)
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

export function generateCourse(opts: GeneratorOptions): Partial<Course> {
  const { arenaW, arenaH, obstacleCount, heightCm, includeCombinations, includeWater, style } = opts;
  const rand = rng(opts.seed ?? Math.floor(Math.random() * 1e9));
  const margin = 5;
  const minDist = 10;        // min distance between unrelated obstacles

  // Build type pool weighted by style
  const typePool: ObstacleType[] = ['vertical', 'vertical', 'oxer', 'oxer'];
  if (style !== 'flowing') typePool.push('triple', 'wall', 'liverpool');
  if (style === 'technical') typePool.push('oxer', 'wall');
  if (includeWater) typePool.push('water');

  const pickType = (): ObstacleType => typePool[Math.floor(rand() * typePool.length)];

  // Poisson-disk-ish sampling for base positions
  const obstacles: Obstacle[] = [];
  let attempts = 0;
  const maxAttempts = 500;

  while (obstacles.length < obstacleCount && attempts < maxAttempts) {
    attempts++;
    const x = margin + rand() * (arenaW - 2 * margin);
    const y = margin + rand() * (arenaH - 2 * margin);
    const ok = obstacles.every((o) => dist({ x, y }, o) >= minDist);
    if (!ok) continue;
    const type = pickType();
    const rot = Math.round(rand() * 24) * 15; // 0, 15, 30, ...
    const d = type === 'oxer' ? 1.0 + rand() * 0.5
            : type === 'triple' ? 1.6 + rand() * 0.4
            : type === 'wall' ? 0.4
            : type === 'liverpool' ? 1.2 + rand() * 0.5
            : type === 'water' ? 2.5 + rand() * 1.5
            : 0;
    obstacles.push({
      id: uid(),
      type,
      x,
      y,
      rotation: rot,
      width: type === 'water' ? 4 : 3.5,
      spread: d,
      height: type === 'water' ? 0 : heightCm,
    });
  }

  // Order by nearest-neighbor from start corner
  const start = { x: margin, y: arenaH - margin, rotation: 0 };
  const finish = { x: margin, y: margin, rotation: 0 };
  const remaining = [...obstacles];
  const ordered: Obstacle[] = [];
  let cur = { x: start.x, y: start.y };
  while (remaining.length) {
    let bestIdx = 0;
    let bestD = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = dist(cur, remaining[i]);
      if (d < bestD) { bestD = d; bestIdx = i; }
    }
    const picked = remaining.splice(bestIdx, 1)[0];
    ordered.push(picked);
    cur = { x: picked.x, y: picked.y };
  }

  // Create one combination if requested, converting 2 adjacent obstacles into a 1-stride double
  if (includeCombinations && ordered.length >= 4) {
    const idx = 2 + Math.floor(rand() * (ordered.length - 3));
    const a = ordered[idx];
    const b = ordered[idx + 1];
    const comboId = uid();
    // place b at 1 stride from a along a's rotation direction
    const sD = distanceForStrides(1);
    const rad = (a.rotation * Math.PI) / 180;
    b.x = Math.max(margin, Math.min(arenaW - margin, a.x + Math.cos(rad) * sD));
    b.y = Math.max(margin, Math.min(arenaH - margin, a.y + Math.sin(rad) * sD));
    b.rotation = a.rotation;
    a.comboGroupId = comboId;
    b.comboGroupId = comboId;
    a.letter = 'a';
    b.letter = 'b';
  }

  // Number: combos share leader number
  let nextNum = 1;
  const comboNum = new Map<string, number>();
  for (const o of ordered) {
    if (o.comboGroupId) {
      if (!comboNum.has(o.comboGroupId)) comboNum.set(o.comboGroupId, nextNum++);
      o.number = comboNum.get(o.comboGroupId)!;
    } else {
      o.number = nextNum++;
    }
  }

  return {
    obstacles: ordered,
    start,
    finish,
  };
}
