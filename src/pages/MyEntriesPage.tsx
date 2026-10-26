import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SiteNav } from '../components/SiteNav';
import { useAuth } from '../auth/AuthProvider';
import { watchCompetitions } from '../domain/competitions';
import { listClasses } from '../domain/classes';
import { listRegistrations, updateRegistration } from '../domain/registrations';
import { Competition, CompetitionClass, Registration } from '../domain/types';
import { formatDate } from '../utils/timeFormat';

type Entry = {
  comp: Competition;
  cls: CompetitionClass | undefined;
  reg: Registration;
};

export function MyEntriesPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    if (!user) return;
    return watchCompetitions(async (comps) => {
      const all: Entry[] = [];
      for (const comp of comps) {
        const regs = await listRegistrations(comp.id);
        const mine = regs.filter((r) => r.riderUid === user.uid);
        if (!mine.length) continue;
        const classes = await listClasses(comp.id);
        for (const reg of mine) {
          const cls = classes.find((c) => c.id === reg.classId);
          all.push({ comp, cls, reg });
        }
      }
      setEntries(all);
    });
  }, [user]);

  if (!user) return null;

  const withdraw = async (e: Entry) => {
    if (!confirm(`Tühista registreering: ${e.comp.name} / ${e.cls?.name ?? ''}?`)) return;
    await updateRegistration(e.comp.id, e.reg.id, { status: 'withdrawn' });
  };

  const STATUS: Record<string, { label: string; color: string }> = {
    pending:   { label: 'Ootel',       color: '#f97316' },
    confirmed: { label: 'Kinnitatud',  color: '#22c55e' },
    rejected:  { label: 'Keeldutud',   color: '#ef4444' },
    withdrawn: { label: 'Tühistatud',  color: '#64748b' },
  };

  return (
    <div className="page">
      <SiteNav />
      <main className="container">
        <h1>Minu registreeringud</h1>
        {entries.length === 0 && (
          <div className="empty-msg">
            Pole registreeringuid. <Link to="/competitions">Vaata võistlusi</Link>
          </div>
        )}
        <table className="class-table">
          <thead>
            <tr>
              <th>Võistlus</th>
              <th>Kuupäev</th>
              <th>Klass</th>
              <th>Hobune</th>
              <th>Olek</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => {
              const st = STATUS[e.reg.status];
              return (
                <tr key={i}>
                  <td><Link to={`/competitions/${e.comp.id}`}>{e.comp.name}</Link></td>
                  <td>{formatDate(e.comp.date)}</td>
                  <td>{e.cls?.name ?? '—'}</td>
                  <td>{e.reg.horseName}</td>
                  <td><span className="status-pill" style={{ background: st.color }}>{st.label}</span></td>
                  <td>
                    {e.reg.status !== 'withdrawn' && e.reg.status !== 'rejected' && (
                      <button onClick={() => withdraw(e)}>Tühista</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </main>
    </div>
  );
}
