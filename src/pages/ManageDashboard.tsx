import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Competition } from '../domain/types';
import { watchCompetitions } from '../domain/competitions';
import { SiteNav } from '../components/SiteNav';
import { useAuth } from '../auth/AuthProvider';

export function ManageDashboard() {
  const { user } = useAuth();
  const [all, setAll] = useState<Competition[]>([]);
  useEffect(() => watchCompetitions(setAll), []);

  if (!user) {
    return (
      <div className="page">
        <SiteNav />
        <main className="container"><p>Logi sisse korraldajana.</p></main>
      </div>
    );
  }

  const mine = all.filter((c) => c.organizerUid === user.uid);

  return (
    <div className="page">
      <SiteNav />
      <main className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Minu võistlused</h1>
          {user.roles.organizer && (
            <Link to="/manage/competitions/new" className="btn primary">+ Uus võistlus</Link>
          )}
        </div>
        {!user.roles.organizer && (
          <div className="empty-msg">Sul pole korraldaja rolli. Küsi admini käest.</div>
        )}
        {mine.length === 0 && user.roles.organizer && (
          <p className="muted">Pole veel ühtegi võistlust loonud.</p>
        )}
        <div className="comp-grid">
          {mine.map((c) => (
            <Link key={c.id} to={`/manage/competitions/${c.id}`} className="comp-card">
              <div className="comp-card-head">
                <span className="status-pill" style={{ background: '#334155' }}>{c.status}</span>
              </div>
              <h2>{c.name}</h2>
              <div className="muted">{c.venue}</div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
