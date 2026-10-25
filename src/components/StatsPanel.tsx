import { useStore } from '../store';
import { totalPathLength, sortedByNumber } from '../geometry';
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
