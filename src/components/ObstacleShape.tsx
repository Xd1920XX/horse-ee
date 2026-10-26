import { Group, Rect, Circle, Text, Arrow, Line } from 'react-konva';
import { Obstacle } from '../types';
import Konva from 'konva';

type Props = {
  obstacle: Obstacle;
  mPx: number;
  selected: boolean;
  showFlags: boolean;
  onSelect: (ev: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onDragEnd: (x: number, y: number) => void;
  onDragMove?: (x: number, y: number) => void;
};

const COLOR_BY_TYPE: Record<string, { pole: string; accent: string }> = {
  vertical:    { pole: '#f8fafc', accent: '#dc2626' },
  oxer:        { pole: '#f8fafc', accent: '#2563eb' },
  triple:      { pole: '#f8fafc', accent: '#16a34a' },
  wall:        { pole: '#78350f', accent: '#92400e' },
  liverpool:   { pole: '#f8fafc', accent: '#0891b2' },
  water:       { pole: '#0ea5e9', accent: '#0369a1' },
  combination: { pole: '#f8fafc', accent: '#a855f7' },
  cavaletti:   { pole: '#f8fafc', accent: '#9ca3af' },
};

export function ObstacleShape({ obstacle: o, mPx, selected, showFlags, onSelect, onDragEnd, onDragMove }: Props) {
  const color = COLOR_BY_TYPE[o.type] ?? COLOR_BY_TYPE.vertical;
  const w = o.width * mPx;
  const spread = (o.spread || 0) * mPx;

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    onDragEnd(node.x() / mPx, node.y() / mPx);
  };
  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    onDragMove?.(node.x() / mPx, node.y() / mPx);
  };

  const renderBars = () => {
    switch (o.type) {
      case 'vertical':
        return [<Rect key="v" x={-2} y={-w / 2} width={4} height={w} fill={color.accent} />];
      case 'oxer':
        return [
          <Rect key="a" x={-spread / 2 - 2} y={-w / 2} width={4} height={w} fill={color.accent} />,
          <Rect key="b" x={spread / 2 - 2} y={-w / 2} width={4} height={w} fill={color.accent} />,
        ];
      case 'triple':
        return [
          <Rect key="a" x={-spread / 2 - 2} y={-w / 2} width={4} height={w} fill={color.accent} />,
          <Rect key="b" x={-2} y={-w / 2} width={4} height={w} fill={color.accent} />,
          <Rect key="c" x={spread / 2 - 2} y={-w / 2} width={4} height={w} fill={color.accent} />,
        ];
      case 'wall':
        return [<Rect key="w" x={-spread / 2} y={-w / 2} width={spread} height={w} fill={color.accent} cornerRadius={2} />];
      case 'liverpool':
        return [
          <Rect key="pool" x={-spread / 2} y={-w / 2} width={spread} height={w} fill="#0369a1" opacity={0.6} />,
          <Rect key="pole" x={-2} y={-w / 2} width={4} height={w} fill={color.accent} />,
        ];
      case 'water':
        return [
          <Rect
            key="pool"
            x={-spread / 2}
            y={-w / 2}
            width={spread}
            height={w}
            fill="#0369a1"
            stroke="#0ea5e9"
            strokeWidth={2}
            cornerRadius={3}
          />,
        ];
      case 'cavaletti':
        return [<Rect key="c" x={-3} y={-w / 2} width={6} height={w} fill={color.accent} opacity={0.7} />];
      case 'combination':
        return [<Rect key="v" x={-2} y={-w / 2} width={4} height={w} fill={color.accent} />];
    }
  };

  const label = o.number != null ? `${o.number}${o.letter ?? ''}` : '';
  const halfSpread = Math.max(spread / 2, 6);

  return (
    <Group
      x={o.x * mPx}
      y={o.y * mPx}
      rotation={o.rotation}
      draggable
      onDragEnd={handleDragEnd}
      onDragMove={handleDragMove}
      onClick={onSelect}
      onTap={onSelect}
    >
      {selected && (
        <Rect
          x={-halfSpread - 4}
          y={-w / 2 - 4}
          width={halfSpread * 2 + 8}
          height={w + 8}
          stroke="#fbbf24"
          strokeWidth={2}
          dash={[4, 4]}
          listening={false}
        />
      )}
      {renderBars()}
      {/* FEI flags: red right (positive y local), white left */}
      {showFlags && o.type !== 'water' && o.type !== 'cavaletti' && (
        <>
          <Line
            points={[spread / 2 + 1, -w / 2, spread / 2 + 6, -w / 2 - 3, spread / 2 + 1, -w / 2 - 6]}
            closed
            fill="#f8fafc"
            stroke="#64748b"
            strokeWidth={0.5}
            listening={false}
          />
          <Line
            points={[spread / 2 + 1, w / 2, spread / 2 + 6, w / 2 + 3, spread / 2 + 1, w / 2 + 6]}
            closed
            fill="#dc2626"
            stroke="#7f1d1d"
            strokeWidth={0.5}
            listening={false}
          />
        </>
      )}
      {/* jump direction arrow */}
      <Arrow
        points={[-halfSpread - 4, 0, -halfSpread - 10, 0]}
        pointerLength={5}
        pointerWidth={5}
        fill={selected ? '#fbbf24' : '#64748b'}
        stroke={selected ? '#fbbf24' : '#64748b'}
        strokeWidth={1}
        listening={false}
      />
      {/* combo lock indicator */}
      {o.comboGroupId && (
        <Circle x={halfSpread + 10} y={-w / 2 - 4} radius={4} fill="#a855f7" listening={false} />
      )}
      {/* notes indicator */}
      {o.notes && (
        <Circle x={halfSpread + 10} y={w / 2 + 4} radius={4} fill="#0ea5e9" listening={false} />
      )}
      {label && (
        <Group listening={false}>
          <Circle x={0} y={w / 2 + 14} radius={10} fill="#fbbf24" stroke="#78350f" strokeWidth={1} />
          <Text
            x={-10}
            y={w / 2 + 8}
            width={20}
            height={14}
            text={label}
            fontSize={12}
            fontStyle="bold"
            fill="#0f172a"
            align="center"
            verticalAlign="middle"
          />
        </Group>
      )}
    </Group>
  );
}

