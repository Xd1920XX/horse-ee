import { Marker, Obstacle } from './types';

export const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

// Related-distance strides.
// Rule of thumb: horse stride ~3.5m, landing+takeoff add ~6m
// distance ≈ 6 + n * 3.5  →  n = (d - 6) / 3.5
export function stridesBetween(d: number): { strides: number; label: string; clean: boolean } {
  if (d < 3) return { strides: 0, label: 'in-and-out', clean: false };
  if (d < 4.5) return { strides: 0, label: 'bounce', clean: true };
  const n = (d - 6) / 3.5;
  const rounded = Math.round(n);
  if (rounded < 1) {
    if (d < 5.5) return { strides: 0, label: 'bounce', clean: true };
    return { strides: 1, label: '1 s. (lühike)', clean: false };
  }
  if (rounded > 7) return { strides: rounded, label: 'mitteseotud', clean: true };
  // check if distance is clean (within ±0.3m of ideal)
  const ideal = 6 + rounded * 3.5;
  const clean = Math.abs(d - ideal) <= 0.3;
  return { strides: rounded, label: `${rounded} s.${clean ? '' : ' (ebaselge)'}`, clean };
}

// Distance for N strides (horse canter, 3.5m stride)
export function distanceForStrides(n: number): number {
  if (n === 0) return 3.6; // bounce
  return 6 + n * 3.5;
}

export function sortedByNumber(obstacles: Obstacle[]): Obstacle[] {
  return obstacles
    .filter((o) => o.number != null)
    .sort((a, b) => (a.number! - b.number!) || (a.letter ?? '').localeCompare(b.letter ?? ''));
}

export function pathPoints(
  start: Marker,
  obstacles: Obstacle[],
  finish: Marker,
  bends?: ({ x: number; y: number } | null)[],
): number[] {
  const ordered = sortedByNumber(obstacles);
  const nodes: { x: number; y: number }[] = [
    { x: start.x, y: start.y },
    ...ordered.map((o) => ({ x: o.x, y: o.y })),
    { x: finish.x, y: finish.y },
  ];
  const pts: number[] = [];
  for (let i = 0; i < nodes.length; i++) {
    pts.push(nodes[i].x, nodes[i].y);
    const bend = bends?.[i];
    if (bend && i < nodes.length - 1) {
      pts.push(bend.x, bend.y);
    }
  }
  return pts;
}

export function pathSegments(
  start: Marker,
  obstacles: Obstacle[],
  finish: Marker,
): { ax: number; ay: number; bx: number; by: number }[] {
  const ordered = sortedByNumber(obstacles);
  const nodes = [
    { x: start.x, y: start.y },
    ...ordered.map((o) => ({ x: o.x, y: o.y })),
    { x: finish.x, y: finish.y },
  ];
  const segs: { ax: number; ay: number; bx: number; by: number }[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    segs.push({ ax: nodes[i].x, ay: nodes[i].y, bx: nodes[i + 1].x, by: nodes[i + 1].y });
  }
  return segs;
}

export function totalPathLength(
  start: Marker,
  obstacles: Obstacle[],
  finish: Marker,
  bends?: ({ x: number; y: number } | null)[],
): number {
  const ordered = sortedByNumber(obstacles);
  const pts = [{ x: start.x, y: start.y }, ...ordered.map((o) => ({ x: o.x, y: o.y })), { x: finish.x, y: finish.y }];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const bend = bends?.[i];
    if (bend) {
      total += dist(pts[i], bend) + dist(bend, pts[i + 1]);
    } else {
      total += dist(pts[i], pts[i + 1]);
    }
  }
  return total;
}

// Length of a single segment (optionally via its bend).
export function segmentLength(
  a: { x: number; y: number },
  b: { x: number; y: number },
  bend?: { x: number; y: number } | null,
): number {
  return bend ? dist(a, bend) + dist(bend, b) : dist(a, b);
}

// Place second obstacle at N strides from first, keeping first's rotation direction
export function placeAtStrides(from: Obstacle, strides: number, arenaW: number, arenaH: number): { x: number; y: number } {
  const d = distanceForStrides(strides);
  const rad = (from.rotation * Math.PI) / 180;
  // obstacle faces local +x direction after rotation = (cos, sin)
  const nx = from.x + Math.cos(rad) * d;
  const ny = from.y + Math.sin(rad) * d;
  return {
    x: Math.max(1, Math.min(arenaW - 1, nx)),
    y: Math.max(1, Math.min(arenaH - 1, ny)),
  };
}
