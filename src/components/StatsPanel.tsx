import { useStore } from '../store';
import { dist, totalPathLength, sortedByNumber } from '../geometry';
import { computeEquipment } from '../equipment';
import { OBSTACLE_LABELS, SPEED_PRESETS } from '../types';

export function StatsPanel() {
  const course = useStore((s) => s.course);
  const setSpeed = useStore((s) => s.setSpeed);
  const length = totalPathLength(course.start, course.obstacles, course.finish);
  const ordered = sortedByNumber(course.obstacles);
  const timeSec = length / (course.speedMpm / 60);
  const timeLimit = Math.ceil(timeSec * 1.2);
  const equip = computeEquipment(course.obstacles);

  // count by type
  const typeCounts: Record<string, number> = {};
  for (const o of course.obstacles) typeCounts[o.type] = (typeCounts[o.type] ?? 0) + 1;

  // Sharpest turn across the ride, in degrees
  let sharpestTurn = 0;
  if (ordered.length >= 1) {
    const chain = [
      { x: course.start.x, y: course.start.y },
      ...ordered.map((o) => ({ x: o.x, y: o.y })),
      { x: course.finish.x, y: course.finish.y },
    ];
    for (let i = 1; i < chain.length - 1; i++) {
      const inA = Math.atan2(chain[i].y - chain[i - 1].y, chain[i].x - chain[i - 1].x);
      const outA = Math.atan2(chain[i + 1].y - chain[i].y, chain[i + 1].x - chain[i].x);
      let d = Math.abs(((outA - inA) * 180) / Math.PI);
      if (d > 180) d = 360 - d;
      if (d > sharpestTurn) sharpestTurn = d;
    }
  }

  // Shortest between-jump distance (non-combo)
  let shortestLeg = Infinity;
  for (let i = 0; i < ordered.length - 1; i++) {
    const a = ordered[i];
    const b = ordered[i + 1];
    if (a.comboGroupId && a.comboGroupId === b.comboGroupId) continue;
    const d = dist(a, b);
    if (d < shortestLeg) shortestLeg = d;
  }
  if (shortestLeg === Infinity) shortestLeg = 0;

  // Difficulty score — weighted mix of count, max height, sharpest turn, combos, technical types
  const maxH = course.obstacles.reduce((m, o) => Math.max(m, o.height), 0);
  const comboCount = new Set(course.obstacles.filter((o) => o.comboGroupId).map((o) => o.comboGroupId)).size;
  const technical = course.obstacles.filter((o) => o.type === 'wall' || o.type === 'liverpool' || o.type === 'water' || o.type === 'triple').length;
  const score =
    course.obstacles.length * 2 +
    (maxH / 10) +
    (sharpestTurn / 10) +
    comboCount * 5 +
    technical * 3;
  const diff = score < 25 ? { label: 'Lihtne', color: '#22c55e' } :
               score < 45 ? { label: 'Keskmine', color: '#fbbf24' } :
               score < 65 ? { label: 'Raske', color: '#f97316' } :
                            { label: 'Grand Prix', color: '#ef4444' };

  return (
    <div>
      <h3>Statistika</h3>
      <div className="stat-row"><span>Takistusi</span><b>{course.obstacles.length}</b></div>
      <div className="stat-row"><span>Numereeritud</span><b>{ordered.length}</b></div>
      <div className="stat-row"><span>Rajajoone pikkus</span><b>{length.toFixed(1)} m</b></div>
      <div className="row" style={{ marginTop: 6 }}>
        <label>Kiirus</label>
        <select value={course.speedMpm} onChange={(e) => setSpeed(+e.target.value)}>
          {SPEED_PRESETS.map((p) => (
            <option key={p.mpm} value={p.mpm}>{p.label}</option>
          ))}
        </select>
      </div>
      <div className="stat-row"><span>Ideaalne aeg</span><b>{Math.floor(timeSec / 60)}:{String(Math.round(timeSec % 60)).padStart(2, '0')}</b></div>
      <div className="stat-row"><span>Ajalimiit (1.2x)</span><b>{Math.floor(timeLimit / 60)}:{String(timeLimit % 60).padStart(2, '0')}</b></div>
      <div className="stat-row">
        <span>Raskusaste</span>
        <b style={{ background: diff.color, color: '#0f172a', padding: '2px 8px', borderRadius: 4 }}>{diff.label}</b>
      </div>
      <div className="stat-row"><span>Teravaim pööre</span><b>{sharpestTurn.toFixed(0)}°</b></div>
      <div className="stat-row"><span>Lühim lõik</span><b>{shortestLeg ? shortestLeg.toFixed(1) + ' m' : '—'}</b></div>

      <h3 style={{ marginTop: 16 }}>Takistuste tüübid</h3>
      {Object.keys(typeCounts).length === 0 && <div className="empty-msg">—</div>}
      {Object.entries(typeCounts).map(([t, n]) => (
        <div key={t} className="stat-row"><span>{OBSTACLE_LABELS[t as keyof typeof OBSTACLE_LABELS] ?? t}</span><b>{n}</b></div>
      ))}

      <h3 style={{ marginTop: 16 }}>Varustus</h3>
      <div className="stat-row"><span>Posid</span><b>{equip.poles}</b></div>
      <div className="stat-row"><span>Tassid</span><b>{equip.cups}</b></div>
      <div className="stat-row"><span>Standardid</span><b>{equip.standards}</b></div>
      <div className="stat-row"><span>Müüriblokid</span><b>{equip.wallBlocks}</b></div>
      <div className="stat-row"><span>Liverpool-vann</span><b>{equip.liverpoolTrays}</b></div>
      <div className="stat-row"><span>Lipupaarid</span><b>{equip.flagsPairs}</b></div>
    </div>
  );
}
