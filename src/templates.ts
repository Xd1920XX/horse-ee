import { Course, Obstacle, ObstacleType } from './types';
import { distanceForStrides } from './geometry';

const uid = () => Math.random().toString(36).slice(2, 10);

export type Template = {
  id: string;
  name: string;
  description: string;
  category: 'exercise' | 'full-course';
  heightCm: number;
  requiredArena: { width: number; height: number };
  build: (arenaW: number, arenaH: number, heightCm: number) => Partial<Course>;
};

const mkObs = (type: ObstacleType, x: number, y: number, rotation: number, heightCm: number, spread = 0): Obstacle => ({
  id: uid(),
  type,
  x,
  y,
  rotation,
  width: 3.5,
  spread,
  height: heightCm,
});

export const TEMPLATES: Template[] = [
  {
    id: 'cavaletti-row',
    name: 'Cavaletti rida (4 posti)',
    description: '4 cavaletti sammudel ~1.2m. Rütmi harjutus.',
    category: 'exercise',
    heightCm: 30,
    requiredArena: { width: 20, height: 20 },
    build: (w, h) => {
      const cy = h / 2;
      const startX = w / 2 - 1.8;
      return {
        obstacles: [0, 1.2, 2.4, 3.6].map((dx) => mkObs('cavaletti', startX + dx, cy, 0, 30)),
      };
    },
  },
  {
    id: 'bounce-grid',
    name: 'Bounce grid (3 vertikaali)',
    description: '3 vertikaali bounce distantsil (~3.5m).',
    category: 'exercise',
    heightCm: 70,
    requiredArena: { width: 25, height: 20 },
    build: (w, h, hc) => {
      const cy = h / 2;
      const startX = w / 2 - 3.5;
      return {
        obstacles: [0, 3.5, 7].map((dx) => mkObs('vertical', startX + dx, cy, 0, hc)),
      };
    },
  },
  {
    id: 'gymnastic-5',
    name: 'Gümnastika grid (5 elementi)',
    description: 'Cavaletti → bounce → 1 samm → 1 samm → oksuur.',
    category: 'exercise',
    heightCm: 90,
    requiredArena: { width: 40, height: 20 },
    build: (w, h, hc) => {
      const cy = h / 2;
      let x = w / 2 - 10;
      const obs: Obstacle[] = [];
      obs.push(mkObs('cavaletti', x, cy, 0, 30));
      x += 2.4;
      obs.push(mkObs('vertical', x, cy, 0, hc - 20));
      x += distanceForStrides(0); // bounce
      obs.push(mkObs('vertical', x, cy, 0, hc - 10));
      x += distanceForStrides(1);
      obs.push(mkObs('vertical', x, cy, 0, hc));
      x += distanceForStrides(1);
      obs.push(mkObs('oxer', x, cy, 0, hc, 1.0));
      return { obstacles: obs };
    },
  },
  {
    id: 'serpentine-5',
    name: 'Serpentine 5-takistusega',
    description: 'Vahelduv suund, suurem pöördenõue.',
    category: 'exercise',
    heightCm: 90,
    requiredArena: { width: 50, height: 30 },
    build: (w, h, hc) => {
      const cy = h / 2;
      const xs = [10, 20, 30, 40, 50].map((p) => (p / 60) * w);
      return {
        obstacles: xs.map((x, i) =>
          mkObs(i % 2 === 0 ? 'vertical' : 'oxer', x, cy + (i % 2 === 0 ? -6 : 6), i % 2 === 0 ? 20 : -20, hc, i % 2 === 0 ? 0 : 1.0)
        ),
      };
    },
  },
  {
    id: 'figure-eight',
    name: 'Kaheksa (6 takistust)',
    description: '2 ringi, risti keskel. Pöördevõime.',
    category: 'exercise',
    heightCm: 100,
    requiredArena: { width: 50, height: 40 },
    build: (w, h, hc) => {
      const cx = w / 2;
      const cy = h / 2;
      return {
        obstacles: [
          mkObs('vertical', cx - 15, cy - 10, 0, hc),
          mkObs('oxer', cx - 5, cy + 10, 90, hc, 1.0),
          mkObs('vertical', cx + 15, cy + 10, 180, hc),
          mkObs('vertical', cx + 15, cy - 10, 180, hc),
          mkObs('oxer', cx + 5, cy - 10, 270, hc, 1.0),
          mkObs('vertical', cx - 15, cy + 10, 0, hc),
        ],
      };
    },
  },
  {
    id: 'standard-10',
    name: 'Standard 10-takistuse rada',
    description: 'Täisrada: 10 numereeritud takistust + kombinatsioon.',
    category: 'full-course',
    heightCm: 100,
    requiredArena: { width: 60, height: 40 },
    build: (w, h, hc) => {
      const comboId = uid();
      return {
        obstacles: [
          { ...mkObs('vertical', w * 0.2, h * 0.3, 0, hc - 10), number: 1 },
          { ...mkObs('oxer', w * 0.6, h * 0.3, 0, hc, 1.0), number: 2 },
          { ...mkObs('vertical', w * 0.85, h * 0.55, 90, hc), number: 3 },
          { ...mkObs('oxer', w * 0.6, h * 0.75, 180, hc, 1.2), number: 4 },
          { ...mkObs('vertical', w * 0.3, h * 0.7, 180, hc), number: 5 },
          { ...mkObs('vertical', w * 0.15, h * 0.55, 270, hc), number: 6 },
          { ...mkObs('wall', w * 0.4, h * 0.4, 45, hc, 0.4), number: 7 },
          { ...mkObs('vertical', w * 0.65, h * 0.55, 0, hc), number: 8, comboGroupId: comboId, letter: 'a' },
          { ...mkObs('oxer', w * 0.75, h * 0.55, 0, hc, 1.2), number: 8, comboGroupId: comboId, letter: 'b' },
          { ...mkObs('oxer', w * 0.45, h * 0.6, 180, hc + 10, 1.5), number: 9 },
          { ...mkObs('liverpool', w * 0.25, h * 0.4, 270, hc, 1.5), number: 10 },
        ],
        start: { x: w * 0.1, y: h * 0.5, rotation: 0 },
        finish: { x: w * 0.1, y: h * 0.3, rotation: 0 },
      };
    },
  },
];
