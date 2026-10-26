import { FormEvent, useEffect, useState } from 'react';
import { SiteNav } from '../components/SiteNav';
import { useAuth } from '../auth/AuthProvider';
import { createHorse, deleteHorse, updateHorse, watchHorsesByOwner } from '../domain/horses';
import { Horse } from '../domain/types';

export function MyHorsesPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Horse[]>([]);
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [year, setYear] = useState('');
  const [passport, setPassport] = useState('');
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    return watchHorsesByOwner(user.uid, setList);
  }, [user]);

  if (!user) return null;

  const reset = () => {
    setName(''); setBreed(''); setYear(''); setPassport(''); setEditing(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const payload = {
      ownerUid: user.uid,
      name: name.trim(),
      breed: breed.trim() || undefined,
      birthYear: year ? +year : undefined,
      passportNumber: passport.trim() || undefined,
    };
    if (editing) {
      await updateHorse(editing, payload);
    } else {
      await createHorse(payload);
    }
    reset();
  };

  const startEdit = (h: Horse) => {
    setEditing(h.id);
    setName(h.name);
    setBreed(h.breed ?? '');
    setYear(h.birthYear ? String(h.birthYear) : '');
    setPassport(h.passportNumber ?? '');
  };

  return (
    <div className="page">
      <SiteNav />
      <main className="container">
        <h1>Minu hobused</h1>
        <form onSubmit={onSubmit} className="form-card">
          <h3>{editing ? 'Muuda hobust' : 'Lisa hobune'}</h3>
          <div className="row">
            <label>Nimi *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="row">
            <label>Tõug</label>
            <input value={breed} onChange={(e) => setBreed(e.target.value)} />
          </div>
          <div className="row">
            <label>Sünd. aasta</label>
            <input type="number" min={1990} max={new Date().getFullYear()} value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
          <div className="row">
            <label>Passi nr</label>
            <input value={passport} onChange={(e) => setPassport(e.target.value)} />
          </div>
          <div className="btn-group">
            <button type="submit" className="primary">{editing ? 'Salvesta' : 'Lisa'}</button>
            {editing && <button type="button" onClick={reset}>Tühista</button>}
          </div>
        </form>

        <h2 style={{ marginTop: 24 }}>Nimekiri ({list.length})</h2>
        {list.length === 0 && <div className="empty-msg">Pole hobuseid.</div>}
        <table className="class-table">
          <thead>
            <tr><th>Nimi</th><th>Tõug</th><th>Sünd.</th><th>Pass</th><th></th></tr>
          </thead>
          <tbody>
            {list.map((h) => (
              <tr key={h.id}>
                <td>{h.name}</td>
                <td>{h.breed ?? '—'}</td>
                <td>{h.birthYear ?? '—'}</td>
                <td>{h.passportNumber ?? '—'}</td>
                <td>
                  <button onClick={() => startEdit(h)}>Muuda</button>
                  <button className="danger" onClick={() => confirm(`Kustuta ${h.name}?`) && deleteHorse(h.id)}>Kustuta</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
