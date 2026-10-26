import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SiteNav } from '../components/SiteNav';
import { Competition, CompetitionStatus } from '../domain/types';
import { getCompetition, updateCompetition, deleteCompetition } from '../domain/competitions';
import { listClasses, deleteClass } from '../domain/classes';
import { listRegistrations, deleteRegistration } from '../domain/registrations';
import { listStarts, deleteStart } from '../domain/starts';
import { ClassList } from '../components/competition/ClassList';
import { RegistrationList } from '../components/competition/RegistrationList';
import { StartList } from '../components/competition/StartList';
import { ScoreEntry } from '../components/competition/ScoreEntry';
import { Protocol } from '../components/competition/Protocol';
import { formatDateTime, toDateTimeLocal } from '../utils/timeFormat';

type Tab = 'info' | 'classes' | 'registrations' | 'starts' | 'live' | 'protocol';

const STATUSES: { v: CompetitionStatus; label: string }[] = [
  { v: 'draft',    label: 'Mustand' },
  { v: 'open',     label: 'Reg avatud' },
  { v: 'closed',   label: 'Reg suletud' },
  { v: 'running',  label: 'Käimas' },
  { v: 'finished', label: 'Lõppenud' },
];

export function CompetitionEditor() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [comp, setComp] = useState<Competition | null>(null);
  const [tab, setTab] = useState<Tab>('info');

  useEffect(() => {
    if (!id) return;
    getCompetition(id).then(setComp);
  }, [id]);

  if (!comp) return <div className="page"><SiteNav /><main className="container">Laadin…</main></div>;

  const save = async (patch: Partial<Competition>) => {
    await updateCompetition(comp.id, patch);
    setComp({ ...comp, ...patch });
  };

  // Only drafts can be deleted outright. Any published/running/finished
  // competition stays in the archive forever (per user requirement).
  const canHardDelete = comp.status === 'draft';

  const remove = async () => {
    if (!canHardDelete) {
      alert('Avaldatud võistlusi ei saa kustutada — jäävad arhiivi. Muuda status: "Lõppenud".');
      return;
    }
    if (!confirm(`Kustuta mustand "${comp.name}"? Kõik klassid ja registreeringud lähevad kaasa.`)) return;
    const [classes, regs, starts] = await Promise.all([
      listClasses(comp.id),
      listRegistrations(comp.id),
      listStarts(comp.id),
    ]);
    await Promise.all([
      ...classes.map((c) => deleteClass(comp.id, c.id)),
      ...regs.map((r) => deleteRegistration(comp.id, r.id)),
      ...starts.map((s) => deleteStart(comp.id, s.id)),
    ]);
    await deleteCompetition(comp.id);
    nav('/manage');
  };

  return (
    <div className="page">
      <SiteNav />
      <main className="container">
        <Link to="/manage" className="muted" style={{ fontSize: 13 }}>← Minu võistlused</Link>
        <h1>{comp.name}</h1>
        <div className="comp-meta">
          <div><b>Koht:</b> {comp.venue}</div>
          <div><b>Kuupäev:</b> {formatDateTime(comp.date)}</div>
          <div>
            <b>Olek:</b>{' '}
            <select value={comp.status} onChange={(e) => save({ status: e.target.value as CompetitionStatus })}>
              {STATUSES.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="editor-tabs">
          {(['info', 'classes', 'registrations', 'starts', 'live', 'protocol'] as Tab[]).map((t) => (
            <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
              {t === 'info' ? 'Info'
               : t === 'classes' ? 'Klassid'
               : t === 'registrations' ? 'Registreeringud'
               : t === 'starts' ? 'Startlist'
               : t === 'live' ? 'Live sisestus'
               : 'Protokoll'}
            </button>
          ))}
        </div>

        <div className="editor-body">
          {tab === 'info' && <InfoTab comp={comp} save={save} remove={remove} />}
          {tab === 'classes' && <ClassList compId={comp.id} />}
          {tab === 'registrations' && <RegistrationList compId={comp.id} />}
          {tab === 'starts' && <StartList compId={comp.id} />}
          {tab === 'live' && <ScoreEntry compId={comp.id} />}
          {tab === 'protocol' && <Protocol compId={comp.id} />}
        </div>
      </main>
    </div>
  );
}

function InfoTab({ comp, save, remove }: { comp: Competition; save: (p: Partial<Competition>) => Promise<void>; remove: () => void }) {
  const [name, setName] = useState(comp.name);
  const [venue, setVenue] = useState(comp.venue);
  const [desc, setDesc] = useState(comp.description ?? '');
  const [dateStr, setDateStr] = useState(toDateTimeLocal(comp.date));
  const [deadlineStr, setDeadlineStr] = useState(toDateTimeLocal(comp.registrationDeadline));

  const onSave = async () => {
    await save({
      name,
      venue,
      description: desc || undefined,
      date: new Date(dateStr).getTime(),
      registrationDeadline: new Date(deadlineStr).getTime(),
    });
  };

  return (
    <div className="form-card">
      <div className="row">
        <label>Nimi</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="row">
        <label>Koht</label>
        <input value={venue} onChange={(e) => setVenue(e.target.value)} />
      </div>
      <div className="row">
        <label>Kuupäev</label>
        <input type="datetime-local" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
      </div>
      <div className="row">
        <label>Reg tähtaeg</label>
        <input type="datetime-local" value={deadlineStr} onChange={(e) => setDeadlineStr(e.target.value)} />
      </div>
      <div className="row">
        <label>Kirjeldus</label>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} />
      </div>
      <div className="btn-group">
        <button className="primary" onClick={onSave}>Salvesta</button>
        {comp.status === 'draft' && (
          <button className="danger" onClick={remove}>Kustuta mustand</button>
        )}
      </div>
      {comp.status !== 'draft' && (
        <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          Avaldatud võistlusi ei saa kustutada. Lõpetamiseks muuda status "Lõppenud".
        </p>
      )}
    </div>
  );
}
