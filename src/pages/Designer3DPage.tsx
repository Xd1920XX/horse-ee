import { Suspense, lazy, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../store';
import { getCourse } from '../domain/courses';
import { Course } from '../types';

const CoursePreview3D = lazy(() =>
  import('../components/CoursePreview3D').then((m) => ({ default: m.CoursePreview3D }))
);

export function Designer3DPage() {
  const { courseId } = useParams<{ courseId?: string }>();
  const storeCourse = useStore((s) => s.course);
  const [course, setCourse] = useState<Course | null>(courseId ? null : storeCourse);
  const [walkMode, setWalkMode] = useState(false);

  useEffect(() => {
    if (!courseId) {
      setCourse(storeCourse);
      return;
    }
    getCourse(courseId).then((c) => c && setCourse(c));
  }, [courseId, storeCourse]);

  if (!course) {
    return <div className="loading-splash">Laadin rada…</div>;
  }

  return (
    <div className="designer-3d-page">
      <div className="three-topbar">
        <Link to="/" className="brand-mini" title="Avalehele">🐎</Link>
        <Link to={courseId ? `/designer/${courseId}` : '/designer'} className="back-link">← 2D disainer</Link>
        <div className="spacer" />
        <span style={{ color: '#94a3b8', fontSize: 13 }}>{course.name}</span>
        <button
          className={walkMode ? 'primary' : ''}
          onClick={() => setWalkMode((v) => !v)}
          title="Ratsutaja perspektiiv — rada autom. läbi"
        >
          {walkMode ? '✋ Peata' : '🏇 Ratsuta rada'}
        </button>
      </div>
      <Suspense fallback={<div className="loading-splash">Laadin 3D stseeni…</div>}>
        <CoursePreview3D course={course} walkMode={walkMode} onExitWalk={() => setWalkMode(false)} />
      </Suspense>
      <div className="three-hud">
        Hiirega: pööra · rull: zoom · hoia parem klõps: pani
      </div>
    </div>
  );
}
