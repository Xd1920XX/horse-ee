import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SiteNav } from '../components/SiteNav';
import { useAuth } from '../auth/AuthProvider';
import { createCompetition } from '../domain/competitions';
import { toDateTimeLocal } from '../utils/timeFormat';

export function NewCompetitionPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [venue, setVenue] = useState('');
  const [desc, setDesc] = useState('');
  const in7 = Date.now() + 7 * 86_400_000;
  const [dateStr, setDateStr] = useState(toDateTimeLocal(in7));
  const [deadlineStr, setDeadlineStr] = useState(toDateTimeLocal(in7 - 2 * 86_400_000));
  const [err, setErr] = useState('');

  if (!user) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    try {
      const id = await createCompetition({
        organizerUid: user.uid,
        name: name.trim(),
        venue: venue.trim(),
        date: new Date(dateStr).getTime(),
        registrationDeadline: new Date(deadlineStr).getTime(),
        description: desc.trim() || undefined,
        status: 'draft',
        judgeUids: [],
      });
      nav(`/manage/competitions/${id}`);
    } catch (e: any) {
      setErr(e.message ?? 'Viga');
    }
  };

  return (
    <div className="page">
      <SiteNav />
      <main className="container">
        <h1>Uus võistlus</h1>
        <form onSubmit={submit} className="form-card">
          <div className="row">
            <label>Nimi *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="row">
            <label>Koht *</label>
            <input value={venue} onChange={(e) => setVenue(e.target.value)} required />
          </div>
          <div className="row">
            <label>Kuupäev *</label>
            <input type="datetime-local" value={dateStr} onChange={(e) => setDateStr(e.target.value)} required />
          </div>
          <div className="row">
            <label>Reg. tähtaeg</label>
            <input type="datetime-local" value={deadlineStr} onChange={(e) => setDeadlineStr(e.target.value)} required />
          </div>
          <div className="row">
            <label>Kirjeldus</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} />
          </div>
          {err && <div className="auth-error">{err}</div>}
          <button className="primary" type="submit" style={{ marginTop: 10 }}>Loo mustand</button>
        </form>
      </main>
    </div>
  );
}
