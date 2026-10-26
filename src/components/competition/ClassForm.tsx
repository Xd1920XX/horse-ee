import { FormEvent, useEffect, useState } from 'react';
import { CompetitionClass } from '../../domain/types';
import { watchCoursesByOwner } from '../../domain/courses';
import { Course } from '../../types';
import { useAuth } from '../../auth/AuthProvider';

type Props = {
  initial?: CompetitionClass;
  onSave: (data: Omit<CompetitionClass, 'id'> | Partial<CompetitionClass>) => Promise<void>;
  onCancel: () => void;
  nextOrderIndex: number;
};

export function ClassForm({ initial, onSave, onCancel, nextOrderIndex }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState(initial?.name ?? '');
  const [heightCm, setHeightCm] = useState(initial?.heightCm ?? 70);
  const [rules, setRules] = useState<CompetitionClass['rules']>(initial?.rules ?? 'A/A');
  const [timeLimit, setTimeLimit] = useState(initial?.timeLimitSeconds ?? 120);
  const [fee, setFee] = useState(initial ? (initial.entryFeeCents ?? 0) / 100 : 20);
  const [courseId, setCourseId] = useState(initial?.courseId ?? '');
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (!user) return;
    return watchCoursesByOwner(user.uid, setCourses);
  }, [user]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await onSave({
      name,
      heightCm,
      rules,
      timeLimitSeconds: timeLimit,
      entryFeeCents: Math.round(fee * 100),
      courseId: courseId || undefined,
      orderIndex: initial?.orderIndex ?? nextOrderIndex,
    });
  };

  return (
    <form onSubmit={submit} className="form-card">
      <h3>{initial ? 'Muuda klassi' : 'Lisa klass'}</h3>
      <div className="row">
        <label>Nimi *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="nt. 90 cm" />
      </div>
      <div className="row">
        <label>Kõrgus (cm)</label>
        <input type="number" min={0} max={200} value={heightCm} onChange={(e) => setHeightCm(+e.target.value)} />
      </div>
      <div className="row">
        <label>Reeglid</label>
        <select value={rules} onChange={(e) => setRules(e.target.value as any)}>
          <option value="A/A">A/A</option>
          <option value="A/A_piiraja">A/A piiraja</option>
          <option value="TableC">Table C</option>
          <option value="other">Muu</option>
        </select>
      </div>
      <div className="row">
        <label>Ajalimiit (s)</label>
        <input type="number" min={30} max={300} value={timeLimit} onChange={(e) => setTimeLimit(+e.target.value)} />
      </div>
      <div className="row">
        <label>Tasu (€)</label>
        <input type="number" min={0} step={0.5} value={fee} onChange={(e) => setFee(+e.target.value)} />
      </div>
      <div className="row">
        <label>Rada</label>
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          <option value="">— Pole lingitud —</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.obstacles.length} tak)</option>
          ))}
        </select>
      </div>
      <div className="btn-group">
        <button type="submit" className="primary">Salvesta</button>
        <button type="button" onClick={onCancel}>Tühista</button>
      </div>
    </form>
  );
}
