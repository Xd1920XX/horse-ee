import { useState } from 'react';
import { DECORATION_LABELS, DecorationType, OBSTACLE_LABELS, ObstacleType } from '../types';
import { useStore } from '../store';
import { placeAtStrides } from '../geometry';
import { TemplateLibrary } from './TemplateLibrary';
import { GeneratorPanel } from './GeneratorPanel';

const SWATCH: Record<ObstacleType, string> = {
  vertical:    '🚧',
  oxer:        '🟦',
  triple:      '📶',
  wall:        '🧱',
  liverpool:   '💧',
  water:       '🌊',
  combination: '🔗',
  cavaletti:   '➖',
};

const DECO_SWATCH: Record<DecorationType, string> = {
  flower: '🌸',
  tree: '🌳',
  judge: '🏠',
  tent: '⛺',
  warmup: '🟩',
  arrow: '➡️',
  label: '🏷️',
};

export function Palette() {
  const [tab, setTab] = useState<'obstacles' | 'decorations' | 'templates' | 'generator'>('obstacles');
  const pendingObstacle = useStore((s) => s.pendingObstacleType);
  const pendingDecoration = useStore((s) => s.pendingDecorationType);
  const setPendingObstacle = useStore((s) => s.setPendingObstacle);
  const setPendingDecoration = useStore((s) => s.setPendingDecoration);
  const addObstacle = useStore((s) => s.addObstacle);
  const arena = useStore((s) => s.course.arena);
  const selectedIds = useStore((s) => s.selectedIds);
  const course = useStore((s) => s.course);

  const types = Object.keys(OBSTACLE_LABELS) as ObstacleType[];
  const decoTypes = Object.keys(DECORATION_LABELS) as DecorationType[];

  const selectedObs = course.obstacles.find((o) => o.id === selectedIds[0]);

  const addRelated = (strides: number) => {
    if (!selectedObs) return;
    const pos = placeAtStrides(selectedObs, strides, arena.width, arena.height);
    addObstacle(selectedObs.type === 'cavaletti' ? 'vertical' : selectedObs.type, pos.x, pos.y);
  };

  return (
    <div>
      <div className="tabs">
        <button className={tab === 'obstacles' ? 'active' : ''} onClick={() => setTab('obstacles')}>Takistus</button>
        <button className={tab === 'decorations' ? 'active' : ''} onClick={() => setTab('decorations')}>Dekoor</button>
        <button className={tab === 'templates' ? 'active' : ''} onClick={() => setTab('templates')}>Mallid</button>
        <button className={tab === 'generator' ? 'active' : ''} onClick={() => setTab('generator')}>Auto</button>
      </div>

      {tab === 'obstacles' && (
        <>
          <h3>Takistused</h3>
          <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 10px' }}>
            Puuduta valimaks → puuduta väljakut asetamiseks. Topeltklõps = keskele.
          </p>
          {types.map((t) => (
            <div
              key={t}
              className="palette-item"
              style={{
                borderColor: pendingObstacle === t ? '#fbbf24' : undefined,
                background: pendingObstacle === t ? '#422006' : undefined,
              }}
              onClick={() => setPendingObstacle(pendingObstacle === t ? null : t)}
              onDoubleClick={() => {
                setPendingObstacle(null);
                addObstacle(t, arena.width / 2, arena.height / 2);
              }}
            >
              <div className="swatch">{SWATCH[t]}</div>
              <div className="label">{OBSTACLE_LABELS[t]}</div>
            </div>
          ))}

          {selectedObs && (
            <>
              <h3 style={{ marginTop: 16 }}>Lisa seotud takistusel</h3>
              <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 8px' }}>
                Valitud takistuse ees samme kaugusel.
              </p>
              <div className="btn-group">
                <button onClick={() => addRelated(0)}>Bounce</button>
                <button onClick={() => addRelated(1)}>1 s.</button>
                <button onClick={() => addRelated(2)}>2 s.</button>
                <button onClick={() => addRelated(3)}>3 s.</button>
                <button onClick={() => addRelated(4)}>4 s.</button>
              </div>
            </>
          )}
        </>
      )}

      {tab === 'decorations' && (
        <>
          <h3>Dekoratsioon</h3>
          {decoTypes.map((t) => (
            <div
              key={t}
              className="palette-item"
              style={{
                borderColor: pendingDecoration === t ? '#fbbf24' : undefined,
                background: pendingDecoration === t ? '#422006' : undefined,
              }}
              onClick={() => setPendingDecoration(pendingDecoration === t ? null : t)}
            >
              <div className="swatch">{DECO_SWATCH[t]}</div>
              <div className="label">{DECORATION_LABELS[t]}</div>
            </div>
          ))}
        </>
      )}

      {tab === 'templates' && <TemplateLibrary />}
      {tab === 'generator' && <GeneratorPanel />}
    </div>
  );
}
