import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { BACKEND_MODE } from '../firebase';
import { watchCompetitions } from '../domain/competitions';
import { Competition } from '../domain/types';
import { formatDate } from '../utils/timeFormat';

export function HomePage() {
  const { user, logout } = useAuth();
  const [comps, setComps] = useState<Competition[]>([]);

  useEffect(() => watchCompetitions(setComps), []);

  const upcoming = comps
    .filter((c) => c.status === 'open' || c.status === 'running')
    .slice(0, 3);
  const totalPublic = comps.filter((c) => c.status !== 'draft').length;

  return (
    <div className="landing">
      <header className="landing-header">
        <div className="brand">🐎 Horse-ee</div>
        <nav className="landing-nav">
          <Link to="/competitions">Võistlused</Link>
          <Link to="/designer">Rajadisainer</Link>
          {user ? (
            <>
              <Link to="/my/profile" className="user-chip">
                <span className="user-chip-name">{user.displayName}</span>
              </Link>
              <button onClick={logout}>Logi välja</button>
            </>
          ) : (
            <Link to="/login" className="btn-link">Logi sisse</Link>
          )}
        </nav>
      </header>

      <section className="hero">
        <h1>Ratsavõistlused teisel tasemel.</h1>
        <p>
          Kavanda radasid, korralda võistlusi, pea arvestust reaalajas.
          Eesti ratsaspordi klubidele, treeneritele ja ratsutajatele.
        </p>
        <div className="hero-stats">
          <div className="stat">
            <div className="stat-num">{totalPublic}</div>
            <div className="stat-label">Avalikku võistlust</div>
          </div>
          <div className="stat">
            <div className="stat-num">∞</div>
            <div className="stat-label">Radu teegis</div>
          </div>
          <div className="stat">
            <div className="stat-num">3D</div>
            <div className="stat-label">Rajavaade</div>
          </div>
        </div>
        <div className="hero-cta">
          {user ? (
            <>
              <Link to="/competitions" className="btn primary">Vaata võistlusi</Link>
              <Link to="/designer" className="btn">Loo rada</Link>
            </>
          ) : (
            <>
              <Link to="/register" className="btn primary">Alusta tasuta</Link>
              <Link to="/competitions" className="btn">Vaata võistlusi</Link>
            </>
          )}
        </div>
      </section>

      <section className="features">
        <Link to="/competitions" className="feature-card">
          <div className="feature-icon">🏆</div>
          <h2>Võistlused</h2>
          <p>
            Avalik võistluste nimekiri, klassid, ajakava ja live protokoll.
            Ratsutajana registreeri klassidesse, korraldajana loo uus võistlus.
          </p>
          <span className="feature-cta">Vaata võistlusi →</span>
        </Link>

        <Link to="/designer" className="feature-card">
          <div className="feature-icon">📐</div>
          <h2>Rajadisainer</h2>
          <p>
            Visuaalne 2D/3D tööriist takistussõidu radade kavandamiseks.
            Juhu-generaator, PDF eksport, FEI reeglid kontrollitud.
          </p>
          <span className="feature-cta">Loo rada →</span>
        </Link>
      </section>

      {upcoming.length > 0 && (
        <section className="hero-upcoming">
          <h2 style={{ textAlign: 'center', marginTop: 0 }}>Peagi algab</h2>
          <div className="upcoming-grid">
            {upcoming.map((c) => (
              <Link key={c.id} to={`/competitions/${c.id}`} className="comp-card">
                <div className="comp-card-head">
                  <span className="status-pill" style={{ color: c.status === 'running' ? '#ef4444' : '#22c55e' }}>
                    {c.status === 'running' ? 'KÄIMAS' : 'AVATUD'}
                  </span>
                  <span className="comp-date">{formatDate(c.date)}</span>
                </div>
                <h2>{c.name}</h2>
                <div className="muted">{c.venue}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="landing-footer">
        <small>
          🐎 Horse-ee · MVP demo ·{' '}
          {BACKEND_MODE === 'real' ? 'Firebase ühendatud' : 'Mock backend (brauseri localStorage)'}
        </small>
      </footer>
    </div>
  );
}
