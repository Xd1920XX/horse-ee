import { useStore } from '../store';
import { TEMPLATES } from '../templates';

export function TemplateLibrary() {
  const course = useStore((s) => s.course);
  const setCourse = useStore((s) => s.setCourse);

  const apply = (tplId: string) => {
    const tpl = TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    if (!confirm(`Lae mall "${tpl.name}"? Praegused takistused asendatakse.`)) return;
    const built = tpl.build(course.arena.width, course.arena.height, course.heightClass);
    setCourse({
      ...course,
      obstacles: built.obstacles ?? [],
      decorations: [],
      start: built.start ?? course.start,
      finish: built.finish ?? course.finish,
      name: tpl.name,
      updatedAt: Date.now(),
    });
  };

  const exercises = TEMPLATES.filter((t) => t.category === 'exercise');
  const courses = TEMPLATES.filter((t) => t.category === 'full-course');

  return (
    <div>
      <h3>Harjutused</h3>
      {exercises.map((t) => (
        <div key={t.id} className="tpl-item" onClick={() => apply(t.id)}>
          <div className="tpl-title">{t.name}</div>
          <div className="tpl-desc">{t.description}</div>
          <div className="tpl-meta">{t.heightCm > 0 ? `${t.heightCm}cm` : 'maalatt'} · min {t.requiredArena.width}×{t.requiredArena.height}m</div>
        </div>
      ))}
      <h3 style={{ marginTop: 16 }}>Täisrajad</h3>
      {courses.map((t) => (
        <div key={t.id} className="tpl-item" onClick={() => apply(t.id)}>
          <div className="tpl-title">{t.name}</div>
          <div className="tpl-desc">{t.description}</div>
          <div className="tpl-meta">{t.heightCm}cm · min {t.requiredArena.width}×{t.requiredArena.height}m</div>
        </div>
      ))}
    </div>
  );
}
