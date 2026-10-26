import { useEffect, useState } from 'react';
import { CompetitionClass, Registration } from '../../domain/types';
import { watchClasses } from '../../domain/classes';
import { updateRegistration, watchRegistrations } from '../../domain/registrations';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f97316',
  confirmed: '#22c55e',
  rejected: '#ef4444',
  withdrawn: '#64748b',
};

export function RegistrationList({ compId }: { compId: string }) {
  const [regs, setRegs] = useState<Registration[]>([]);
  const [classes, setClasses] = useState<CompetitionClass[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => watchRegistrations(compId, setRegs), [compId]);
  useEffect(() => watchClasses(compId, setClasses), [compId]);

  const classMap = new Map(classes.map((c) => [c.id, c]));

  const set = async (r: Registration, status: Registration['status']) => {
    await updateRegistration(compId, r.id, { status });
  };

  const visible = filter ? regs.filter((r) => r.classId === filter) : regs;

  return (
    <div>
      <h2>Registreeringud ({regs.length})</h2>
      <div className="row">
        <label>Klass</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Kõik</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <table className="class-table" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>Ratsutaja</th>
            <th>Hobune</th>
            <th>Klass</th>
            <th>Olek</th>
            <th>Tegevused</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => {
            const cl = classMap.get(r.classId);
            return (
              <tr key={r.id}>
                <td>{r.riderDisplayName}</td>
                <td>{r.horseName}</td>
                <td>{cl?.name ?? '—'}</td>
                <td>
                  <span className="status-pill" style={{ background: STATUS_COLORS[r.status] }}>
                    {r.status}
                  </span>
                </td>
                <td>
                  {r.status === 'pending' && (
                    <>
                      <button onClick={() => set(r, 'confirmed')}>Kinnita</button>
                      <button className="danger" onClick={() => set(r, 'rejected')}>Keeldu</button>
                    </>
                  )}
                  {r.status === 'confirmed' && (
                    <button onClick={() => set(r, 'pending')}>Taasta ootele</button>
                  )}
                  {r.status === 'rejected' && (
                    <button onClick={() => set(r, 'pending')}>Taasta ootele</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
