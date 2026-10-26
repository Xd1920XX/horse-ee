import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SiteNav } from '../components/SiteNav';
import { useAuth } from '../auth/AuthProvider';
import { getCompetition } from '../domain/competitions';
import { listClasses } from '../domain/classes';
import { listHorses } from '../domain/horses';
import { createRegistration } from '../domain/registrations';
import { Competition, CompetitionClass, Horse } from '../domain/types';

export function RegisterForCompetitionPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const nav = useNavigate();
  const [comp, setComp] = useState<Competition | null>(null);
  const [classes, setClasses] = useState<CompetitionClass[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [selectedHorse, setSelectedHorse] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!id || !user) return;
    getCompetition(id).then(setComp);
    listClasses(id).then(setClasses);
    listHorses(user.uid).then(setHorses);
  }, [id, user]);

  if (!user || !comp) {
    return (
      <div className="page">
        <SiteNav />
        <main className="container"><p className="muted">Laadin…</p></main>
      </div>
    );
  }

  if (comp.status !== 'open') {
    return (
      <div className="page">
        <SiteNav />
        <main className="container">
          <h1>Registreerimine suletud</h1>
          <p className="muted">Võistlus pole hetkel registreerimiseks avatud.</p>
          <Link to={`/competitions/${comp.id}`}>← Tagasi</Link>
        </main>
      </div>
    );
  }

  const toggleClass = (classId: string) => {
    const next = new Set(selectedClasses);
    next.has(classId) ? next.delete(classId) : next.add(classId);
    setSelectedClasses(next);
  };

  const submit = async () => {
    if (!selectedHorse) { setMsg('Vali hobune'); return; }
    if (!selectedClasses.size) { setMsg('Vali vähemalt üks klass'); return; }
    const horse = horses.find((h) => h.id === selectedHorse)!;
    setBusy(true);
    try {
      for (const classId of selectedClasses) {
        await createRegistration(comp.id, {
          riderUid: user.uid,
          riderDisplayName: user.displayName,
          horseId: horse.id,
          horseName: horse.name,
          classId,
          status: 'pending',
        });
      }
      nav('/my/entries');
    } catch (e: any) {
      setMsg(e.message ?? 'Viga');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <SiteNav />
      <main className="container">
        <Link to={`/competitions/${comp.id}`} className="muted" style={{ fontSize: 13 }}>← {comp.name}</Link>
        <h1 style={{ marginTop: 4 }}>Registreeri</h1>

        <div className="form-card">
          <h3>1. Vali hobune</h3>
          {horses.length === 0 ? (
            <div className="empty-msg">
              Pole hobuseid. <Link to="/my/horses">Lisa hobune</Link>
            </div>
          ) : (
            <div className="row">
              <label>Hobune</label>
              <select value={selectedHorse} onChange={(e) => setSelectedHorse(e.target.value)}>
                <option value="">— Vali —</option>
                {horses.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}{h.breed ? ` (${h.breed})` : ''}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="form-card">
          <h3>2. Vali klassid</h3>
          {classes.map((cl) => (
            <label key={cl.id} className="checkbox-row">
              <input
                type="checkbox"
                checked={selectedClasses.has(cl.id)}
                onChange={() => toggleClass(cl.id)}
              />
              <span style={{ marginLeft: 8 }}>
                <b>{cl.name}</b>
                <span className="muted"> · {cl.heightCm === 0 ? 'maalatt' : `${cl.heightCm} cm`}</span>
                {cl.entryFeeCents != null && <span className="muted"> · {(cl.entryFeeCents / 100).toFixed(2)} €</span>}
              </span>
            </label>
          ))}
        </div>

        {msg && <div className="auth-error">{msg}</div>}
        <button
          className="btn primary"
          disabled={busy || !horses.length}
          onClick={submit}
          style={{ marginTop: 16 }}
        >
          {busy ? 'Saadan…' : 'Esita registreering'}
        </button>
        <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          Registreering saadetakse ootele. Korraldaja kinnitab eraldi.
        </p>
      </main>
    </div>
  );
}
