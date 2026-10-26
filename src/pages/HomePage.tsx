import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { BACKEND_MODE } from '../firebase';

export function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="landing">
      <header className="landing-header">
        <div className="brand">🐎 Horse-ee</div>
        <nav className="landing-nav">
          <Link to="/competitions">Võistlused</Link>
          <Link to="/designer">Rajadisainer</Link>
          {user ? (
            <>
              <span style={{ color: '#94a3b8' }}>{user.displayName}</span>
              <button onClick={logout}>Logi välja</button>
            </>
          ) : (
            <Link to="/login" className="btn-link">Logi sisse</Link>
          )}
        </nav>
      </header>

      <section className="hero">
        <h1>Ratsavõistluste platvorm Eestile</h1>
        <p>Kavanda radasid, korralda võistlusi, pea arvestust — kõik ühes kohas.</p>
      </section>

      <section className="features">
        <Link to="/competitions" className="feature-card">
          <div className="feature-icon">🏆</div>
          <h2>Võistlused</h2>
          <p>Avalik võistluste nimekiri, klassid, ajakava ja live protokoll. Ratsutajana registreeri end klassidesse, korraldajana loo uus võistlus.</p>
          <span className="feature-cta">Vaata võistlusi →</span>
        </Link>

        <Link to="/designer" className="feature-card">
          <div className="feature-icon">📐</div>
          <h2>Rajadisainer</h2>
          <p>Visuaalne tööriist takistussõidu radade kavandamiseks. Juhu-generaator, PDF eksport, FEI reeglid kontrollitud.</p>
          <span className="feature-cta">Loo rada →</span>
        </Link>
      </section>

      <footer className="landing-footer">
        <small>
          {BACKEND_MODE === 'real'
            ? 'Firebase ühendatud · andmed püsivad pilves.'
            : 'MVP demo · andmed hoitakse brauseris (mock backend).'}
        </small>
      </footer>
    </div>
  );
}
