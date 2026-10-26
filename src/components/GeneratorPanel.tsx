import { useState } from 'react';
import { useStore } from '../store';
import { generateCourse } from '../generator';

export function GeneratorPanel() {
  const course = useStore((s) => s.course);
  const setCourse = useStore((s) => s.setCourse);
  const [count, setCount] = useState(10);
  const [style, setStyle] = useState<'flowing' | 'technical' | 'mixed'>('mixed');
  const [combo, setCombo] = useState(true);
  const [water, setWater] = useState(false);
  const [shapeSeed, setShapeSeed] = useState('');
  const [jumpSeed, setJumpSeed] = useState('');

  const build = (ss: number, js: number) => {
    const built = generateCourse({
      arenaW: course.arena.width,
      arenaH: course.arena.height,
      obstacleCount: count,
      heightCm: course.heightClass,
      includeCombinations: combo,
      includeWater: water,
      style,
      shapeSeed: ss,
      jumpSeed: js,
    });
    setCourse({
      ...course,
      obstacles: built.obstacles ?? [],
      decorations: [],
      start: built.start ?? course.start,
      finish: built.finish ?? course.finish,
      name: `Auto rada ${ss}·${js}`,
      updatedAt: Date.now(),
    });
    setShapeSeed(String(ss));
    setJumpSeed(String(js));
  };

  const generate = () => {
    const ss = shapeSeed ? parseInt(shapeSeed, 10) : Math.floor(Math.random() * 1e9);
    const js = jumpSeed ? parseInt(jumpSeed, 10) : Math.floor(Math.random() * 1e9);
    build(ss, js);
  };

  const variation = () => {
    const ss = shapeSeed ? parseInt(shapeSeed, 10) : Math.floor(Math.random() * 1e9);
    const js = Math.floor(Math.random() * 1e9);
    build(ss, js);
  };

  return (
    <div>
      <h3>Juhu-generaator</h3>
      <div className="row">
        <label>Takistusi</label>
        <input type="number" min={4} max={16} value={count} onChange={(e) => setCount(+e.target.value)} />
      </div>
      <div className="row">
        <label>Stiil</label>
        <select value={style} onChange={(e) => setStyle(e.target.value as any)}>
          <option value="flowing">Voolav (vertikaalid)</option>
          <option value="mixed">Segu</option>
          <option value="technical">Tehniline (müür, liverpool)</option>
        </select>
      </div>
      <div className="row">
        <label>
          <input type="checkbox" checked={combo} onChange={(e) => setCombo(e.target.checked)} />
          <span style={{ marginLeft: 4 }}>Kombinatsioon</span>
        </label>
      </div>
      <div className="row">
        <label>
          <input type="checkbox" checked={water} onChange={(e) => setWater(e.target.checked)} />
          <span style={{ marginLeft: 4 }}>Veetakistus</span>
        </label>
      </div>
      <div className="row">
        <label>Kuju seed</label>
        <input placeholder="juhuslik" value={shapeSeed} onChange={(e) => setShapeSeed(e.target.value)} />
      </div>
      <div className="row">
        <label>Hüppe seed</label>
        <input placeholder="juhuslik" value={jumpSeed} onChange={(e) => setJumpSeed(e.target.value)} />
      </div>
      <button className="primary" style={{ width: '100%', marginTop: 8 }} onClick={generate}>
        Genereeri rada
      </button>
      <button style={{ width: '100%', marginTop: 4 }} onClick={variation} disabled={!shapeSeed}>
        Variatsioon (sama kuju, uued hüpped)
      </button>
      <p style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
        Sama seed → sama rada. Takistused numereeritakse automaatselt (1, 2, 3…) ratsutamise järjekorras. Käsitsi numeratsiooniks vali takistus ja muuda välja <b>Nr</b>, või kasuta tööribal nuppu <b>Auto nr</b>.
      </p>
      <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
        Juhu-rada ehitatakse mööda sõidujoont (ovaal / 8-kujund / serpentiin). Start- ja finišjoon pöörduvad automaatselt sõidusuuna järgi — Inspektoris saad neid veel käsitsi diagonaali keerata.
      </p>
    </div>
  );
}
