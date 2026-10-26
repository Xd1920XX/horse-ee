import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export function LoginPage() {
  const { loginEmail, loginGoogle } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    try {
      await loginEmail(email, password);
      nav('/');
    } catch (e: any) {
      setErr(e.message ?? 'Sisselogimine ebaõnnestus');
    }
  };

  const onGoogle = async () => {
    setErr('');
    try {
      await loginGoogle();
      nav('/');
    } catch (e: any) {
      setErr(e.message ?? 'Google sisselogimine ebaõnnestus');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="brand">🐎 Horse-ee</Link>
        <h1>Logi sisse</h1>
        <button type="button" className="btn-google" onClick={onGoogle}>
          <span className="google-g">G</span> Jätka Google'iga
        </button>
        <div className="auth-divider"><span>või</span></div>
        <form onSubmit={onSubmit}>
          <div className="row">
            <label>E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="row">
            <label>Parool</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {err && <div className="auth-error">{err}</div>}
          <button className="primary" type="submit" style={{ width: '100%', marginTop: 8 }}>
            Logi sisse
          </button>
        </form>
        <p style={{ fontSize: 12, marginTop: 12 }}>
          <Link to="/forgot-password" style={{ color: '#94a3b8' }}>Unustasid parooli?</Link>
        </p>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
          Pole veel kontot? <Link to="/register">Loo konto</Link>
        </p>
        <Link to="/" style={{ color: '#64748b', fontSize: 12 }}>← Tagasi avalehele</Link>
      </div>
    </div>
  );
}
