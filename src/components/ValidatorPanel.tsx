import { useStore } from '../store';
import { validateCourse } from '../validator';

export function ValidatorPanel() {
  const course = useStore((s) => s.course);
  const selectMany = useStore((s) => s.selectMany);
  const issues = validateCourse(course);

  return (
    <div>
      <h3>Kontroll · {issues.length} {issues.length === 1 ? 'hoiatus' : 'hoiatust'}</h3>
      {issues.length === 0 && <div className="empty-msg">Kõik korras ✓</div>}
      {issues.map((i, idx) => (
        <div
          key={idx}
          className={`issue issue-${i.severity}`}
          onClick={() => i.obstacleIds && selectMany(i.obstacleIds)}
        >
          <span className="issue-badge">{i.severity === 'error' ? '⛔' : '⚠'}</span>
          <span>{i.message}</span>
        </div>
      ))}
    </div>
  );
}
