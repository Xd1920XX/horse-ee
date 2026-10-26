import { useState } from 'react';
import { SiteNav } from '../components/SiteNav';
import { useAuth } from '../auth/AuthProvider';
import { grantRole } from '../firebase';

export function ProfilePage() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  if (!user) return null;

  const toggleOrganizer = async () => {
    setBusy(true); setMsg('');
    try {
      await grantRole(user.uid, 'organizer', !user.roles.organizer);
      setMsg('Roll uuendatud. Lae leht uuesti kui nupud ei ilmu.');
    } catch (e: any) {
      setMsg('Viga: ' + (e.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <SiteNav />
      <main className="container">
        <h1>Minu profiil</h1>
        <div className="form-card">
          <div className="row">
            <label>E-mail</label>
            <div>{user.email}</div>
          </div>
          <div className="row">
            <label>Nimi</label>
            <div>{user.displayName}</div>
          </div>
          <div className="row">
            <label>Login</label>
            <div>{user.provider}</div>
          </div>
          <div className="row">
            <label>UID</label>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8' }}>{user.uid}</div>
          </div>
        </div>

        <div className="form-card">
          <h3>Roll</h3>
          <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
            {user.roles.organizer
              ? 'Oled korraldaja — saad luua ja hallata võistlusi.'
              : 'Oled võistleja — saad registreerida ennast klassidesse.'}
          </p>
          <button
            className={user.roles.organizer ? '' : 'primary'}
            disabled={busy}
            onClick={toggleOrganizer}
          >
            {busy ? '…' : (user.roles.organizer ? 'Loobu korraldaja rollist' : 'Hakka korraldajaks')}
          </button>
          {msg && <p style={{ fontSize: 12, color: '#fbbf24', marginTop: 8 }}>{msg}</p>}
        </div>
      </main>
    </div>
  );
}
