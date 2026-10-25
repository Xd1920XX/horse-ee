import { useState } from 'react';
import { Palette } from './Palette';
import { Inspector } from './Inspector';
import { useStore } from '../store';

type Sheet = 'palette' | 'inspector' | 'stats' | null;

export function MobileSheet() {
  const [sheet, setSheet] = useState<Sheet>(null);
  const {
    duplicateSelected, deleteSelected, rotateSelectedBy, autoNumber,
    setTool, clearRuler, undo, redo, setSnap,
  } = useStore();
  const tool = useStore((s) => s.tool);
  const snap = useStore((s) => s.snap);
  const selectedIds = useStore((s) => s.selectedIds);

  return (
    <>
      {/* bottom tool rail (always visible on mobile) */}
      <div className="mobile-rail">
        <button onClick={() => setSheet('palette')}>➕</button>
        <button onClick={undo}>↶</button>
        <button onClick={redo}>↷</button>
        <button
          className={tool === 'ruler' ? 'primary' : ''}
          onClick={() => { setTool(tool === 'ruler' ? 'select' : 'ruler'); clearRuler(); }}
        >
          📏
        </button>
        <button onClick={() => rotateSelectedBy(15)} disabled={!selectedIds.length}>↻</button>
        <button onClick={duplicateSelected} disabled={!selectedIds.length}>⎘</button>
        <button onClick={deleteSelected} disabled={!selectedIds.length}>🗑</button>
        <button onClick={autoNumber}>#</button>
        <button
          className={snap > 0 ? 'primary' : ''}
          onClick={() => setSnap(snap > 0 ? 0 : 0.5)}
        >
          ⊞
        </button>
        <button onClick={() => setSheet('inspector')}>⚙</button>
      </div>

      {sheet && (
        <div className="mobile-sheet">
          <div className="mobile-sheet-tabs">
            <button className={sheet === 'palette' ? 'active' : ''} onClick={() => setSheet('palette')}>Lisa</button>
            <button className={sheet === 'inspector' ? 'active' : ''} onClick={() => setSheet('inspector')}>Omadused</button>
            <div style={{ flex: 1 }} />
            <button onClick={() => setSheet(null)}>Sulge</button>
          </div>
          <div className="mobile-sheet-body">
            {sheet === 'palette' ? <Palette /> : <Inspector />}
          </div>
        </div>
      )}
    </>
  );
}
