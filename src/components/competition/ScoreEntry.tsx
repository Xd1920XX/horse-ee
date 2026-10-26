import { useEffect, useState } from 'react';
import { CompetitionClass, Registration, StartEntry } from '../../domain/types';
import { watchClasses } from '../../domain/classes';
import { listRegistrations } from '../../domain/registrations';
import { updateStart, watchStarts } from '../../domain/starts';
import { formatTime } from '../../utils/timeFormat';
import { useAuth } from '../../auth/AuthProvider';

type Props = { compId: string };

export function ScoreEntry({ compId }: Props) {
  const { user } = useAuth();
  const [classes, setClasses] = useState<CompetitionClass[]>([]);
  const [starts, setStarts] = useState<StartEntry[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [selectedClass, setSelectedClass] = useState('');

  useEffect(() => watchClasses(compId, setClasses), [compId]);
  useEffect(() => watchStarts(compId, setStarts), [compId]);
  useEffect(() => { listRegistrations(compId).then(setRegs); }, [compId]);

  const classStarts = starts.filter((s) => s.classId === selectedClass);
  const regMap = new Map(regs.map((r) => [r.id, r]));

  const save = async (s: StartEntry, patch: Partial<StartEntry['result']>) => {
    const nextResult = { ...s.result, ...patch };
    await updateStart(compId, s.id, { result: nextResult, enteredByUid: user?.uid, enteredAt: Date.now() });
  };

  return (
    <div>
      <h2>Live sisestus</h2>
      <div className="row">
        <label>Klass</label>
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
          <option value="">— Vali —</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {selectedClass && classStarts.length === 0 && (
        <div className="empty-msg">Startlist pole veel genereeritud. Mine Startlist tabi.</div>
      )}

      <div className="score-grid">
        {classStarts.map((s) => {
          const r = regMap.get(s.registrationId);
          return (
            <div key={s.id} className={`score-card ${s.result.faults != null || s.result.eliminated || s.result.withdrew ? 'done' : ''}`}>
              <div className="score-head">
                <span className="score-num">#{s.startNumber}</span>
                <span className="score-time">{formatTime(s.startTimeScheduled)}</span>
              </div>
              <div className="score-rider">{r?.riderDisplayName ?? '—'}</div>
              <div className="score-horse">{r?.horseName ?? '—'}</div>
              <div className="score-inputs">
                <div className="row">
                  <label>Vp</label>
                  <input
                    type="number"
                    min={0}
                    max={999}
                    value={s.result.faults ?? ''}
                    disabled={s.result.eliminated || s.result.withdrew}
                    onChange={(e) => save(s, { faults: e.target.value === '' ? null : +e.target.value })}
                  />
                </div>
                <div className="row">
                  <label>Aeg (s)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={s.result.timeSeconds ?? ''}
                    disabled={s.result.eliminated || s.result.withdrew}
                    onChange={(e) => save(s, { timeSeconds: e.target.value === '' ? null : +e.target.value })}
                  />
                </div>
              </div>
              <div className="btn-group">
                <button
                  className={s.result.eliminated ? 'danger primary' : ''}
                  onClick={() => save(s, { eliminated: !s.result.eliminated, withdrew: false })}
                >
                  {s.result.eliminated ? '✓ ELIM' : 'ELIM'}
                </button>
                <button
                  className={s.result.withdrew ? 'primary' : ''}
                  onClick={() => save(s, { withdrew: !s.result.withdrew, eliminated: false })}
                >
                  {s.result.withdrew ? '✓ WD' : 'WD'}
                </button>
                <button onClick={() => save(s, { faults: null, timeSeconds: null, eliminated: false, withdrew: false })}>
                  Tühjenda
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
