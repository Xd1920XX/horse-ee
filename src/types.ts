export type ObstacleType =
  | 'vertical'
  | 'oxer'
  | 'triple'
  | 'wall'
  | 'liverpool'
  | 'water'
  | 'combination'
  | 'cavaletti';

export type Obstacle = {
  id: string;
  type: ObstacleType;
  x: number;        // meters
  y: number;        // meters
  rotation: number; // degrees; 0 = jump toward +x
  width: number;    // meters, side-to-side poles length
  spread: number;   // meters, depth (oxer/triple/water)
  height: number;   // cm
  number?: number;  // sequence
  letter?: string;  // 'a'/'b'/'c' for combinations
  comboGroupId?: string; // locked combination group
  notes?: string;   // trainer notes
  flags?: boolean;  // show red/white flags (FEI)
};

export type DecorationType = 'flower' | 'tree' | 'judge' | 'tent' | 'warmup' | 'arrow' | 'label';

export type Decoration = {
  id: string;
  type: DecorationType;
  x: number;
  y: number;
  rotation: number;
  size: number;     // meters
  text?: string;    // for 'label'
};

export type Arena = {
  width: number;    // meters
  height: number;   // meters
  indoor: boolean;
  surface?: 'sand' | 'grass' | 'fiber';
};

export type Marker = { x: number; y: number; rotation: number };

export type BackgroundImage = {
  dataUrl: string;
  opacity: number;        // 0..1
  x: number;              // meters, top-left offset
  y: number;
  scale: number;          // 1 = fit arena
};

export type Course = {
  id: string;
  name: string;
  arena: Arena;
  obstacles: Obstacle[];
  decorations: Decoration[];
  start: Marker;
  finish: Marker;
  heightClass: number; // cm
  speedMpm: number;    // speed meters/minute (for time estimate)
  background?: BackgroundImage;
  notes?: string;
  // Optional per-segment riding-line bends. Index aligns with
  // the segment list [start→n1, n1→n2, ..., nk→finish]. Null = straight.
  ridingLineBends?: ({ x: number; y: number } | null)[];
  createdAt?: number;
  updatedAt?: number;
};

export type ToolMode = 'select' | 'ruler' | 'place-decoration';

export const OBSTACLE_LABELS: Record<ObstacleType, string> = {
  vertical: 'Vertikaal',
  oxer: 'Oksuur',
  triple: 'Triple bar',
  wall: 'Müür',
  liverpool: 'Liverpool',
  water: 'Veetakistus',
  combination: 'Kombinatsiooni osa',
  cavaletti: 'Cavaletti',
};

export const DECORATION_LABELS: Record<DecorationType, string> = {
  flower: 'Lill',
  tree: 'Puu',
  judge: 'Kohtunikumaja',
  tent: 'Telk',
  warmup: 'Soojendusala',
  arrow: 'Nool',
  label: 'Silt',
};

export const DEFAULT_OBSTACLE: Record<ObstacleType, Partial<Obstacle>> = {
  vertical:    { width: 3.5, spread: 0,   height: 110 },
  oxer:        { width: 3.5, spread: 1.2, height: 110 },
  triple:      { width: 3.5, spread: 1.8, height: 110 },
  wall:        { width: 3.0, spread: 0.4, height: 110 },
  liverpool:   { width: 3.5, spread: 1.5, height: 110 },
  water:       { width: 4.0, spread: 3.0, height: 0   },
  combination: { width: 3.5, spread: 0,   height: 110 },
  cavaletti:   { width: 3.0, spread: 0,   height: 30  },
};

export const HEIGHT_PRESETS: { value: number; label: string }[] = [
  { value: 0,   label: 'Maalatid' },
  { value: 30,  label: 'Ristid' },
  { value: 50,  label: '50 cm' },
  { value: 60,  label: '60 cm' },
  { value: 70,  label: '70 cm' },
  { value: 80,  label: '80 cm' },
  { value: 90,  label: '90 cm' },
  { value: 100, label: '100 cm' },
  { value: 110, label: '110 cm' },
  { value: 120, label: '120 cm' },
  { value: 130, label: '130 cm' },
  { value: 140, label: '140 cm' },
  { value: 150, label: '150 cm' },
];

export const SPEED_PRESETS: { label: string; mpm: number }[] = [
  { label: 'Treening 300 m/min', mpm: 300 },
  { label: 'Kuni 1.10m — 325 m/min', mpm: 325 },
  { label: '1.15–1.30m — 350 m/min', mpm: 350 },
  { label: '1.35m+ — 375 m/min', mpm: 375 },
  { label: 'Puissance — 400 m/min', mpm: 400 },
];
