import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export function RegisterPage() {
  const { signUpWithRole } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<'rider' | 'trainer'>('rider');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    if (password !== confirm) { setErr('Paroolid ei kattu'); return; }
    if (password.length < 6) { setErr('Parool liiga lühike (min 6)'); return; }
    setBusy(true);
    try {
      await signUpWithRole(email, password, role);
      nav(role === 'trainer' ? '/manage' : '/competitions');
    } catch (e: any) {
      setErr(e.message ?? 'Konto loomine ebaõnnestus');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="brand">🐎 Horse-ee</Link>
        <h1>Loo konto</h1>

        <div className="role-picker">
          <label className={`role-option ${role === 'rider' ? 'active' : ''}`}>
            <input type="radio" name="role" value="rider" checked={role === 'rider'} onChange={() => setRole('rider')} />
            <div className="role-icon">🏇</div>
            <div className="role-label">
              <b>Võistleja</b>
              <span>Registreerin end võistlustele</span>
            </div>
          </label>
          <label className={`role-option ${role === 'trainer' ? 'active' : ''}`}>
            <input type="radio" name="role" value="trainer" checked={role === 'trainer'} onChange={() => setRole('trainer')} />
            <div className="role-icon">🎓</div>
            <div className="role-label">
              <b>Treener / korraldaja</b>
              <span>Loon ja haldan võistlusi</span>
            </div>
          </label>
        </div>

        <form onSubmit={onSubmit}>
          <div className="row">
            <label>E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="row">
            <label>Parool</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="row">
            <label>Kinnita</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          {err && <div className="auth-error">{err}</div>}
          <button className="primary" type="submit" style={{ width: '100%', marginTop: 8 }} disabled={busy}>
            {busy ? 'Loon…' : 'Loo konto'}
          </button>
        </form>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 12 }}>
          On juba konto? <Link to="/login">Logi sisse</Link>
        </p>
      </div>
    </div>
  );
}
