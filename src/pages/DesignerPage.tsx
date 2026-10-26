import { useEffect, useRef, useState } from 'react';
import { ArenaCanvas, getStagePng } from '../components/ArenaCanvas';
import { Palette } from '../components/Palette';
import { Inspector } from '../components/Inspector';
import { Toolbar } from '../components/Toolbar';
import { MobileSheet } from '../components/MobileSheet';
import { useStore } from '../store';
import { useKeyboard } from '../useKeyboard';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCourse, saveCourse } from '../domain/courses';
import { useAuth } from '../auth/AuthProvider';

export function DesignerPage() {
  useKeyboard();
  const { courseId } = useParams<{ courseId?: string }>();
  const nav = useNavigate();
  const { user } = useAuth();
  const course = useStore((s) => s.course);
  const loadJSON = useStore((s) => s.loadJSON);
  const setCourse = useStore((s) => s.setCourse);
  const fileRef = useRef<HTMLInputElement>(null);

  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [savedCourseId, setSavedCourseId] = useState<string | null>(courseId ?? null);
  const [savingCloud, setSavingCloud] = useState(false);
  const [toast, setToast] = useState('');

  const dirty = !lastSavedAt || (course.updatedAt ?? 0) > lastSavedAt;

  useEffect(() => {
    try { localStorage.setItem('horse-course', JSON.stringify(course)); } catch {}
  }, [course]);

  useEffect(() => {
    if (courseId) {
      getCourse(courseId).then((c) => {
        if (c) {
          setCourse(c);
          setSavedCourseId(courseId);
          setLastSavedAt(c.updatedAt ?? Date.now());
        }
      });
      return;
    }
    try {
      const saved = localStorage.getItem('horse-course');
      if (saved) loadJSON(saved);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2500);
  };

  const onSaveCloud = async () => {
    if (!user) {
      if (confirm('Logi sisse rajade pilve salvestamiseks. Mine sisselogimise lehele?')) {
        nav('/login');
      }
      return;
    }
    setSavingCloud(true);
    try {
      // If first save, ask for a name if default-ish.
      let next = course;
      if (!savedCourseId && (course.name === 'Uus rada' || !course.name.trim())) {
        const name = prompt('Anna rajale nimi:', 'Minu rada 1');
        if (!name) { setSavingCloud(false); return; }
        next = { ...course, name };
        setCourse(next);
      }
      const id = await saveCourse(user.uid, next);
      setSavedCourseId(id);
      setLastSavedAt(Date.now());
      showToast('✓ Pilve salvestatud');
      if (!courseId || courseId !== id) {
        nav(`/designer/${id}`, { replace: true });
      }
    } catch (e: any) {
      showToast('Viga: ' + (e?.message ?? e));
    } finally {
      setSavingCloud(false);
    }
  };

  // Ctrl/Cmd+S saves to cloud
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        onSaveCloud();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, savedCourseId, user]);

  const onSaveAsCopy = async () => {
    if (!user) { nav('/login'); return; }
    const name = prompt('Uue koopia nimi:', course.name + ' (koopia)');
    if (!name) return;
    const copy = { ...course, id: Math.random().toString(36).slice(2, 10), name };
    setCourse(copy);
    setSavingCloud(true);
    try {
      const id = await saveCourse(user.uid, copy);
      setSavedCourseId(id);
      setLastSavedAt(Date.now());
      showToast('✓ Loodud uus koopia');
      nav(`/designer/${id}`, { replace: true });
    } catch (e: any) {
      showToast('Viga: ' + (e?.message ?? e));
    } finally {
      setSavingCloud(false);
    }
  };

  const onExportJson = () => {
    const blob = new Blob([JSON.stringify(course, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${course.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportJson = () => fileRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    if (!loadJSON(text)) alert('Vigane JSON');
    e.target.value = '';
  };

  const onExportPdf = async () => {
    const { exportPdf } = await import('../pdf');
    exportPdf(course);
  };

  const onSharePng = async () => {
    const dataUrl = getStagePng();
    if (!dataUrl) { alert('Ekraani ei õnnestunud jäädvustada'); return; }
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `${course.name}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: course.name, text: `Rada: ${course.name}` });
      } else {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${course.name.replace(/\s+/g, '_')}.png`;
        a.click();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') alert('Jagamine ebaõnnestus: ' + err.message);
    }
  };

  return (
    <div className="app">
      <div className="topbar">
        <Link to="/" className="brand-mini" title="Avalehele">🐎</Link>
        <Link to="/" className="back-link" title="Avalehele">← Avalehele</Link>
        {user && <Link to="/my/courses" className="back-link">Minu rajad</Link>}
        <Toolbar
          onExportPdf={onExportPdf}
          onExportJson={onExportJson}
          onImportJson={onImportJson}
          onSharePng={onSharePng}
          onSaveCloud={onSaveCloud}
          onSaveAsCopy={savedCourseId ? onSaveAsCopy : undefined}
          saveLabel={savingCloud ? 'Salvestan…' : (dirty ? '☁ Salvesta' : '✓ Salvestatud')}
          saveDirty={dirty}
        />
      </div>
      <div className="panel palette">
        <Palette />
      </div>
      <ArenaCanvas />
      <div className="panel inspector">
        <Inspector />
      </div>
      <MobileSheet />
      <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={onFile} />
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
