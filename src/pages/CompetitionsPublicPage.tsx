import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Competition } from '../domain/types';
import { watchCompetitions } from '../domain/competitions';
import { SiteNav } from '../components/SiteNav';
import { useAuth } from '../auth/AuthProvider';

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  draft:    { text: 'Mustand', color: '#64748b' },
  open:     { text: 'Registreerimine avatud', color: '#22c55e' },
  closed:   { text: 'Registreerimine lõppenud', color: '#f97316' },
  running:  { text: 'Käimas',   color: '#ef4444' },
  finished: { text: 'Lõppenud', color: '#334155' },
};

export function CompetitionsPublicPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Competition[]>([]);

  useEffect(() => {
    return watchCompetitions(setList);
  }, []);

  // Hide drafts from public, but show them to the organizer who owns them.
  const visible = list.filter((c) => c.status !== 'draft' || c.organizerUid === user?.uid);

  return (
    <div className="page">
      <SiteNav />
      <main className="container">
        <h1>Võistlused</h1>
        <p className="muted">Kõik eelseisvad ja käimasolevad võistlused.</p>

        {visible.length === 0 && <div className="empty-msg">Hetkel pole võistlusi.</div>}

        <div className="comp-grid">
          {visible.map((c) => {
            const status = STATUS_LABEL[c.status];
            const dateStr = new Date(c.date).toLocaleDateString('et-EE', { day: 'numeric', month: 'long', year: 'numeric' });
            return (
              <Link to={`/competitions/${c.id}`} key={c.id} className="comp-card">
                <div className="comp-card-head">
                  <span className="status-pill" style={{ background: status.color }}>{status.text}</span>
                  <span className="comp-date">{dateStr}</span>
                </div>
                <h2>{c.name}</h2>
                <div className="muted">{c.venue}</div>
                {c.description && <p className="comp-desc">{c.description}</p>}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
