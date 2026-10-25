import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Line, Text, Group, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import { useStore } from '../store';
import { ObstacleShape } from './ObstacleShape';
import { DecorationShape } from './DecorationShape';
import { dist, pathPoints, sortedByNumber, stridesBetween } from '../geometry';

const PADDING = 24;

export function ArenaCanvas() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });

  const course = useStore((s) => s.course);
  const selectedIds = useStore((s) => s.selectedIds);
  const showGrid = useStore((s) => s.showGrid);
  const showDistances = useStore((s) => s.showDistances);
  const showPath = useStore((s) => s.showPath);
  const showFlags = useStore((s) => s.showFlags);
  const tool = useStore((s) => s.tool);
  const pendingObstacle = useStore((s) => s.pendingObstacleType);
  const pendingDecoration = useStore((s) => s.pendingDecorationType);
  const rulerPoints = useStore((s) => s.rulerPoints);
  const zoom = useStore((s) => s.zoom);
  const pan = useStore((s) => s.pan);

  const select = useStore((s) => s.select);
  const toggleSelect = useStore((s) => s.toggleSelect);
  const clearSelection = useStore((s) => s.clearSelection);
  const updateObstacle = useStore((s) => s.updateObstacle);
  const updateDecoration = useStore((s) => s.updateDecoration);
  const moveMarker = useStore((s) => s.moveMarker);
  const addObstacle = useStore((s) => s.addObstacle);
  const addDecoration = useStore((s) => s.addDecoration);
  const setPendingObstacle = useStore((s) => s.setPendingObstacle);
  const setPendingDecoration = useStore((s) => s.setPendingDecoration);
  const addRulerPoint = useStore((s) => s.addRulerPoint);
  const setZoom = useStore((s) => s.setZoom);
  const setPan = useStore((s) => s.setPan);

  const [bgImage] = useImage(course.background?.dataUrl ?? '');

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const arenaW = course.arena.width;
  const arenaH = course.arena.height;
  const scaleX = (size.w - PADDING * 2) / arenaW;
  const scaleY = (size.h - PADDING * 2) / arenaH;
  const fitPx = Math.max(2, Math.min(scaleX, scaleY));
  const mPx = fitPx * zoom;
  const offsetX = (size.w - arenaW * mPx) / 2 + pan.x;
  const offsetY = (size.h - arenaH * mPx) / 2 + pan.y;

  // Pinch zoom + 2-finger pan
  const pinchRef = useRef<{ dist: number; center: { x: number; y: number } } | null>(null);
  const twoFingerPanRef = useRef<{ cx: number; cy: number; pan: { x: number; y: number } } | null>(null);

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    const t = e.evt.touches;
    if (t.length !== 2) return;
    e.evt.preventDefault();
    const [a, b] = [t[0], t[1]];
    const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const cx = (a.clientX + b.clientX) / 2;
    const cy = (a.clientY + b.clientY) / 2;
    if (!pinchRef.current) {
      pinchRef.current = { dist: d, center: { x: cx, y: cy } };
      twoFingerPanRef.current = { cx, cy, pan: { ...pan } };
      return;
    }
    const scale = d / pinchRef.current.dist;
    if (Math.abs(scale - 1) > 0.02) {
      setZoom(zoom * scale);
      pinchRef.current.dist = d;
    }
    if (twoFingerPanRef.current) {
      const dx = cx - twoFingerPanRef.current.cx;
      const dy = cy - twoFingerPanRef.current.cy;
      if (Math.hypot(dx, dy) > 3) {
        setPan(twoFingerPanRef.current.pan.x + dx, twoFingerPanRef.current.pan.y + dy);
      }
    }
  };

  const handleTouchEnd = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (e.evt.touches.length < 2) {
      pinchRef.current = null;
      twoFingerPanRef.current = null;
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;
    const scaleBy = e.evt.deltaY > 0 ? 0.9 : 1.1;
    setZoom(zoom * scaleBy);
  };

  // Click/tap on background: place or clear selection or ruler
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // ignore if multi-touch
    if ('touches' in e.evt && (e.evt as TouchEvent).touches.length > 1) return;
    if (pinchRef.current) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const target = e.target;
    const onBg = target === stage || target.name() === 'arena-bg';
    if (!onBg) return;
    const pt = stage.getPointerPosition();
    if (!pt) return;
    const xM = (pt.x - offsetX) / mPx;
    const yM = (pt.y - offsetY) / mPx;

    if (tool === 'ruler') {
      addRulerPoint(xM, yM);
      return;
    }
    if (pendingObstacle) {
      if (xM >= 0 && xM <= arenaW && yM >= 0 && yM <= arenaH) {
        addObstacle(pendingObstacle, xM, yM);
        setPendingObstacle(null);
      }
      return;
    }
    if (pendingDecoration) {
      if (xM >= 0 && xM <= arenaW && yM >= 0 && yM <= arenaH) {
        addDecoration(pendingDecoration, xM, yM);
        setPendingDecoration(null);
      }
      return;
    }
    clearSelection();
  };

  const path = pathPoints(course.start, course.obstacles, course.finish);
  const ordered = sortedByNumber(course.obstacles);

  const distanceLabels: { x: number; y: number; text: string }[] = [];
  if (showDistances) {
    const points: { x: number; y: number; label: string }[] = [
      { x: course.start.x, y: course.start.y, label: 'S' },
      ...ordered.map((o) => ({ x: o.x, y: o.y, label: `${o.number}` })),
      { x: course.finish.x, y: course.finish.y, label: 'F' },
    ];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const d = dist(a, b);
      const info = stridesBetween(d);
      distanceLabels.push({
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
        text: `${d.toFixed(1)}m · ${info.label}`,
      });
    }
  }

  const rulerLine =
    rulerPoints.length === 2
      ? {
          d: dist(rulerPoints[0], rulerPoints[1]),
          mx: (rulerPoints[0].x + rulerPoints[1].x) / 2,
          my: (rulerPoints[0].y + rulerPoints[1].y) / 2,
        }
      : null;

  const hudText =
    tool === 'ruler'
      ? `MÕÕDULINT — ${rulerPoints.length}/2 punkti puudutatud`
      : pendingObstacle
      ? `Puuduta väljakut — ${pendingObstacle}`
      : pendingDecoration
      ? `Puuduta väljakut — ${pendingDecoration}`
      : `${arenaW}×${arenaH}m · zoom ${zoom.toFixed(2)}x · ${course.obstacles.length} takistust`;

  const bg = course.background;

  return (
    <div ref={wrapRef} className="canvas-wrap">
      <div className="hud">{hudText}</div>
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        onMouseDown={handleStageClick}
        onTouchStart={handleStageClick}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <Layer>
          <Group x={offsetX} y={offsetY}>
            {/* arena background */}
            <Rect
              name="arena-bg"
              x={0}
              y={0}
              width={arenaW * mPx}
              height={arenaH * mPx}
              fill={course.arena.indoor ? '#78350f' : course.arena.surface === 'grass' ? '#86a76b' : '#d6c89a'}
              stroke="#0f172a"
              strokeWidth={2}
            />
            {/* bg image overlay */}
            {bg && bgImage && (
              <KonvaImage
                image={bgImage}
                x={bg.x * mPx}
                y={bg.y * mPx}
                width={arenaW * bg.scale * mPx}
                height={(arenaW * bg.scale * mPx * bgImage.height) / bgImage.width}
                opacity={bg.opacity}
                listening={false}
              />
            )}
            {/* grid */}
            {showGrid && (
              <>
                {Array.from({ length: Math.floor(arenaW) + 1 }, (_, i) => (
                  <Line
                    key={`gx${i}`}
                    points={[i * mPx, 0, i * mPx, arenaH * mPx]}
                    stroke={i % 5 === 0 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}
                    strokeWidth={1}
                    listening={false}
                  />
                ))}
                {Array.from({ length: Math.floor(arenaH) + 1 }, (_, i) => (
                  <Line
                    key={`gy${i}`}
                    points={[0, i * mPx, arenaW * mPx, i * mPx]}
                    stroke={i % 5 === 0 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}
                    strokeWidth={1}
                    listening={false}
                  />
                ))}
              </>
            )}

            {/* path */}
            {showPath && path.length >= 4 && (
              <Line
                points={path.map((v) => v * mPx)}
                stroke="#fbbf24"
                strokeWidth={2}
                dash={[8, 6]}
                lineCap="round"
                listening={false}
                tension={0.3}
              />
            )}

            {/* distance labels */}
            {distanceLabels.map((d, i) => (
              <Group key={`d${i}`} x={d.x * mPx} y={d.y * mPx} listening={false}>
                <Rect x={-32} y={-9} width={64} height={16} fill="rgba(15,23,42,0.85)" cornerRadius={3} />
                <Text
                  x={-32}
                  y={-9}
                  width={64}
                  height={16}
                  text={d.text}
                  fontSize={10}
                  fill="#e2e8f0"
                  align="center"
                  verticalAlign="middle"
                />
              </Group>
            ))}

            {/* decorations under obstacles */}
            {course.decorations.map((d) => (
              <DecorationShape
                key={d.id}
                decoration={d}
                mPx={mPx}
                selected={selectedIds.includes(d.id)}
                onSelect={() => select(d.id)}
                onDragEnd={(x, y) =>
                  updateDecoration(d.id, {
                    x: Math.max(0, Math.min(arenaW, x)),
                    y: Math.max(0, Math.min(arenaH, y)),
                  })
                }
              />
            ))}

            {/* obstacles */}
            {course.obstacles.map((o) => (
              <ObstacleShape
                key={o.id}
                obstacle={o}
                mPx={mPx}
                selected={selectedIds.includes(o.id)}
                showFlags={showFlags}
                onSelect={(ev) => {
                  const native = ev.evt as any;
                  if (native?.shiftKey || native?.ctrlKey || native?.metaKey) toggleSelect(o.id);
                  else select(o.id);
                }}
                onDragEnd={(x, y) =>
                  updateObstacle(o.id, {
                    x: Math.max(0, Math.min(arenaW, x)),
                    y: Math.max(0, Math.min(arenaH, y)),
                  })
                }
              />
            ))}

            {/* ruler */}
            {rulerPoints.length >= 1 && (
              <>
                {rulerPoints.map((p, i) => (
                  <Rect key={`rp${i}`} x={p.x * mPx - 5} y={p.y * mPx - 5} width={10} height={10} fill="#ef4444" cornerRadius={2} listening={false} />
                ))}
                {rulerPoints.length === 2 && rulerLine && (
                  <>
                    <Line
                      points={[rulerPoints[0].x * mPx, rulerPoints[0].y * mPx, rulerPoints[1].x * mPx, rulerPoints[1].y * mPx]}
                      stroke="#ef4444"
                      strokeWidth={2}
                      dash={[6, 4]}
                      listening={false}
                    />
                    <Group x={rulerLine.mx * mPx} y={rulerLine.my * mPx} listening={false}>
                      <Rect x={-45} y={-11} width={90} height={22} fill="rgba(239,68,68,0.95)" cornerRadius={3} />
                      <Text
                        x={-45}
                        y={-11}
                        width={90}
                        height={22}
                        text={`${rulerLine.d.toFixed(2)}m\n${stridesBetween(rulerLine.d).label}`}
                        fontSize={10}
                        fill="#fff"
                        align="center"
                        verticalAlign="middle"
                        fontStyle="bold"
                      />
                    </Group>
                  </>
                )}
              </>
            )}

            {/* start marker */}
            <StartFinishMarker
              marker={course.start}
              mPx={mPx}
              color="#22c55e"
              label="START"
              onDragEnd={(x, y) =>
                moveMarker('start', {
                  x: Math.max(0, Math.min(arenaW, x)),
                  y: Math.max(0, Math.min(arenaH, y)),
                })
              }
            />
            {/* finish marker */}
            <StartFinishMarker
              marker={course.finish}
              mPx={mPx}
              color="#ef4444"
              label="FINIŠ"
              onDragEnd={(x, y) =>
                moveMarker('finish', {
                  x: Math.max(0, Math.min(arenaW, x)),
                  y: Math.max(0, Math.min(arenaH, y)),
                })
              }
            />
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}

function StartFinishMarker({
  marker,
  mPx,
  color,
  label,
  onDragEnd,
}: {
  marker: { x: number; y: number; rotation: number };
  mPx: number;
  color: string;
  label: string;
  onDragEnd: (x: number, y: number) => void;
}) {
  return (
    <Group
      x={marker.x * mPx}
      y={marker.y * mPx}
      draggable
      onDragEnd={(e) => onDragEnd(e.target.x() / mPx, e.target.y() / mPx)}
    >
      <Line points={[-20, 0, 20, 0]} stroke={color} strokeWidth={3} />
      <Line points={[-20, -4, -20, 4]} stroke={color} strokeWidth={3} />
      <Line points={[20, -4, 20, 4]} stroke={color} strokeWidth={3} />
      <Rect x={-18} y={-18} width={36} height={13} fill={color} cornerRadius={2} />
      <Text x={-18} y={-18} width={36} height={13} text={label} fontSize={9} fontStyle="bold" fill="#0f172a" align="center" verticalAlign="middle" />
    </Group>
  );
}

export function getStagePng(): string | null {
  const canvas = document.querySelector<HTMLCanvasElement>('.canvas-wrap canvas');
  if (!canvas) return null;
  return canvas.toDataURL('image/png');
}
