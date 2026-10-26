import { useEffect, useState } from 'react';
import { CompetitionClass, Competition, Registration, StartEntry } from '../../domain/types';
import { watchClasses } from '../../domain/classes';
import { listRegistrations } from '../../domain/registrations';
import { watchStarts } from '../../domain/starts';
import { buildProtocol, sortedProtocol } from '../../utils/scoring';
import { formatSeconds } from '../../utils/timeFormat';
import { getCompetition } from '../../domain/competitions';

type Props = { compId: string };

export function Protocol({ compId }: Props) {
  const [comp, setComp] = useState<Competition | null>(null);
  const [classes, setClasses] = useState<CompetitionClass[]>([]);
  const [starts, setStarts] = useState<StartEntry[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [selectedClass, setSelectedClass] = useState('');

  useEffect(() => { getCompetition(compId).then(setComp); }, [compId]);
  useEffect(() => watchClasses(compId, setClasses), [compId]);
  useEffect(() => watchStarts(compId, setStarts), [compId]);
  useEffect(() => { listRegistrations(compId).then(setRegs); }, [compId]);

  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfErr, setPdfErr] = useState('');
  const onExportPdf = async () => {
    if (!comp || !cl) { setPdfErr('Vali klass'); return; }
    setPdfBusy(true);
    setPdfErr('');
    try {
      const { exportProtocolPdf } = await import('../../pdf/protocolPdf');
      exportProtocolPdf(comp, cl, classStarts, regs);
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error('[PDF]', e);
      setPdfErr('PDF viga: ' + (e?.message ?? e));
    } finally {
      setPdfBusy(false);
    }
  };

  const cl = classes.find((c) => c.id === selectedClass);
  const classStarts = starts.filter((s) => s.classId === selectedClass);
  const regMap = new Map(regs.map((r) => [r.id, r]));

  const rows = cl ? sortedProtocol(buildProtocol(classStarts, regMap, cl.timeLimitSeconds)) : [];

  return (
    <div>
      <h2>Protokoll</h2>
      <div className="row">
        <label>Klass</label>
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
          <option value="">— Vali —</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {cl && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <p className="muted" style={{ fontSize: 13 }}>
              Ajalimiit {cl.timeLimitSeconds}s · reeglid {cl.rules}
            </p>
            <button onClick={onExportPdf} disabled={pdfBusy} className="primary">
              {pdfBusy ? 'Loon…' : '📄 Lae PDF alla'}
            </button>
          </div>
          {pdfErr && <div className="auth-error" style={{ marginTop: 8 }}>{pdfErr}</div>}
          <table className="class-table" style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th>Koht</th>
                <th>Nr</th>
                <th>Ratsutaja</th>
                <th>Hobune</th>
                <th>Vp</th>
                <th>Aeg</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const emoji = r.place === 1 ? '🥇' : r.place === 2 ? '🥈' : r.place === 3 ? '🥉' : '';
                return (
                  <tr key={i} className={r.place && r.place <= 3 ? 'top3' : ''}>
                    <td>
                      {r.place ? `${r.place}. ${emoji}` : (
                        r.status === 'elim' ? 'ELIM' :
                        r.status === 'wd' ? 'WD' :
                        r.status === 'pending' ? '…' : '—'
                      )}
                    </td>
                    <td>{r.startNumber}</td>
                    <td>{r.riderName}</td>
                    <td>{r.horseName}</td>
                    <td>{r.faults ?? '—'}</td>
                    <td>{formatSeconds(r.timeSeconds)}</td>
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
