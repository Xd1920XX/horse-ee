import { create } from 'zustand';
import {
  Arena,
  BackgroundImage,
  Course,
  Decoration,
  DecorationType,
  DEFAULT_OBSTACLE,
  Marker,
  Obstacle,
  ObstacleType,
  ToolMode,
} from './types';

const uid = () => Math.random().toString(36).slice(2, 10);

const defaultArena: Arena = { width: 70, height: 40, indoor: false, surface: 'sand' };

const defaultCourse = (): Course => ({
  id: uid(),
  name: 'Uus rada',
  arena: defaultArena,
  obstacles: [],
  decorations: [],
  start: { x: 5, y: 35, rotation: 0 },
  finish: { x: 65, y: 35, rotation: 0 },
  heightClass: 110,
  speedMpm: 350,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

type HistorySnapshot = Course;

type State = {
  course: Course;
  selectedIds: string[];
  showGrid: boolean;
  showDistances: boolean;
  showPath: boolean;
  showFlags: boolean;
  snap: number;             // meters snap step; 0 = no snap
  tool: ToolMode;
  pendingObstacleType: ObstacleType | null;
  pendingDecorationType: DecorationType | null;
  rulerPoints: { x: number; y: number }[];
  zoom: number;             // user zoom multiplier
  pan: { x: number; y: number }; // pan in pixels
  history: HistorySnapshot[];
  future: HistorySnapshot[];

  // course
  setCourse: (c: Course) => void;
  setArena: (patch: Partial<Arena>) => void;
  setName: (name: string) => void;
  setHeightClass: (h: number) => void;
  setSpeed: (mpm: number) => void;
  setNotes: (notes: string) => void;
  setBackground: (bg?: BackgroundImage) => void;
  updateBackground: (patch: Partial<BackgroundImage>) => void;

  // obstacles
  addObstacle: (type: ObstacleType, x: number, y: number) => string;
  updateObstacle: (id: string, patch: Partial<Obstacle>) => void;
  deleteObstacle: (id: string) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  moveSelectedBy: (dx: number, dy: number) => void;
  rotateSelectedBy: (deg: number) => void;
  groupSelectedAsCombination: () => void;
  ungroupCombination: (comboId: string) => void;
  autoDetectCombinations: () => void;

  // decorations
  addDecoration: (type: DecorationType, x: number, y: number) => void;
  updateDecoration: (id: string, patch: Partial<Decoration>) => void;
  deleteDecoration: (id: string) => void;

  // markers
  moveMarker: (which: 'start' | 'finish', patch: Partial<Marker>) => void;

  // numbering
  autoNumber: () => void;
  clearNumbers: () => void;

  // selection
  select: (id: string | null) => void;
  toggleSelect: (id: string) => void;
  selectMany: (ids: string[]) => void;
  clearSelection: () => void;

  // tool mode
  setTool: (t: ToolMode) => void;
  setPendingObstacle: (t: ObstacleType | null) => void;
  setPendingDecoration: (t: DecorationType | null) => void;
  addRulerPoint: (x: number, y: number) => void;
  moveRulerPoint: (index: number, x: number, y: number) => void;
  clearRuler: () => void;

  // view
  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
  resetView: () => void;

  // layer toggles
  toggleGrid: () => void;
  toggleDistances: () => void;
  togglePath: () => void;
  toggleFlags: () => void;
  setSnap: (s: number) => void;

  // course ops
  mirrorHorizontal: () => void;
  mirrorVertical: () => void;
  rotateCourse: (deg: 90 | 180 | 270) => void;
  clearObstacles: () => void;

  // history
  undo: () => void;
  redo: () => void;
  reset: () => void;
  loadJSON: (json: string) => boolean;

  // library (multiple saved courses)
  library: Course[];
  reloadLibrary: () => void;
  saveToLibrary: (overrides?: Partial<Course>) => void;    // upsert current
  switchToCourse: (id: string) => void;
  deleteFromLibrary: (id: string) => void;
  newCourse: (name?: string) => void;
};

const snap = (c: Course): HistorySnapshot => JSON.parse(JSON.stringify(c));

const commit = (set: any, get: any, mutator: (c: Course) => Course) => {
  const prev = get().course;
  const next = mutator(snap(prev));
  next.updatedAt = Date.now();
  set({ course: next, history: [...get().history, snap(prev)].slice(-50), future: [] });
};

const applySnap = (v: number, step: number) => (step > 0 ? Math.round(v / step) * step : v);

export const useStore = create<State>((set, get) => ({
  course: defaultCourse(),
  selectedIds: [],
  showGrid: true,
  showDistances: true,
  showPath: true,
  showFlags: true,
  snap: 0.5,
  tool: 'select',
  pendingObstacleType: null,
  pendingDecorationType: null,
  rulerPoints: [],
  zoom: 1,
  pan: { x: 0, y: 0 },
  history: [],
  future: [],

  setCourse: (c) => commit(set, get, () => c),
  setArena: (patch) => commit(set, get, (c) => ({ ...c, arena: { ...c.arena, ...patch } })),
  setName: (name) => commit(set, get, (c) => ({ ...c, name })),
  setHeightClass: (h) => commit(set, get, (c) => ({ ...c, heightClass: h })),
  setSpeed: (mpm) => commit(set, get, (c) => ({ ...c, speedMpm: mpm })),
  setNotes: (notes) => commit(set, get, (c) => ({ ...c, notes })),
  setBackground: (bg) => commit(set, get, (c) => ({ ...c, background: bg })),
  updateBackground: (patch) =>
    commit(set, get, (c) => ({ ...c, background: c.background ? { ...c.background, ...patch } : c.background })),

  addObstacle: (type, x, y) => {
    const id = uid();
    const d = DEFAULT_OBSTACLE[type];
    const s = get().snap;
    commit(set, get, (c) => ({
      ...c,
      obstacles: [
        ...c.obstacles,
        {
          id,
          type,
          x: applySnap(x, s),
          y: applySnap(y, s),
          rotation: 0,
          width: d.width ?? 3.5,
          spread: d.spread ?? 0,
          height: d.height ?? get().course.heightClass,
        },
      ],
    }));
    set({ selectedIds: [id] });
    return id;
  },

  updateObstacle: (id, patch) => {
    const s = get().snap;
    const snapped: Partial<Obstacle> = { ...patch };
    if (snapped.x != null) snapped.x = applySnap(snapped.x, s);
    if (snapped.y != null) snapped.y = applySnap(snapped.y, s);
    commit(set, get, (c) => ({
      ...c,
      obstacles: c.obstacles.map((o) => (o.id === id ? { ...o, ...snapped } : o)),
    }));
  },

  deleteObstacle: (id) => {
    commit(set, get, (c) => ({ ...c, obstacles: c.obstacles.filter((o) => o.id !== id) }));
    set({ selectedIds: get().selectedIds.filter((x) => x !== id) });
  },

  deleteSelected: () => {
    const ids = new Set(get().selectedIds);
    if (!ids.size) return;
    commit(set, get, (c) => ({
      ...c,
      obstacles: c.obstacles.filter((o) => !ids.has(o.id)),
      decorations: c.decorations.filter((d) => !ids.has(d.id)),
    }));
    set({ selectedIds: [] });
  },

  duplicateSelected: () => {
    const ids = new Set(get().selectedIds);
    const newIds: string[] = [];
    commit(set, get, (c) => {
      const addedObs: Obstacle[] = [];
      c.obstacles.forEach((o) => {
        if (ids.has(o.id)) {
          const copy: Obstacle = { ...o, id: uid(), x: o.x + 2, y: o.y + 2, number: undefined, letter: undefined, comboGroupId: undefined };
          newIds.push(copy.id);
          addedObs.push(copy);
        }
      });
      const addedDec: Decoration[] = [];
      c.decorations.forEach((d) => {
        if (ids.has(d.id)) {
          const copy: Decoration = { ...d, id: uid(), x: d.x + 2, y: d.y + 2 };
          newIds.push(copy.id);
          addedDec.push(copy);
        }
      });
      return { ...c, obstacles: [...c.obstacles, ...addedObs], decorations: [...c.decorations, ...addedDec] };
    });
    set({ selectedIds: newIds });
  },

  moveSelectedBy: (dx, dy) => {
    const ids = new Set(get().selectedIds);
    const s = get().snap;
    const stepX = s > 0 ? Math.sign(dx) * Math.max(Math.abs(dx), s) : dx;
    const stepY = s > 0 ? Math.sign(dy) * Math.max(Math.abs(dy), s) : dy;
    commit(set, get, (c) => ({
      ...c,
      obstacles: c.obstacles.map((o) =>
        ids.has(o.id)
          ? {
              ...o,
              x: Math.max(0, Math.min(c.arena.width, applySnap(o.x + stepX, s))),
              y: Math.max(0, Math.min(c.arena.height, applySnap(o.y + stepY, s))),
            }
          : o
      ),
      decorations: c.decorations.map((d) =>
        ids.has(d.id)
          ? {
              ...d,
              x: Math.max(0, Math.min(c.arena.width, applySnap(d.x + stepX, s))),
              y: Math.max(0, Math.min(c.arena.height, applySnap(d.y + stepY, s))),
            }
          : d
      ),
    }));
  },

  rotateSelectedBy: (deg) => {
    const ids = new Set(get().selectedIds);
    commit(set, get, (c) => ({
      ...c,
      obstacles: c.obstacles.map((o) =>
        ids.has(o.id) ? { ...o, rotation: (o.rotation + deg + 360) % 360 } : o
      ),
      decorations: c.decorations.map((d) =>
        ids.has(d.id) ? { ...d, rotation: (d.rotation + deg + 360) % 360 } : d
      ),
    }));
  },

  groupSelectedAsCombination: () => {
    const ids = get().selectedIds;
    if (ids.length < 2 || ids.length > 3) return;
    const comboId = uid();
    const letters = ['a', 'b', 'c'];
    commit(set, get, (c) => {
      // keep selected order based on position (first = lowest x+y)
      const inSelection = c.obstacles.filter((o) => ids.includes(o.id));
      inSelection.sort((a, b) => a.x + a.y - (b.x + b.y));
      const letterMap = new Map(inSelection.map((o, i) => [o.id, letters[i]]));
      return {
        ...c,
        obstacles: c.obstacles.map((o) =>
          ids.includes(o.id) ? { ...o, comboGroupId: comboId, letter: letterMap.get(o.id) } : o
        ),
      };
    });
  },

  ungroupCombination: (comboId) => {
    commit(set, get, (c) => ({
      ...c,
      obstacles: c.obstacles.map((o) =>
        o.comboGroupId === comboId ? { ...o, comboGroupId: undefined, letter: undefined } : o
      ),
    }));
  },

  autoDetectCombinations: () => {
    const COMBO_MAX_DIST = 12;          // ≤12m between elements = combination (FEI style)
    const COMBO_ROT_TOLERANCE = 25;     // rotation diff in degrees — same direction of travel

    commit(set, get, (c) => {
      const taken = new Set<string>();
      const groups: string[][] = [];
      const list = c.obstacles.filter((o) => !o.comboGroupId); // only ungrouped candidates

      for (const a of list) {
        if (taken.has(a.id)) continue;
        const group = [a];
        taken.add(a.id);
        // extend group greedily with closest remaining obstacle
        let changed = true;
        while (changed && group.length < 3) {
          changed = false;
          let bestId: string | null = null;
          let bestD = Infinity;
          for (const b of list) {
            if (taken.has(b.id)) continue;
            // measure distance from any member in group
            const d = Math.min(...group.map((g) => Math.hypot(g.x - b.x, g.y - b.y)));
            if (d > COMBO_MAX_DIST) continue;
            // rotation within tolerance of group leader
            const rotDelta = Math.abs(((b.rotation - group[0].rotation + 540) % 360) - 180);
            // 180 = same direction, closer to 180 = better
            if (Math.abs(180 - rotDelta) > COMBO_ROT_TOLERANCE) continue;
            if (d < bestD) { bestD = d; bestId = b.id; }
          }
          if (bestId) {
            const b = list.find((o) => o.id === bestId)!;
            group.push(b);
            taken.add(b.id);
            changed = true;
          }
        }
        if (group.length >= 2) groups.push(group.map((o) => o.id));
      }

      if (!groups.length) return c;

      const letters = ['a', 'b', 'c'];
      const idToCombo = new Map<string, { comboId: string; letter: string }>();
      for (const g of groups) {
        const comboId = uid();
        // sort within group by position along the leader rotation direction
        const sorted = g
          .map((id) => c.obstacles.find((o) => o.id === id)!)
          .sort((a, b) => {
            const rad = (a.rotation * Math.PI) / 180;
            const projA = a.x * Math.cos(rad) + a.y * Math.sin(rad);
            const projB = b.x * Math.cos(rad) + b.y * Math.sin(rad);
            return projA - projB;
          });
        sorted.forEach((o, i) => idToCombo.set(o.id, { comboId, letter: letters[i] }));
      }

      return {
        ...c,
        obstacles: c.obstacles.map((o) => {
          const g = idToCombo.get(o.id);
          return g ? { ...o, comboGroupId: g.comboId, letter: g.letter } : o;
        }),
      };
    });
  },

  addDecoration: (type, x, y) => {
    const id = uid();
    const s = get().snap;
    commit(set, get, (c) => ({
      ...c,
      decorations: [
        ...c.decorations,
        {
          id,
          type,
          x: applySnap(x, s),
          y: applySnap(y, s),
          rotation: 0,
          size: type === 'warmup' ? 10 : type === 'judge' || type === 'tent' ? 3 : 1,
          text: type === 'label' ? 'Silt' : undefined,
        },
      ],
    }));
    set({ selectedIds: [id] });
  },

  updateDecoration: (id, patch) => {
    const s = get().snap;
    const snapped: Partial<Decoration> = { ...patch };
    if (snapped.x != null) snapped.x = applySnap(snapped.x, s);
    if (snapped.y != null) snapped.y = applySnap(snapped.y, s);
    commit(set, get, (c) => ({
      ...c,
      decorations: c.decorations.map((d) => (d.id === id ? { ...d, ...snapped } : d)),
    }));
  },

  deleteDecoration: (id) => {
    commit(set, get, (c) => ({ ...c, decorations: c.decorations.filter((d) => d.id !== id) }));
  },

  moveMarker: (which, patch) => {
    const s = get().snap;
    const snapped: Partial<Marker> = { ...patch };
    if (snapped.x != null) snapped.x = applySnap(snapped.x, s);
    if (snapped.y != null) snapped.y = applySnap(snapped.y, s);
    commit(set, get, (c) => ({ ...c, [which]: { ...c[which], ...snapped } }));
  },

  autoNumber: () =>
    commit(set, get, (c) => {
      const remaining = [...c.obstacles];
      const ordered: Obstacle[] = [];
      // combos: keep order a,b,c; treat as a group starting at first element position
      const comboOrder = new Map<string, number>();
      let cur = { x: c.start.x, y: c.start.y };
      while (remaining.length) {
        let bestIdx = 0;
        let bestD = Infinity;
        for (let i = 0; i < remaining.length; i++) {
          const o = remaining[i];
          // skip combo b/c until a done
          if (o.comboGroupId && o.letter && o.letter !== 'a') continue;
          const d = (o.x - cur.x) ** 2 + (o.y - cur.y) ** 2;
          if (d < bestD) {
            bestD = d;
            bestIdx = i;
          }
        }
        // handle case all remaining are b/c (fallback)
        if (remaining.every((o) => o.comboGroupId && o.letter && o.letter !== 'a')) {
          const o = remaining[0];
          ordered.push(o);
          remaining.splice(0, 1);
          cur = { x: o.x, y: o.y };
          continue;
        }
        const picked = remaining.splice(bestIdx, 1)[0];
        ordered.push(picked);
        if (picked.comboGroupId) {
          // append b, c in order
          const siblings = remaining
            .filter((o) => o.comboGroupId === picked.comboGroupId)
            .sort((a, b) => (a.letter ?? '').localeCompare(b.letter ?? ''));
          for (const sib of siblings) {
            ordered.push(sib);
            remaining.splice(remaining.indexOf(sib), 1);
          }
          comboOrder.set(picked.comboGroupId, ordered.length);
        }
        cur = { x: picked.x, y: picked.y };
      }
      // assign numbers: combos share the leader number
      let nextNum = 1;
      const idToNum = new Map<string, number>();
      const comboNum = new Map<string, number>();
      for (const o of ordered) {
        if (o.comboGroupId) {
          if (!comboNum.has(o.comboGroupId)) {
            comboNum.set(o.comboGroupId, nextNum++);
          }
          idToNum.set(o.id, comboNum.get(o.comboGroupId)!);
        } else {
          idToNum.set(o.id, nextNum++);
        }
      }
      return {
        ...c,
        obstacles: c.obstacles.map((o) => ({ ...o, number: idToNum.get(o.id) })),
      };
    }),

  clearNumbers: () =>
    commit(set, get, (c) => ({
      ...c,
      obstacles: c.obstacles.map((o) => ({ ...o, number: undefined })),
    })),

  select: (id) => set({ selectedIds: id ? [id] : [] }),

  toggleSelect: (id) => {
    const cur = get().selectedIds;
    set({ selectedIds: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] });
  },

  selectMany: (ids) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),

  setTool: (t) => set({ tool: t, pendingObstacleType: null, pendingDecorationType: null, rulerPoints: [] }),
  setPendingObstacle: (t) => set({ pendingObstacleType: t, pendingDecorationType: null, tool: 'select' }),
  setPendingDecoration: (t) => set({ pendingDecorationType: t, pendingObstacleType: null, tool: t ? 'place-decoration' : 'select' }),
  addRulerPoint: (x, y) => {
    const pts = get().rulerPoints;
    set({ rulerPoints: pts.length >= 2 ? [{ x, y }] : [...pts, { x, y }] });
  },
  moveRulerPoint: (index, x, y) => {
    const pts = get().rulerPoints.slice();
    if (!pts[index]) return;
    pts[index] = { x, y };
    set({ rulerPoints: pts });
  },
  clearRuler: () => set({ rulerPoints: [] }),

  setZoom: (z) => set({ zoom: Math.max(0.3, Math.min(5, z)) }),
  setPan: (x, y) => set({ pan: { x, y } }),
  resetView: () => set({ zoom: 1, pan: { x: 0, y: 0 } }),

  toggleGrid: () => set({ showGrid: !get().showGrid }),
  toggleDistances: () => set({ showDistances: !get().showDistances }),
  togglePath: () => set({ showPath: !get().showPath }),
  toggleFlags: () => set({ showFlags: !get().showFlags }),
  setSnap: (s) => set({ snap: s }),

  mirrorHorizontal: () =>
    commit(set, get, (c) => ({
      ...c,
      obstacles: c.obstacles.map((o) => ({ ...o, x: c.arena.width - o.x, rotation: (180 - o.rotation + 360) % 360 })),
      decorations: c.decorations.map((d) => ({ ...d, x: c.arena.width - d.x })),
      start: { ...c.start, x: c.arena.width - c.start.x },
      finish: { ...c.finish, x: c.arena.width - c.finish.x },
    })),

  mirrorVertical: () =>
    commit(set, get, (c) => ({
      ...c,
      obstacles: c.obstacles.map((o) => ({ ...o, y: c.arena.height - o.y, rotation: (-o.rotation + 360) % 360 })),
      decorations: c.decorations.map((d) => ({ ...d, y: c.arena.height - d.y })),
      start: { ...c.start, y: c.arena.height - c.start.y },
      finish: { ...c.finish, y: c.arena.height - c.finish.y },
    })),

  rotateCourse: (deg) =>
    commit(set, get, (c) => {
      const cx = c.arena.width / 2;
      const cy = c.arena.height / 2;
      const rad = (deg * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const rot = (p: { x: number; y: number }) => {
        const dx = p.x - cx;
        const dy = p.y - cy;
        return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
      };
      return {
        ...c,
        obstacles: c.obstacles.map((o) => ({ ...o, ...rot(o), rotation: (o.rotation + deg) % 360 })),
        decorations: c.decorations.map((d) => ({ ...d, ...rot(d), rotation: (d.rotation + deg) % 360 })),
        start: { ...c.start, ...rot(c.start) },
        finish: { ...c.finish, ...rot(c.finish) },
      };
    }),

  clearObstacles: () => commit(set, get, (c) => ({ ...c, obstacles: [], decorations: [] })),

  undo: () => {
    const h = get().history;
    if (!h.length) return;
    const prev = h[h.length - 1];
    set({
      course: prev,
      history: h.slice(0, -1),
      future: [snap(get().course), ...get().future].slice(0, 50),
    });
  },

  redo: () => {
    const f = get().future;
    if (!f.length) return;
    const next = f[0];
    set({
      course: next,
      future: f.slice(1),
      history: [...get().history, snap(get().course)].slice(-50),
    });
  },

  reset: () => set({ course: defaultCourse(), selectedIds: [], history: [], future: [], rulerPoints: [] }),

  loadJSON: (json) => {
    try {
      const parsed = JSON.parse(json) as Course;
      if (!parsed.arena || !Array.isArray(parsed.obstacles)) return false;
      if (!Array.isArray(parsed.decorations)) parsed.decorations = [];
      if (!parsed.speedMpm) parsed.speedMpm = 350;
      set({ course: parsed, selectedIds: [], history: [], future: [] });
      return true;
    } catch {
      return false;
    }
  },

  library: (() => {
    try {
      const raw = localStorage.getItem('horse-course-library');
      return raw ? (JSON.parse(raw) as Course[]) : [];
    } catch {
      return [];
    }
  })(),

  reloadLibrary: () => {
    try {
      const raw = localStorage.getItem('horse-course-library');
      set({ library: raw ? (JSON.parse(raw) as Course[]) : [] });
    } catch {
      set({ library: [] });
    }
  },

  saveToLibrary: (overrides) => {
    const cur = get().course;
    const toSave: Course = { ...cur, ...overrides, updatedAt: Date.now() };
    const lib = get().library;
    const idx = lib.findIndex((c) => c.id === toSave.id);
    const next = idx >= 0 ? lib.map((c, i) => (i === idx ? toSave : c)) : [...lib, toSave];
    localStorage.setItem('horse-course-library', JSON.stringify(next));
    set({ library: next, course: toSave });
  },

  switchToCourse: (id) => {
    const lib = get().library;
    const found = lib.find((c) => c.id === id);
    if (!found) return;
    set({ course: JSON.parse(JSON.stringify(found)), selectedIds: [], history: [], future: [] });
  },

  deleteFromLibrary: (id) => {
    const next = get().library.filter((c) => c.id !== id);
    localStorage.setItem('horse-course-library', JSON.stringify(next));
    const activeNowStale = get().course.id === id;
    set({ library: next });
    if (activeNowStale) {
      // Current working course was deleted — switch to a fresh blank course so
      // the editor doesn't keep writing into a tombstoned id.
      set({ course: defaultCourse(), selectedIds: [], history: [], future: [] });
    }
  },

  newCourse: (name) => {
    const fresh = defaultCourse();
    if (name) fresh.name = name;
    set({ course: fresh, selectedIds: [], history: [], future: [] });
  },
}));
