import { useStore } from '../store';

export function Minimap() {
  const course = useStore((s) => s.course);
  const selectedIds = useStore((s) => s.selectedIds);
  const W = 160;
  const H = (W * course.arena.height) / course.arena.width;
  const s = W / course.arena.width;

  return (
    <div style={{ padding: '8px 0' }}>
      <svg width={W} height={H} style={{ background: '#86a76b', border: '1px solid #334155', borderRadius: 4, display: 'block' }}>
        {course.obstacles.map((o) => (
          <circle
            key={o.id}
            cx={o.x * s}
            cy={o.y * s}
            r={selectedIds.includes(o.id) ? 4 : 2.5}
            fill={selectedIds.includes(o.id) ? '#fbbf24' : o.comboGroupId ? '#a855f7' : '#1e293b'}
          />
        ))}
        <rect x={course.start.x * s - 3} y={course.start.y * s - 3} width={6} height={6} fill="#22c55e" />
        <rect x={course.finish.x * s - 3} y={course.finish.y * s - 3} width={6} height={6} fill="#ef4444" />
      </svg>
    </div>
  );
}
