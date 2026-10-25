import { useEffect } from 'react';
import { useStore } from './store';

export function useKeyboard() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const s = useStore.getState();
      const step = s.snap > 0 ? s.snap : 0.5;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        s.deleteSelected();
      } else if (e.key === 'Escape') {
        s.clearSelection();
        s.setTool('select');
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        s.duplicateSelected();
      } else if (e.key === 'r' && !e.shiftKey) {
        e.preventDefault();
        s.rotateSelectedBy(15);
      } else if (e.key === 'R' || (e.key === 'r' && e.shiftKey)) {
        e.preventDefault();
        s.rotateSelectedBy(-15);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        s.moveSelectedBy(0, -step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        s.moveSelectedBy(0, step);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        s.moveSelectedBy(-step, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        s.moveSelectedBy(step, 0);
      } else if (e.key === 'm' || e.key === 'M') {
        s.setTool(s.tool === 'ruler' ? 'select' : 'ruler');
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        s.undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        s.redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
