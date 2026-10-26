import { useRef } from 'react';
import { useStore } from '../store';
import { DECORATION_LABELS, HEIGHT_PRESETS, OBSTACLE_LABELS, ObstacleType } from '../types';
import { StatsPanel } from './StatsPanel';
import { ValidatorPanel } from './ValidatorPanel';
import { Minimap } from './Minimap';

export function Inspector() {
  const course = useStore((s) => s.course);
  const selectedIds = useStore((s) => s.selectedIds);
  const update = useStore((s) => s.updateObstacle);
  const del = useStore((s) => s.deleteObstacle);
  const updDec = useStore((s) => s.updateDecoration);
  const delDec = useStore((s) => s.deleteDecoration);
  const setArena = useStore((s) => s.setArena);
  const setName = useStore((s) => s.setName);
  const setHeightClass = useStore((s) => s.setHeightClass);
  const groupCombo = useStore((s) => s.groupSelectedAsCombination);
  const ungroup = useStore((s) => s.ungroupCombination);
  const setBackground = useStore((s) => s.setBackground);
  const updateBackground = useStore((s) => s.updateBackground);
  const fileRef = useRef<HTMLInputElement>(null);

  const moveMarker = useStore((s) => s.moveMarker);
  const sel = course.obstacles.find((o) => o.id === selectedIds[0]);
  const selDec = course.decorations.find((d) => d.id === selectedIds[0]);

  const onBgFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setBackground({ dataUrl: reader.result as string, opacity: 0.6, x: 0, y: 0, scale: 1 });
    };
    reader.readAsDataURL(f);
    e.target.value = '';
  };

  return (
    <div>
      <h3>Rada</h3>
      <div className="row">
        <label>Nimi</label>
        <input value={course.name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="row">
        <label>Väljak</label>
        <input
          type="number"
          min={10}
          max={200}
          value={course.arena.width}
          onChange={(e) => setArena({ width: Math.max(10, +e.target.value) })}
        />
        <span style={{ color: '#64748b', fontSize: 12 }}>×</span>
        <input
          type="number"
          min={10}
          max={200}
          value={course.arena.height}
          onChange={(e) => setArena({ height: Math.max(10, +e.target.value) })}
        />
        <span style={{ color: '#64748b', fontSize: 12 }}>m</span>
      </div>
      <div className="row">
        <label>Pind</label>
        <select
          value={course.arena.indoor ? 'in' : course.arena.surface ?? 'sand'}
          onChange={(e) => {
            const v = e.target.value;
            if (v === 'in') setArena({ indoor: true });
            else setArena({ indoor: false, surface: v as any });
          }}
        >
          <option value="sand">Välisplats · liiv</option>
          <option value="grass">Välisplats · muru</option>
          <option value="fiber">Välisplats · fiiber</option>
          <option value="in">Siseplats</option>
        </select>
      </div>
      <div className="row">
        <label>Klass</label>
        <select value={course.heightClass} onChange={(e) => setHeightClass(+e.target.value)}>
          {HEIGHT_PRESETS.map((h) => (
            <option key={h.value} value={h.value}>{h.label}</option>
          ))}
        </select>
      </div>

      <h3 style={{ marginTop: 16 }}>Start &amp; Finiš</h3>
      <div className="row">
        <label>Start °</label>
        <input
          type="number"
          min={-180}
          max={360}
          step={5}
          value={Math.round(course.start.rotation)}
          onChange={(e) => moveMarker('start', { rotation: +e.target.value })}
        />
        <input
          type="number"
          min={-180}
          max={360}
          step={5}
          value={Math.round(course.finish.rotation)}
          onChange={(e) => moveMarker('finish', { rotation: +e.target.value })}
        />
        <span style={{ color: '#64748b', fontSize: 12 }}>finiš °</span>
      </div>
      <div className="btn-group">
        <button onClick={() => moveMarker('start', { rotation: 0 })} title="Start horisontaalne">S 0°</button>
        <button onClick={() => moveMarker('start', { rotation: 45 })} title="Start diagonaalne">S 45°</button>
        <button onClick={() => moveMarker('start', { rotation: 90 })} title="Start vertikaalne">S 90°</button>
        <button onClick={() => moveMarker('start', { rotation: 135 })} title="Start diagonaal 2">S 135°</button>
      </div>
      <div className="btn-group" style={{ marginTop: 4 }}>
        <button onClick={() => moveMarker('finish', { rotation: 0 })}>F 0°</button>
        <button onClick={() => moveMarker('finish', { rotation: 45 })}>F 45°</button>
        <button onClick={() => moveMarker('finish', { rotation: 90 })}>F 90°</button>
        <button onClick={() => moveMarker('finish', { rotation: 135 })}>F 135°</button>
      </div>
      <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
        Kraad = ratsutamise suund. Noole suund = kuhu hobune liigub.
      </p>

      <h3 style={{ marginTop: 16 }}>Taustpilt</h3>
      {!course.background && (
        <>
          <button style={{ width: '100%' }} onClick={() => fileRef.current?.click()}>Lae pilt (plats)</button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onBgFile} />
        </>
      )}
      {course.background && (
        <>
          <div className="row">
            <label>Läbipaistvus</label>
            <input type="range" min={0.1} max={1} step={0.05} value={course.background.opacity} onChange={(e) => updateBackground({ opacity: +e.target.value })} />
          </div>
          <div className="row">
            <label>Skaala</label>
            <input type="number" min={0.1} max={5} step={0.05} value={course.background.scale} onChange={(e) => updateBackground({ scale: +e.target.value })} />
          </div>
          <div className="row">
            <label>Nihe x</label>
            <input type="number" step={0.5} value={course.background.x} onChange={(e) => updateBackground({ x: +e.target.value })} />
          </div>
          <div className="row">
            <label>Nihe y</label>
            <input type="number" step={0.5} value={course.background.y} onChange={(e) => updateBackground({ y: +e.target.value })} />
          </div>
          <button className="danger" style={{ width: '100%' }} onClick={() => setBackground(undefined)}>Eemalda</button>
        </>
      )}

      <h3 style={{ marginTop: 16 }}>Ülevaade</h3>
      <Minimap />

      {selectedIds.length > 1 && (
        <>
          <h3 style={{ marginTop: 16 }}>Valitud {selectedIds.length} objekti</h3>
          <div className="btn-group">
            <button onClick={groupCombo} disabled={selectedIds.length < 2 || selectedIds.length > 3}>Rühmita komboks</button>
          </div>
        </>
      )}

      {sel && selectedIds.length === 1 && (
        <>
          <h3 style={{ marginTop: 16 }}>Valitud takistus</h3>
          <div className="row">
            <label>Tüüp</label>
            <select value={sel.type} onChange={(e) => update(sel.id, { type: e.target.value as ObstacleType })}>
              {(Object.keys(OBSTACLE_LABELS) as ObstacleType[]).map((t) => (
                <option key={t} value={t}>{OBSTACLE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div className="row">
            <label>Nr</label>
            <input
              type="number"
              min={1}
              value={sel.number ?? ''}
              onChange={(e) => update(sel.id, { number: e.target.value ? +e.target.value : undefined })}
            />
            <input
              placeholder="a/b/c"
              maxLength={1}
              style={{ width: 50 }}
              value={sel.letter ?? ''}
              onChange={(e) => update(sel.id, { letter: e.target.value || undefined })}
            />
          </div>
          <div className="row">
            <label>Kõrgus</label>
            <input
              type="number"
              min={0}
              max={200}
              value={sel.height}
              onChange={(e) => update(sel.id, { height: +e.target.value })}
            />
            <span style={{ color: '#64748b', fontSize: 12 }}>cm</span>
          </div>
          <div className="row">
            <label>Laius</label>
            <input
              type="number"
              min={1}
              max={10}
              step={0.1}
              value={sel.width}
              onChange={(e) => update(sel.id, { width: +e.target.value })}
            />
            <span style={{ color: '#64748b', fontSize: 12 }}>m</span>
          </div>
          <div className="row">
            <label>Sügavus</label>
            <input
              type="number"
              min={0}
              max={6}
              step={0.1}
              value={sel.spread}
              onChange={(e) => update(sel.id, { spread: +e.target.value })}
            />
            <span style={{ color: '#64748b', fontSize: 12 }}>m</span>
          </div>
          <div className="row">
            <label>Pööre</label>
            <input
              type="number"
              min={-180}
              max={360}
              step={5}
              value={sel.rotation}
              onChange={(e) => update(sel.id, { rotation: +e.target.value })}
            />
            <span style={{ color: '#64748b', fontSize: 12 }}>°</span>
          </div>
          <div className="row">
            <label>Märkmed</label>
            <input value={sel.notes ?? ''} onChange={(e) => update(sel.id, { notes: e.target.value || undefined })} placeholder="treeneri märge" />
          </div>
          <div className="btn-group" style={{ marginTop: 10 }}>
            <button onClick={() => update(sel.id, { rotation: (sel.rotation - 15 + 360) % 360 })}>⟲ -15°</button>
            <button onClick={() => update(sel.id, { rotation: (sel.rotation + 15) % 360 })}>⟳ +15°</button>
            {sel.comboGroupId && <button onClick={() => ungroup(sel.comboGroupId!)}>Lahuta kombo</button>}
            <button className="danger" onClick={() => del(sel.id)}>Kustuta</button>
          </div>
        </>
      )}

      {selDec && selectedIds.length === 1 && (
        <>
          <h3 style={{ marginTop: 16 }}>Dekoratsioon: {DECORATION_LABELS[selDec.type]}</h3>
          <div className="row">
            <label>Suurus</label>
            <input type="number" min={0.3} max={30} step={0.1} value={selDec.size} onChange={(e) => updDec(selDec.id, { size: +e.target.value })} />
            <span style={{ color: '#64748b', fontSize: 12 }}>m</span>
          </div>
          <div className="row">
            <label>Pööre</label>
            <input type="number" min={-180} max={360} step={5} value={selDec.rotation} onChange={(e) => updDec(selDec.id, { rotation: +e.target.value })} />
          </div>
          {selDec.type === 'label' && (
            <div className="row">
              <label>Tekst</label>
              <input value={selDec.text ?? ''} onChange={(e) => updDec(selDec.id, { text: e.target.value })} />
            </div>
          )}
          <button className="danger" style={{ width: '100%', marginTop: 10 }} onClick={() => delDec(selDec.id)}>Kustuta</button>
        </>
      )}

      {!sel && !selDec && selectedIds.length === 0 && (
        <div className="empty-msg" style={{ marginTop: 12 }}>Vali takistus või dekoratsioon väljakult.</div>
      )}

      <StatsPanel />
      <ValidatorPanel />
    </div>
  );
}
