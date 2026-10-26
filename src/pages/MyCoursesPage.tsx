import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SiteNav } from '../components/SiteNav';
import { useAuth } from '../auth/AuthProvider';
import { deleteCourse, saveCourse, watchCoursesByOwner } from '../domain/courses';
import { Course } from '../types';
import { formatDate } from '../utils/timeFormat';

export function MyCoursesPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [list, setList] = useState<Course[]>([]);

  useEffect(() => {
    if (!user) return;
    return watchCoursesByOwner(user.uid, setList);
  }, [user]);

  if (!user) return null;

  const open = (c: Course) => {
    nav(`/designer/${c.id}`);
  };

  const open3D = (c: Course) => {
    nav(`/designer/${c.id}/3d`);
  };

  const duplicate = async (c: Course) => {
    const copy: Course = {
      ...c,
      id: Math.random().toString(36).slice(2, 10),
      name: c.name + ' (koopia)',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveCourse(user.uid, copy);
  };

  const remove = async (c: Course) => {
    if (!confirm(`Kustuta "${c.name}"?`)) return;
    await deleteCourse(c.id);
  };

  return (
    <div className="page">
      <SiteNav />
      <main className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Minu rajad</h1>
          <Link to="/designer" className="btn primary">+ Uus rada</Link>
        </div>
        <p className="muted" style={{ marginTop: 4 }}>
          Hoia radu pilves. Linki rada klassile võistluse redaktoris.
        </p>

        {list.length === 0 && (
          <div className="empty-msg" style={{ marginTop: 20 }}>
            Pole veel radu. <Link to="/designer">Loo esimene rada</Link>.
          </div>
        )}

        <div className="comp-grid" style={{ marginTop: 16 }}>
          {list.map((c) => (
            <div key={c.id} className="course-card">
              <div className="course-card-body" onClick={() => open(c)}>
                <h3>{c.name}</h3>
                <div className="muted" style={{ fontSize: 12 }}>
                  {c.obstacles.length} tak · {c.heightClass || 0} cm · {c.arena.width}×{c.arena.height}m
                </div>
                {c.updatedAt && (
                  <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>
                    Uuendatud {formatDate(c.updatedAt)}
                  </div>
                )}
              </div>
              <div className="course-card-actions">
                <button onClick={() => open(c)} title="Ava 2D">✏️</button>
                <button onClick={() => open3D(c)} title="Ava 3D">🧊</button>
                <button onClick={() => duplicate(c)} title="Kopeeri">⎘</button>
                <button className="danger" onClick={() => remove(c)} title="Kustuta">🗑</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
