import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordReset } from '../firebase';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(''); setMsg('');
    setBusy(true);
    try {
      await sendPasswordReset(email);
      setMsg('Saatsime parooli lähtestamise lingi su e-mailile.');
    } catch (e: any) {
      setErr(e.message ?? 'Viga');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="brand">🐎 Horse-ee</Link>
        <h1>Unustasid parooli?</h1>
        <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
          Sisesta e-mail, saadame sulle lähtestamise lingi.
        </p>
        <form onSubmit={onSubmit}>
          <div className="row">
            <label>E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {err && <div className="auth-error">{err}</div>}
          {msg && <div style={{ background: '#064e3b', border: '1px solid #047857', color: '#a7f3d0', padding: '8px 10px', borderRadius: 4, fontSize: 13, marginTop: 8 }}>{msg}</div>}
          <button className="primary" type="submit" style={{ width: '100%', marginTop: 10 }} disabled={busy}>
            {busy ? 'Saadan…' : 'Saada link'}
          </button>
        </form>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 12 }}>
          <Link to="/login">← Tagasi sisselogimisse</Link>
        </p>
      </div>
    </div>
  );
}
