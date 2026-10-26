import { useStore } from '../store';

type Props = {
  onExportPdf: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
  onSharePng: () => void;
  onSaveCloud?: () => void;
};

export function Toolbar({ onExportPdf, onExportJson, onImportJson, onSharePng, onSaveCloud }: Props) {
  const {
    undo, redo, autoNumber, autoDetectCombinations, clearNumbers,
    toggleGrid, toggleDistances, togglePath, toggleFlags,
    reset, setSnap, mirrorHorizontal, mirrorVertical, rotateCourse,
    setTool, clearRuler, resetView, clearObstacles,
  } = useStore();
  const showGrid = useStore((s) => s.showGrid);
  const showDistances = useStore((s) => s.showDistances);
  const showPath = useStore((s) => s.showPath);
  const showFlags = useStore((s) => s.showFlags);
  const snap = useStore((s) => s.snap);
  const tool = useStore((s) => s.tool);
  const zoom = useStore((s) => s.zoom);
  const setZoom = useStore((s) => s.setZoom);

  return (
    <>
      <h1>🐎 Rajadisainer</h1>
      <button onClick={undo} title="Undo (Ctrl+Z)">↶</button>
      <button onClick={redo} title="Redo (Ctrl+Y)">↷</button>
      <span className="divider" />
      <button onClick={autoNumber} title="Auto numereeri">Auto nr</button>
      <button onClick={autoDetectCombinations} title="Tuvasta kombod (12m, sama suund)">Auto kombo</button>
      <button onClick={clearNumbers} title="Tühjenda numeratsioon">× nr</button>
      <span className="divider" />
      <button className={tool === 'ruler' ? 'primary' : ''} onClick={() => { setTool(tool === 'ruler' ? 'select' : 'ruler'); clearRuler(); }} title="Mõõdulint (M)">📏</button>
      <button className={showGrid ? 'primary' : ''} onClick={toggleGrid} title="Grid">⊞</button>
      <button className={showPath ? 'primary' : ''} onClick={togglePath} title="Rada">↝</button>
      <button className={showDistances ? 'primary' : ''} onClick={toggleDistances} title="Distantsid">↔</button>
      <button className={showFlags ? 'primary' : ''} onClick={toggleFlags} title="Lipud">🚩</button>
      <span className="divider" />
      <select value={snap} onChange={(e) => setSnap(+e.target.value)} title="Snap">
        <option value={0}>No snap</option>
        <option value={0.5}>0.5m</option>
        <option value={1}>1m</option>
        <option value={2.5}>2.5m</option>
      </select>
      <span className="divider" />
      <button onClick={() => setZoom(zoom * 1.2)} title="Suumi sisse">+</button>
      <button onClick={() => setZoom(zoom / 1.2)} title="Suumi välja">−</button>
      <button onClick={resetView} title="Reset view">⤢</button>
      <span className="divider" />
      <button onClick={mirrorHorizontal} title="Peegelda H">⇆</button>
      <button onClick={mirrorVertical} title="Peegelda V">⇅</button>
      <button onClick={() => rotateCourse(90)} title="Pööra 90°">↻90</button>
      <div className="spacer" />
      <button onClick={onImportJson}>Impordi</button>
      <button onClick={onExportJson}>Salvesta JSON</button>
      {onSaveCloud && <button onClick={onSaveCloud} title="Salvesta pilve">☁ Pilve</button>}
      <button onClick={onSharePng} title="Jaga PNG">📤</button>
      <button className="primary" onClick={onExportPdf}>PDF</button>
      <button className="danger" onClick={() => confirm('Tühjenda kõik takistused?') && clearObstacles()}>×</button>
      <button className="danger" onClick={() => confirm('Alusta otsast?') && reset()}>Uus</button>
    </>
  );
}
