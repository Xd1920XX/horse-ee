import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SiteNav } from '../components/SiteNav';
import { Competition } from '../domain/types';
import { getCompetition } from '../domain/competitions';
import { ScoreEntry } from '../components/competition/ScoreEntry';

export function LiveScoringPage() {
  const { id } = useParams<{ id: string }>();
  const [comp, setComp] = useState<Competition | null>(null);
  useEffect(() => { if (id) getCompetition(id).then(setComp); }, [id]);

  if (!comp) return <div className="page"><SiteNav /><main className="container">Laadin…</main></div>;

  return (
    <div className="page">
      <SiteNav />
      <main className="container">
        <Link to={`/manage/competitions/${comp.id}`} className="muted" style={{ fontSize: 13 }}>
          ← {comp.name}
        </Link>
        <h1>Live sisestus</h1>
        <ScoreEntry compId={comp.id} />
      </main>
    </div>
  );
}
