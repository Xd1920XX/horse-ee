import { Component, ErrorInfo, ReactNode, Suspense, lazy, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../store';
import { getCourse } from '../domain/courses';
import { Course } from '../types';

const CoursePreview3D = lazy(() =>
  import('../components/CoursePreview3D').then((m) => ({ default: m.CoursePreview3D }))
);

class ThreeErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[3D]', error, info.componentStack);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ padding: 24, color: '#fca5a5' }}>
        <h2>3D stseeni laadimine ebaõnnestus</h2>
        <pre style={{ background: '#1e293b', padding: 12, borderRadius: 6, overflow: 'auto', fontSize: 12 }}>
          {this.state.error.name}: {this.state.error.message}
          {'\n\n'}
          {this.state.error.stack?.split('\n').slice(0, 10).join('\n')}
        </pre>
        <p className="muted">Jaga see error 2D disaineri "← 2D disainer" nuppu kaudu tagasi minnes.</p>
      </div>
    );
  }
}

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
      <ThreeErrorBoundary>
        <Suspense fallback={<div className="loading-splash">Laadin 3D stseeni…</div>}>
          <CoursePreview3D course={course} walkMode={walkMode} onExitWalk={() => setWalkMode(false)} />
        </Suspense>
      </ThreeErrorBoundary>
      <div className="three-hud">
        Hiirega: pööra · rull: zoom · hoia parem klõps: pani
      </div>
    </div>
  );
}
