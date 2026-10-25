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
  const [seed, setSeed] = useState('');

  const generate = () => {
    const seedNum = seed ? parseInt(seed, 10) : Math.floor(Math.random() * 1e9);
    const built = generateCourse({
      arenaW: course.arena.width,
      arenaH: course.arena.height,
      obstacleCount: count,
      heightCm: course.heightClass,
      includeCombinations: combo,
      includeWater: water,
      style,
      seed: seedNum,
    });
    setCourse({
      ...course,
      obstacles: built.obstacles ?? [],
      decorations: [],
      start: built.start ?? course.start,
      finish: built.finish ?? course.finish,
      name: `Auto rada ${seedNum}`,
      updatedAt: Date.now(),
    });
    setSeed(String(seedNum));
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
        <label>Seed</label>
        <input placeholder="juhuslik" value={seed} onChange={(e) => setSeed(e.target.value)} />
      </div>
      <button className="primary" style={{ width: '100%', marginTop: 8 }} onClick={generate}>
        Genereeri rada
      </button>
      <p style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
        Sama seed → sama rada. Lahtiseid muuda käsitsi + salvesta.
      </p>
    </div>
  );
}
