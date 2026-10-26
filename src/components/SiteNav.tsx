import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export function SiteNav() {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const is = (p: string) => loc.pathname.startsWith(p);
  const close = () => setOpen(false);

  return (
    <header className="site-nav">
      <Link to="/" className="brand" onClick={close}>🐎 Horse-ee</Link>

      <button
        className="nav-burger"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menüü"
      >
        {open ? '✕' : '☰'}
      </button>

      <nav className={open ? 'open' : ''}>
        <Link to="/competitions" className={is('/competitions') ? 'active' : ''} onClick={close}>Võistlused</Link>
        <Link to="/designer" className={loc.pathname === '/designer' ? 'active' : ''} onClick={close}>Rajadisainer</Link>
        {user && <Link to="/my/courses" className={is('/my/courses') ? 'active' : ''} onClick={close}>Rajad</Link>}
        {user && <Link to="/my/horses" className={is('/my/horses') ? 'active' : ''} onClick={close}>Hobused</Link>}
        {user && <Link to="/my/entries" className={is('/my/entries') ? 'active' : ''} onClick={close}>Minu reg</Link>}
        {user && <Link to="/manage" className={is('/manage') ? 'active' : ''} onClick={close}>Halda</Link>}
      </nav>

      <div className="site-nav-right">
        {user ? (
          <>
            <Link to="/my/profile" className="user-chip" title="Minu profiil" onClick={close}>
              <span className="user-chip-name">{user.displayName}</span>
            </Link>
            <button onClick={() => { close(); logout(); }}>Välja</button>
          </>
        ) : (
          <Link to="/login" className="btn primary" onClick={close}>Logi sisse</Link>
        )}
      </div>
    </header>
  );
}
