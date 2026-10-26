import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sky, Stats } from '@react-three/drei';
import * as THREE from 'three';
import { Course } from '../types';
import { sortedByNumber } from '../geometry';
import { Obstacle3D } from './obstacles3d/Obstacle3D';

type Props = {
  course: Course;
  walkMode?: boolean;
  onExitWalk?: () => void;
};

export function CoursePreview3D({ course, walkMode, onExitWalk }: Props) {
  const arenaW = course.arena.width;
  const arenaH = course.arena.height;
  const groundColor =
    course.arena.indoor ? '#78350f' :
    course.arena.surface === 'grass' ? '#4a7a3a' : '#d6c89a';

  return (
    <div className="three-wrap">
      <Canvas
        shadows
        camera={{ position: [arenaW / 2, 30, arenaH * 1.3], fov: 50, near: 0.5, far: 500 }}
      >
        <Suspense fallback={null}>
          {!course.arena.indoor && <Sky sunPosition={[100, 20, 100]} />}
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[arenaW / 2 + 30, 50, arenaH / 2 + 30]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-left={-60}
            shadow-camera-right={60}
            shadow-camera-top={60}
            shadow-camera-bottom={-60}
          />

          {/* ground */}
          <mesh
            position={[arenaW / 2, 0, arenaH / 2]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[arenaW, arenaH]} />
            <meshStandardMaterial color={groundColor} />
          </mesh>

          {/* arena fence */}
          <Fence w={arenaW} h={arenaH} indoor={course.arena.indoor} />

          {/* ground outside arena */}
          <mesh position={[arenaW / 2, -0.01, arenaH / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[arenaW * 3, arenaH * 3]} />
            <meshStandardMaterial color={course.arena.indoor ? '#1e293b' : '#2a4a2a'} />
          </mesh>

          {/* obstacles */}
          {course.obstacles.map((o) => (
            <Obstacle3D key={o.id} obstacle={o} />
          ))}

          {/* start / finish gates */}
          <Gate marker={course.start} color="#22c55e" label="START" />
          <Gate marker={course.finish} color="#ef4444" label="FINIŠ" />

          {/* riding line */}
          <RidingLine course={course} />

          {walkMode ? (
            <WalkCamera course={course} onDone={onExitWalk} />
          ) : (
            <OrbitControls
              target={[arenaW / 2, 1, arenaH / 2]}
              enableDamping
              dampingFactor={0.1}
              maxPolarAngle={Math.PI / 2 - 0.05}
              minDistance={5}
              maxDistance={200}
            />
          )}

          {import.meta.env.DEV && <Stats />}
        </Suspense>
      </Canvas>
    </div>
  );
}

function Fence({ w, h, indoor }: { w: number; h: number; indoor: boolean }) {
  const color = indoor ? '#78350f' : '#f8fafc';
  const H = 1.2;
  return (
    <group>
      {/* 4 fence rails forming perimeter */}
      <mesh position={[w / 2, H / 2, 0]} castShadow>
        <boxGeometry args={[w, H, 0.1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[w / 2, H / 2, h]} castShadow>
        <boxGeometry args={[w, H, 0.1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, H / 2, h / 2]} castShadow>
        <boxGeometry args={[0.1, H, h]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[w, H / 2, h / 2]} castShadow>
        <boxGeometry args={[0.1, H, h]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function Gate({
  marker,
  color,
  label,
}: {
  marker: { x: number; y: number; rotation: number };
  color: string;
  label: string;
}) {
  const rot = (marker.rotation * Math.PI) / 180;
  return (
    <group position={[marker.x, 0, marker.y]} rotation={[0, -rot, 0]}>
      {/* two posts perpendicular to travel direction */}
      <mesh position={[0, 1.3, -2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 2.6, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.3, 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 2.6, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* banner */}
      <mesh position={[0, 2.4, 0]}>
        <boxGeometry args={[0.1, 0.4, 4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* label plate (just an orange rectangle; text rendering in r3f needs extra setup) */}
      <mesh position={[0.1, 2.4, 0]}>
        <planeGeometry args={[1.5, 0.3]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* visually mark label by a small triangle */}
      <group position={[0, 3, 0]}>
        <mesh castShadow>
          <coneGeometry args={[0.3, 0.5, 4]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
      <GateLabel text={label} />
    </group>
  );
}

function GateLabel({ text }: { text: string }) {
  // Use a sprite-like billboard: a plane that always faces camera.
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ camera }) => {
    if (ref.current) ref.current.lookAt(camera.position);
  });
  const canvas = useMemo(() => makeTextTexture(text, '#0f172a', '#fbbf24'), [text]);
  return (
    <mesh position={[0, 3.8, 0]} ref={ref}>
      <planeGeometry args={[2.2, 0.6]} />
      <meshBasicMaterial map={canvas} transparent />
    </mesh>
  );
}

function makeTextTexture(text: string, bg: string, fg: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = fg;
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function RidingLine({ course }: { course: Course }) {
  const points = useMemo(() => {
    const ordered = sortedByNumber(course.obstacles);
    const pts: THREE.Vector3[] = [new THREE.Vector3(course.start.x, 0.1, course.start.y)];
    for (const o of ordered) pts.push(new THREE.Vector3(o.x, 0.1, o.y));
    pts.push(new THREE.Vector3(course.finish.x, 0.1, course.finish.y));
    return pts;
  }, [course]);

  if (points.length < 2) return null;

  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.3);
  const geometry = new THREE.TubeGeometry(curve, points.length * 10, 0.1, 8, false);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#fbbf24" />
    </mesh>
  );
}

function WalkCamera({ course, onDone }: { course: Course; onDone?: () => void }) {
  const { camera } = useThree();
  const progressRef = useRef(0);

  const curve = useMemo(() => {
    const ordered = sortedByNumber(course.obstacles);
    const pts: THREE.Vector3[] = [new THREE.Vector3(course.start.x, 2.2, course.start.y)];
    for (const o of ordered) pts.push(new THREE.Vector3(o.x, 2.2, o.y));
    pts.push(new THREE.Vector3(course.finish.x, 2.2, course.finish.y));
    return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.3);
  }, [course]);

  useEffect(() => {
    progressRef.current = 0;
  }, [course]);

  useFrame((_, delta) => {
    progressRef.current += delta * 0.03;
    if (progressRef.current >= 1) {
      progressRef.current = 0;
      onDone?.();
      return;
    }
    const t = progressRef.current;
    const pos = curve.getPointAt(Math.min(0.999, t));
    const look = curve.getPointAt(Math.min(0.999, t + 0.02));
    camera.position.copy(pos);
    camera.lookAt(look);
  });

  return null;
}
