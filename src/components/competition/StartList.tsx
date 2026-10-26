import { useEffect, useState } from 'react';
import { CompetitionClass, Competition, Registration, StartEntry } from '../../domain/types';
import { watchClasses } from '../../domain/classes';
import { listRegistrations } from '../../domain/registrations';
import { generateStartList, watchStarts } from '../../domain/starts';
import { getCompetition } from '../../domain/competitions';
import { formatTime, toDateTimeLocal } from '../../utils/timeFormat';

export function StartList({ compId }: { compId: string }) {
  const [comp, setComp] = useState<Competition | null>(null);
  const [classes, setClasses] = useState<CompetitionClass[]>([]);
  const [starts, setStarts] = useState<StartEntry[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [firstStart, setFirstStart] = useState(toDateTimeLocal(Date.now() + 3600_000));
  const [interval, setInterval] = useState(120);
  const [busy, setBusy] = useState(false);

  useEffect(() => { getCompetition(compId).then(setComp); }, [compId]);
  useEffect(() => watchClasses(compId, setClasses), [compId]);
  useEffect(() => watchStarts(compId, setStarts), [compId]);
  useEffect(() => { listRegistrations(compId).then(setRegs); }, [compId]);

  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfErr, setPdfErr] = useState('');
  const onExportPdf = async () => {
    const cl = classes.find((c) => c.id === selectedClass);
    if (!comp || !cl) { setPdfErr('Vali klass'); return; }
    setPdfBusy(true);
    setPdfErr('');
    try {
      const { exportStartListPdf } = await import('../../pdf/startListPdf');
      exportStartListPdf(comp, cl, classStarts, regs);
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error('[PDF]', e);
      setPdfErr('PDF viga: ' + (e?.message ?? e));
    } finally {
      setPdfBusy(false);
    }
  };

  const classStarts = starts.filter((s) => s.classId === selectedClass);
  const confirmed = regs.filter((r) => r.classId === selectedClass && r.status === 'confirmed');
  const regMap = new Map(regs.map((r) => [r.id, r]));

  const generate = async () => {
    if (!selectedClass || confirmed.length === 0) return;
    if (classStarts.length && !confirm('Startlist juba olemas. Luua uus?')) return;
    setBusy(true);
    try {
      const first = new Date(firstStart).getTime();
      await generateStartList(compId, selectedClass, confirmed, first, interval);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2>Startlist</h2>
      <div className="row">
        <label>Klass</label>
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
          <option value="">— Vali —</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({regs.filter((r) => r.classId === c.id && r.status === 'confirmed').length} kinnit.)</option>
          ))}
        </select>
      </div>
      {selectedClass && (
        <>
          <div className="form-card">
            <div className="row">
              <label>Esimese start</label>
              <input type="datetime-local" value={firstStart} onChange={(e) => setFirstStart(e.target.value)} />
            </div>
            <div className="row">
              <label>Intervall (s)</label>
              <input type="number" min={30} max={600} value={interval} onChange={(e) => setInterval(+e.target.value)} />
            </div>
            <div className="btn-group">
              <button className="primary" onClick={generate} disabled={busy || !confirmed.length}>
                {busy ? 'Loon…' : (classStarts.length ? 'Loo uuesti' : 'Genereeri startlist')}
              </button>
              {classStarts.length > 0 && (
                <button onClick={onExportPdf} disabled={pdfBusy}>
                  {pdfBusy ? 'Loon…' : '📄 PDF'}
                </button>
              )}
            </div>
            {!confirmed.length && <p className="muted" style={{ fontSize: 12 }}>Pole kinnitatud osalejaid.</p>}
            {pdfErr && <div className="auth-error" style={{ marginTop: 8 }}>{pdfErr}</div>}
          </div>

          <table className="class-table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Nr</th>
                <th>Aeg</th>
                <th>Ratsutaja</th>
                <th>Hobune</th>
                <th>Tulemus</th>
              </tr>
            </thead>
            <tbody>
              {classStarts.map((s) => {
                const r = regMap.get(s.registrationId);
                const result =
                  s.result.eliminated ? 'ELIM' :
                  s.result.withdrew ? 'WD' :
                  s.result.faults != null ? `${s.result.faults} vp / ${s.result.timeSeconds?.toFixed(2) ?? '—'}s`
                  : '—';
                return (
                  <tr key={s.id}>
                    <td>{s.startNumber}</td>
                    <td>{formatTime(s.startTimeScheduled)}</td>
                    <td>{r?.riderDisplayName ?? '—'}</td>
                    <td>{r?.horseName ?? '—'}</td>
                    <td>{result}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
