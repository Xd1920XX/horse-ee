import { Group, Rect, Circle, Text, Line } from 'react-konva';
import Konva from 'konva';
import { Decoration } from '../types';

type Props = {
  decoration: Decoration;
  mPx: number;
  selected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
};

export function DecorationShape({ decoration: d, mPx, selected, onSelect, onDragEnd }: Props) {
  const s = d.size * mPx;
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    onDragEnd(node.x() / mPx, node.y() / mPx);
  };

  const render = () => {
    switch (d.type) {
      case 'flower':
        return (
          <Group>
            <Circle x={0} y={0} radius={s / 2} fill="#f472b6" opacity={0.9} />
            <Circle x={0} y={0} radius={s / 4} fill="#fde047" />
          </Group>
        );
      case 'tree':
        return (
          <Group>
            <Circle x={0} y={0} radius={s / 2} fill="#166534" opacity={0.85} />
            <Circle x={0} y={0} radius={s / 3} fill="#15803d" />
          </Group>
        );
      case 'judge':
        return (
          <Group>
            <Rect x={-s / 2} y={-s / 2} width={s} height={s} fill="#78350f" stroke="#422006" strokeWidth={1} />
            <Rect x={-s / 2} y={-s / 4} width={s} height={s / 8} fill="#1e293b" />
            <Text x={-s / 2} y={-s / 2 + 2} width={s} text="K" fontSize={Math.max(8, s / 3)} fontStyle="bold" fill="#fde047" align="center" />
          </Group>
        );
      case 'tent':
        return (
          <Group>
            <Line points={[-s / 2, s / 2, 0, -s / 2, s / 2, s / 2, -s / 2, s / 2]} fill="#dc2626" stroke="#7f1d1d" strokeWidth={1} closed />
          </Group>
        );
      case 'warmup':
        return (
          <Rect x={-s / 2} y={-s / 2} width={s} height={s / 2} fill="rgba(132,204,22,0.3)" stroke="#65a30d" strokeWidth={1} dash={[4, 4]} />
        );
      case 'arrow':
        return (
          <Group>
            <Line points={[-s / 2, 0, s / 2 - s / 4, 0]} stroke="#fbbf24" strokeWidth={3} />
            <Line points={[s / 2, 0, s / 2 - s / 3, -s / 4, s / 2 - s / 3, s / 4, s / 2, 0]} fill="#fbbf24" stroke="#fbbf24" strokeWidth={1} closed />
          </Group>
        );
      case 'label':
        return (
          <Group>
            <Rect x={-s} y={-s / 4} width={s * 2} height={s / 2} fill="rgba(15,23,42,0.85)" stroke="#fbbf24" strokeWidth={1} cornerRadius={3} />
            <Text x={-s} y={-s / 4} width={s * 2} height={s / 2} text={d.text ?? ''} fontSize={Math.max(8, s / 2)} fill="#e2e8f0" align="center" verticalAlign="middle" />
          </Group>
        );
    }
  };

  return (
    <Group
      x={d.x * mPx}
      y={d.y * mPx}
      rotation={d.rotation}
      draggable
      onDragEnd={handleDragEnd}
      onClick={onSelect}
      onTap={onSelect}
    >
      {selected && (
        <Rect x={-s / 2 - 4} y={-s / 2 - 4} width={s + 8} height={s + 8} stroke="#fbbf24" strokeWidth={1.5} dash={[3, 3]} listening={false} />
      )}
      {render()}
    </Group>
  );
}
