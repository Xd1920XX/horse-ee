import { Course, Obstacle } from './types';
import { dist, sortedByNumber, stridesBetween } from './geometry';

export type ValidationIssue = {
  severity: 'warn' | 'error';
  message: string;
  obstacleIds?: string[];
};

// Smallest signed difference between two angles in degrees, in range (-180, 180].
function angleDiff(a: number, b: number): number {
  let d = ((b - a) % 360 + 540) % 360 - 180;
  if (d === -180) d = 180;
  return d;
}

export function validateCourse(c: Course): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { arena, obstacles } = c;

  // Out of arena
  for (const o of obstacles) {
    if (o.x < 0 || o.x > arena.width || o.y < 0 || o.y > arena.height) {
      issues.push({ severity: 'error', message: `Takistus ${o.number ?? '(nr-ta)'} on väljakult väljas.`, obstacleIds: [o.id] });
    }
  }

  // Too close to each other (non-combo)
  for (let i = 0; i < obstacles.length; i++) {
    for (let j = i + 1; j < obstacles.length; j++) {
      const a = obstacles[i];
      const b = obstacles[j];
      if (a.comboGroupId && a.comboGroupId === b.comboGroupId) continue;
      const d = dist(a, b);
      if (d < 7) {
        issues.push({
          severity: 'warn',
          message: `Takistused ${a.number ?? '?'} ja ${b.number ?? '?'} on liiga lähedal (${d.toFixed(1)}m, min 7m).`,
          obstacleIds: [a.id, b.id],
        });
      }
    }
  }

  // Combination internal distances
  const combos = new Map<string, Obstacle[]>();
  for (const o of obstacles) {
    if (!o.comboGroupId) continue;
    const arr = combos.get(o.comboGroupId) ?? [];
    arr.push(o);
    combos.set(o.comboGroupId, arr);
  }
  for (const [cid, arr] of combos) {
    arr.sort((a, b) => (a.letter ?? '').localeCompare(b.letter ?? ''));
    for (let i = 0; i < arr.length - 1; i++) {
      const d = dist(arr[i], arr[i + 1]);
      const info = stridesBetween(d);
      if (!info.clean) {
        issues.push({
          severity: 'warn',
          message: `Kombo ${arr[0].number ?? cid}: ${arr[i].letter}-${arr[i + 1].letter} distants ${d.toFixed(1)}m on ebaselge (${info.label}).`,
          obstacleIds: [arr[i].id, arr[i + 1].id],
        });
      }
      if (d > 12.5) {
        issues.push({
          severity: 'warn',
          message: `Kombo ${arr[0].number ?? cid}: ${arr[i].letter}-${arr[i + 1].letter} liiga pikk (${d.toFixed(1)}m) kombo jaoks.`,
          obstacleIds: [arr[i].id, arr[i + 1].id],
        });
      }
    }
  }

  // Approach angle & turn radius checks along the numbered ride.
  const ride = sortedByNumber(obstacles);
  if (ride.length >= 1) {
    const chain: { x: number; y: number; o?: Obstacle; label: string }[] = [
      { x: c.start.x, y: c.start.y, label: 'start' },
      ...ride.map((o) => ({ x: o.x, y: o.y, o, label: `${o.number}${o.letter ?? ''}` })),
      { x: c.finish.x, y: c.finish.y, label: 'finiš' },
    ];
    for (let i = 1; i < chain.length - 1; i++) {
      const prev = chain[i - 1];
      const node = chain[i];
      const next = chain[i + 1];
      const inAngle = (Math.atan2(node.y - prev.y, node.x - prev.x) * 180) / Math.PI;
      const outAngle = (Math.atan2(next.y - node.y, next.x - node.x) * 180) / Math.PI;
      const turn = Math.abs(angleDiff(inAngle, outAngle));
      const prevD = dist(prev, node);

      // Approach angle: obstacle rotation should align with incoming direction (±25°).
      if (node.o && !node.o.comboGroupId) {
        const align = Math.abs(angleDiff(inAngle, node.o.rotation));
        if (align > 35) {
          issues.push({
            severity: 'warn',
            message: `Takistus ${node.label}: lähenemisnurk ${align.toFixed(0)}° takistuse suunast — hobune jõuab küljelt.`,
            obstacleIds: [node.o.id],
          });
        }
      }

      // Sharp turn with short runway → unrideable.
      if (turn > 110 && prevD < 15) {
        issues.push({
          severity: 'warn',
          message: `Pööre ${turn.toFixed(0)}° takistuse ${node.label} juures, lähenemine ainult ${prevD.toFixed(1)}m — hobune ei jõua joonele.`,
          obstacleIds: node.o ? [node.o.id] : undefined,
        });
      }
    }
  }

  // Numbering gaps
  const numbered = sortedByNumber(obstacles);
  const nums = new Set(numbered.map((o) => o.number));
  if (nums.size) {
    const max = Math.max(...Array.from(nums as Set<number>));
    for (let n = 1; n <= max; n++) {
      if (!nums.has(n)) {
        issues.push({ severity: 'warn', message: `Numeratsioonis puudub nr ${n}.` });
      }
    }
  }

  // Unnumbered obstacles
  const unnumbered = obstacles.filter((o) => o.number == null);
  if (unnumbered.length) {
    issues.push({
      severity: 'warn',
      message: `${unnumbered.length} takistust numereerimata.`,
      obstacleIds: unnumbered.map((o) => o.id),
    });
  }

  return issues;
}
