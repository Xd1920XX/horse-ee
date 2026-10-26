import { useEffect, useState } from 'react';
import { CompetitionClass } from '../../domain/types';
import { createClass, deleteClass, updateClass, watchClasses } from '../../domain/classes';
import { ClassForm } from './ClassForm';

export function ClassList({ compId }: { compId: string }) {
  const [classes, setClasses] = useState<CompetitionClass[]>([]);
  const [editing, setEditing] = useState<CompetitionClass | null>(null);
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => watchClasses(compId, setClasses), [compId]);

  const addNew = async (data: any) => {
    setErr('');
    try {
      await createClass(compId, data);
      setAdding(false);
    } catch (e: any) {
      setErr('Klassi lisamine ebaõnnestus: ' + (e?.code ?? '') + ' ' + (e?.message ?? e));
    }
  };
  const update = async (data: any) => {
    if (!editing) return;
    setErr('');
    try {
      await updateClass(compId, editing.id, data);
      setEditing(null);
    } catch (e: any) {
      setErr('Klassi uuendamine ebaõnnestus: ' + (e?.code ?? '') + ' ' + (e?.message ?? e));
    }
  };

  return (
    <div>
      <h2>Klassid</h2>
      {err && <div className="auth-error" style={{ marginBottom: 10 }}>{err}</div>}
      {!adding && !editing && (
        <button className="primary" onClick={() => setAdding(true)}>+ Lisa klass</button>
      )}
      {adding && (
        <ClassForm
          nextOrderIndex={classes.length}
          onSave={addNew}
          onCancel={() => setAdding(false)}
        />
      )}
      {editing && (
        <ClassForm
          initial={editing}
          nextOrderIndex={editing.orderIndex}
          onSave={update}
          onCancel={() => setEditing(null)}
        />
      )}

      <table className="class-table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>#</th>
            <th>Nimi</th>
            <th>Kõrgus</th>
            <th>Reeglid</th>
            <th>Aeg</th>
            <th>Tasu</th>
            <th>Rada</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {classes.map((cl, i) => (
            <tr key={cl.id}>
              <td>{i + 1}</td>
              <td>{cl.name}</td>
              <td>{cl.heightCm === 0 ? 'Maalatt' : `${cl.heightCm} cm`}</td>
              <td>{cl.rules}</td>
              <td>{cl.timeLimitSeconds}s</td>
              <td>{cl.entryFeeCents != null ? `${(cl.entryFeeCents / 100).toFixed(2)} €` : '—'}</td>
              <td>{cl.courseId ? '✓' : '—'}</td>
              <td>
                <button onClick={() => setEditing(cl)}>Muuda</button>
                <button className="danger" onClick={() => confirm(`Kustuta "${cl.name}"?`) && deleteClass(compId, cl.id)}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
