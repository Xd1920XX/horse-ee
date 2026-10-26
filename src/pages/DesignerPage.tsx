import { useEffect, useRef } from 'react';
import { ArenaCanvas, getStagePng } from '../components/ArenaCanvas';
import { Palette } from '../components/Palette';
import { Inspector } from '../components/Inspector';
import { Toolbar } from '../components/Toolbar';
import { MobileSheet } from '../components/MobileSheet';
import { useStore } from '../store';
import { useKeyboard } from '../useKeyboard';
import { Link, useParams } from 'react-router-dom';
import { getCourse, saveCourse } from '../domain/courses';
import { useAuth } from '../auth/AuthProvider';

export function DesignerPage() {
  useKeyboard();
  const { courseId } = useParams<{ courseId?: string }>();
  const { user } = useAuth();
  const course = useStore((s) => s.course);
  const loadJSON = useStore((s) => s.loadJSON);
  const setCourse = useStore((s) => s.setCourse);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { localStorage.setItem('horse-course', JSON.stringify(course)); } catch {}
  }, [course]);

  useEffect(() => {
    if (courseId) {
      getCourse(courseId).then((c) => c && setCourse(c));
      return;
    }
    try {
      const saved = localStorage.getItem('horse-course');
      if (saved) loadJSON(saved);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const onSaveCloud = async () => {
    if (!user) { alert('Logi sisse rajade pilve salvestamiseks'); return; }
    const id = await saveCourse(user.uid, course);
    alert(`Salvestatud (id: ${id})`);
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
        <Toolbar
          onExportPdf={onExportPdf}
          onExportJson={onExportJson}
          onImportJson={onImportJson}
          onSharePng={onSharePng}
          onSaveCloud={onSaveCloud}
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
    </div>
  );
}
