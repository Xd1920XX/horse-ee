import { useEffect, useRef, useState } from 'react';
import { CompetitionClass, Registration, StartEntry } from '../../domain/types';
import { watchClasses } from '../../domain/classes';
import { listRegistrations } from '../../domain/registrations';
import { updateStart, watchStarts } from '../../domain/starts';
import { formatTime, formatSeconds } from '../../utils/timeFormat';
import { useAuth } from '../../auth/AuthProvider';

type Props = { compId: string };

// Parse strings like "63.42", "1:03.42", "1:03", "63" to seconds.
// Returns null if invalid or out of plausible range (0..3600s = 1 hour).
function parseTimeInput(input: string): number | null {
  const s = input.trim().replace(',', '.');
  if (!s) return null;
  let total: number;
  if (s.includes(':')) {
    const [m, rest] = s.split(':');
    const mNum = Number(m);
    const sNum = Number(rest);
    if (isNaN(mNum) || isNaN(sNum)) return null;
    total = mNum * 60 + sNum;
  } else {
    const n = Number(s);
    if (isNaN(n)) return null;
    total = n;
  }
  if (total < 0 || total > 3600) return null;
  return total;
}

export function ScoreEntry({ compId }: Props) {
  const { user } = useAuth();
  const [classes, setClasses] = useState<CompetitionClass[]>([]);
  const [starts, setStarts] = useState<StartEntry[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [selectedClass, setSelectedClass] = useState('');

  useEffect(() => watchClasses(compId, setClasses), [compId]);
  useEffect(() => watchStarts(compId, setStarts), [compId]);
  useEffect(() => { listRegistrations(compId).then(setRegs); }, [compId]);

  const cl = classes.find((c) => c.id === selectedClass);
  const classStarts = starts.filter((s) => s.classId === selectedClass);
  const regMap = new Map(regs.map((r) => [r.id, r]));

  // Auto-select next pending start
  const nextPending = classStarts.find(
    (s) => !s.result.eliminated && !s.result.withdrew && s.result.faults == null,
  );

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

      {selectedClass && cl && classStarts.length === 0 && (
        <div className="empty-msg">Startlist pole veel genereeritud. Mine Startlist tabi.</div>
      )}

      {selectedClass && cl && classStarts.length > 0 && (
        <>
          <p className="muted" style={{ fontSize: 13 }}>
            Ajalimiit {cl.timeLimitSeconds}s · klõpsa "Salvesta" peale aega sisestamist.
            Aja formaat: <code>63.42</code> või <code>1:03.42</code>.
          </p>

          <div className="score-grid">
            {classStarts.map((s) => (
              <ScoreCard
                key={s.id}
                start={s}
                reg={regMap.get(s.registrationId)}
                timeLimit={cl.timeLimitSeconds}
                focus={s.id === nextPending?.id}
                userUid={user?.uid}
                onSave={async (patch) => {
                  await updateStart(compId, s.id, {
                    result: { ...s.result, ...patch },
                    enteredByUid: user?.uid,
                    enteredAt: Date.now(),
                  });
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

type CardProps = {
  start: StartEntry;
  reg?: Registration;
  timeLimit: number;
  focus: boolean;
  userUid?: string;
  onSave: (patch: Partial<StartEntry['result']>) => Promise<void>;
};

function ScoreCard({ start, reg, timeLimit, focus, onSave }: CardProps) {
  const [faultsStr, setFaultsStr] = useState<string>(start.result.faults?.toString() ?? '');
  const [timeStr, setTimeStr] = useState<string>(
    start.result.timeSeconds != null ? start.result.timeSeconds.toFixed(2) : '',
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local state when start changes externally (another device)
  useEffect(() => {
    setFaultsStr(start.result.faults?.toString() ?? '');
    setTimeStr(start.result.timeSeconds != null ? start.result.timeSeconds.toFixed(2) : '');
  }, [start.result.faults, start.result.timeSeconds]);

  // Timer
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (timerStart == null) return;
    const id = window.setInterval(() => setTick((v) => v + 1), 100);
    return () => window.clearInterval(id);
  }, [timerStart]);

  const timerElapsed = timerStart != null ? (Date.now() - timerStart) / 1000 : 0;
  // reference tick to suppress unused warning
  void tick;

  const handleTimerStop = () => {
    if (timerStart == null) return;
    const elapsed = (Date.now() - timerStart) / 1000;
    setTimeStr(elapsed.toFixed(2));
    setTimerStart(null);
  };

  const commit = async (overrides?: Partial<StartEntry['result']>) => {
    setErr('');
    setBusy(true);
    try {
      const timeSeconds = overrides?.timeSeconds !== undefined
        ? overrides.timeSeconds
        : (timeStr.trim() === '' ? null : parseTimeInput(timeStr));
      if (timeStr.trim() !== '' && timeSeconds == null && overrides?.timeSeconds === undefined) {
        setErr('Vigane aja formaat');
        setBusy(false);
        return;
      }
      const faultsNum = overrides?.faults !== undefined
        ? overrides.faults
        : (faultsStr.trim() === '' ? null : Number(faultsStr));
      if (faultsStr.trim() !== '' && faultsNum != null && isNaN(faultsNum) && overrides?.faults === undefined) {
        setErr('Vigane karistuspunktide number');
        setBusy(false);
        return;
      }
      await onSave({
        faults: faultsNum,
        timeSeconds,
        eliminated: overrides?.eliminated ?? false,
        withdrew: overrides?.withdrew ?? false,
        ...overrides,
      });
    } catch (e: any) {
      setErr(e?.message ?? 'Viga');
    } finally {
      setBusy(false);
    }
  };

  const done = start.result.faults != null || start.result.eliminated || start.result.withdrew;
  const timeOverLimit =
    start.result.timeSeconds != null && start.result.timeSeconds > timeLimit;
  const timeFaults = timeOverLimit ? Math.ceil(start.result.timeSeconds! - timeLimit) : 0;

  return (
    <div className={`score-card ${done ? 'done' : ''} ${focus ? 'focus' : ''}`}>
      <div className="score-head">
        <span className="score-num">#{start.startNumber}</span>
        <span className="score-time">plan {formatTime(start.startTimeScheduled)}</span>
      </div>
      <div className="score-rider">{reg?.riderDisplayName ?? '—'}</div>
      <div className="score-horse">{reg?.horseName ?? '—'}</div>

      {!done && (
        <>
          <label className="score-label">Karistuspunktid</label>
          <div className="score-faults-quick">
            {[0, 4, 8, 12].map((n) => (
              <button
                key={n}
                className={faultsStr === String(n) ? 'primary' : ''}
                onClick={() => setFaultsStr(String(n))}
                type="button"
              >
                {n}
              </button>
            ))}
            <input
              type="number"
              min={0}
              max={999}
              step={1}
              value={faultsStr}
              placeholder="muu"
              onChange={(e) => setFaultsStr(e.target.value)}
              style={{ width: 60 }}
            />
          </div>

          <label className="score-label">Aeg (s)</label>
          <div className="score-time-input">
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={timeStr}
              placeholder="nt 63.42 või 1:03.42"
              onChange={(e) => setTimeStr(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
            />
            {timerStart != null ? (
              <button type="button" onClick={handleTimerStop} className="danger">
                ⏹ {timerElapsed.toFixed(1)}s
              </button>
            ) : (
              <button type="button" onClick={() => setTimerStart(Date.now())} title="Stopper">
                ⏱
              </button>
            )}
          </div>

          {err && <div className="auth-error" style={{ marginTop: 6, fontSize: 12 }}>{err}</div>}

          <div className="btn-group score-actions">
            <button className="primary" onClick={() => commit()} disabled={busy}>
              {busy ? '…' : '✓ Salvesta'}
            </button>
            <button
              className="danger"
              onClick={() => commit({ eliminated: true, faults: null, timeSeconds: null, withdrew: false })}
              disabled={busy}
            >
              ELIM
            </button>
            <button
              onClick={() => commit({ withdrew: true, faults: null, timeSeconds: null, eliminated: false })}
              disabled={busy}
            >
              WD
            </button>
          </div>
        </>
      )}

      {done && (
        <>
          <div className="score-result">
            {start.result.eliminated ? (
              <span className="score-result-elim">ELIMINATED</span>
            ) : start.result.withdrew ? (
              <span className="score-result-wd">WITHDREW</span>
            ) : (
              <>
                <div className="score-result-row">
                  <span>Karistuspunktid</span>
                  <b>{start.result.faults}{timeFaults > 0 && ` + ${timeFaults} aja`}</b>
                </div>
                <div className="score-result-row">
                  <span>Aeg</span>
                  <b>{formatSeconds(start.result.timeSeconds)}</b>
                </div>
                <div className="score-result-row">
                  <span>Kokku</span>
                  <b style={{ color: '#fbbf24', fontSize: 18 }}>
                    {(start.result.faults ?? 0) + timeFaults} vp
                  </b>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => commit({ faults: null, timeSeconds: null, eliminated: false, withdrew: false })}
            style={{ marginTop: 8, width: '100%' }}
            disabled={busy}
          >
            ↶ Muuda uuesti
          </button>
        </>
      )}
    </div>
  );
}
