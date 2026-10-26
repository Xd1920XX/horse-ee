import { useStore } from '../store';

export function CourseLibrary() {
  const course = useStore((s) => s.course);
  const library = useStore((s) => s.library);
  const saveToLibrary = useStore((s) => s.saveToLibrary);
  const switchToCourse = useStore((s) => s.switchToCourse);
  const deleteFromLibrary = useStore((s) => s.deleteFromLibrary);
  const newCourse = useStore((s) => s.newCourse);

  const current = library.find((c) => c.id === course.id);

  return (
    <div>
      <h3>Minu rajad</h3>
      <div className="btn-group">
        <button onClick={() => saveToLibrary()} className="primary">
          {current ? 'Salvesta' : 'Lisa teeki'}
        </button>
        <button onClick={() => newCourse('Uus rada')}>+ Uus</button>
      </div>
      <p style={{ fontSize: 11, color: '#64748b', margin: '6px 0 10px' }}>
        Hoia mitut rada korraga. Teegi säilitatakse brauseris.
      </p>
      {library.length === 0 && <div className="empty-msg">Teek tühi.</div>}
      {library.map((c) => (
        <div
          key={c.id}
          className="library-item"
          style={{
            padding: '8px 10px',
            marginBottom: 4,
            borderRadius: 4,
            border: '1px solid',
            borderColor: c.id === course.id ? '#fbbf24' : '#334155',
            background: c.id === course.id ? '#422006' : 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ flex: 1, overflow: 'hidden' }} onClick={() => switchToCourse(c.id)}>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {c.name}
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>
              {c.obstacles.length} tak · {c.heightClass || 0} cm
            </div>
          </div>
          <button
            onClick={() => confirm(`Kustuta "${c.name}"?`) && deleteFromLibrary(c.id)}
            style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer' }}
            title="Kustuta"
          >
            🗑
          </button>
        </div>
      ))}
    </div>
  );
}
