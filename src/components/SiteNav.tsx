import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export function SiteNav() {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const is = (p: string) => loc.pathname.startsWith(p);

  return (
    <header className="site-nav">
      <Link to="/" className="brand">🐎 Horse-ee</Link>
      <nav>
        <Link to="/competitions" className={is('/competitions') ? 'active' : ''}>Võistlused</Link>
        <Link to="/designer" className={is('/designer') ? 'active' : ''}>Rajadisainer</Link>
        {user && <Link to="/my/entries" className={is('/my') ? 'active' : ''}>Minu</Link>}
        {user && (user.roles.organizer || user.roles.admin) && (
          <Link to="/manage" className={is('/manage') ? 'active' : ''}>Halda</Link>
        )}
      </nav>
      <div className="site-nav-right">
        {user ? (
          <>
            <span className="user-chip">{user.displayName}</span>
            <button onClick={logout}>Logi välja</button>
          </>
        ) : (
          <Link to="/login" className="btn primary">Logi sisse</Link>
        )}
      </div>
    </header>
  );
}
