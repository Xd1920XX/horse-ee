import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Competition, CompetitionClass, Registration } from '../domain/types';
import { getCompetition } from '../domain/competitions';
import { listRegistrations } from '../domain/registrations';
import { watchClasses } from '../domain/classes';
import { SiteNav } from '../components/SiteNav';
import { Protocol } from '../components/competition/Protocol';
import { useAuth } from '../auth/AuthProvider';

export function CompetitionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [comp, setComp] = useState<Competition | null>(null);
  const [classes, setClasses] = useState<CompetitionClass[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);

  useEffect(() => {
    if (!id) return;
    getCompetition(id).then(setComp);
    listRegistrations(id).then(setRegs);
    return watchClasses(id, setClasses);
  }, [id]);

  if (!comp) {
    return (
      <div className="page">
        <SiteNav />
        <main className="container"><p className="muted">Laadin…</p></main>
      </div>
    );
  }

  const dateStr = new Date(comp.date).toLocaleDateString('et-EE', {
    day: 'numeric', month: 'long', year: 'numeric', weekday: 'long',
  });
  const deadlineStr = new Date(comp.registrationDeadline).toLocaleDateString('et-EE');

  return (
    <div className="page">
      <SiteNav />
      <main className="container">
        <Link to="/competitions" className="muted" style={{ fontSize: 13 }}>← Võistlused</Link>
        <h1 style={{ marginTop: 4 }}>{comp.name}</h1>
        <div className="comp-meta">
          <div><b>Koht:</b> {comp.venue}</div>
          <div><b>Kuupäev:</b> {dateStr}</div>
          <div><b>Registreerimine lõpeb:</b> {deadlineStr}</div>
        </div>
        {comp.description && <p>{comp.description}</p>}

        <h2>Klassid</h2>
        {classes.length === 0 && <div className="empty-msg">Klassid pole veel lisatud.</div>}
        <table className="class-table">
          <thead>
            <tr>
              <th>Nr</th>
              <th>Nimi</th>
              <th>Kõrgus</th>
              <th>Reeglid</th>
              <th>Ajalimiit</th>
              <th>Osalejad</th>
              <th>Tasu</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((cl, i) => {
              const n = regs.filter((r) => r.classId === cl.id && r.status === 'confirmed').length;
              return (
                <tr key={cl.id}>
                  <td>{i + 1}</td>
                  <td>{cl.name}</td>
                  <td>{cl.heightCm === 0 ? 'Maalatt' : `${cl.heightCm} cm`}</td>
                  <td>{cl.rules}</td>
                  <td>{cl.timeLimitSeconds}s</td>
                  <td>{n}</td>
                  <td>{cl.entryFeeCents != null ? `${(cl.entryFeeCents / 100).toFixed(2)} €` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {(() => {
          const isOrganizer = user && comp.organizerUid === user.uid;
          const canRegister = comp.status === 'open' || isOrganizer;
          return (
            <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {canRegister && user && (
                <Link to={`/competitions/${id}/register`} className="btn primary">
                  🏇 Registreeri {isOrganizer && comp.status !== 'open' ? '(sinu võistlus)' : ''}
                </Link>
              )}
              {!user && comp.status === 'open' && (
                <Link to="/login" className="btn primary">Logi sisse registreerimiseks</Link>
              )}
              {isOrganizer && (
                <Link to={`/manage/competitions/${id}`} className="btn">⚙ Halda võistlust</Link>
              )}
            </div>
          );
        })()}

        {comp.status === 'draft' && !user && (
          <div className="empty-msg" style={{ marginTop: 20 }}>
            Võistlus on mustand. Avalik registreerimine veel suletud.
          </div>
        )}

        {(comp.status === 'running' || comp.status === 'finished') && (
          <div style={{ marginTop: 32 }}>
            <Protocol compId={comp.id} />
          </div>
        )}
      </main>
    </div>
  );
}
