import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
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
  const skyColor = course.arena.indoor ? '#1e293b' : '#7dd3fc';

  return (
    <div className="three-wrap" style={{ background: skyColor }}>
      <Canvas
        camera={{ position: [arenaW / 2, 30, arenaH * 1.3], fov: 50, near: 0.5, far: 500 }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.8} />
          <directionalLight
            position={[arenaW / 2 + 30, 50, arenaH / 2 + 30]}
            intensity={1.0}
          />

          {/* arena ground */}
          <mesh
            position={[arenaW / 2, 0, arenaH / 2]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[arenaW, arenaH]} />
            <meshStandardMaterial color={groundColor} />
          </mesh>

          {/* arena fence */}
          <Fence w={arenaW} h={arenaH} indoor={course.arena.indoor} />

          {/* obstacles */}
          {course.obstacles.map((o) => (
            <Obstacle3D key={o.id} obstacle={o} />
          ))}

          {/* start / finish markers */}
          <Gate marker={course.start} color="#22c55e" />
          <Gate marker={course.finish} color="#ef4444" />

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
      <mesh position={[w / 2, H / 2, 0]}>
        <boxGeometry args={[w, H, 0.1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[w / 2, H / 2, h]}>
        <boxGeometry args={[w, H, 0.1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, H / 2, h / 2]}>
        <boxGeometry args={[0.1, H, h]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[w, H / 2, h / 2]}>
        <boxGeometry args={[0.1, H, h]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function Gate({
  marker,
  color,
}: {
  marker: { x: number; y: number; rotation: number };
  color: string;
}) {
  const rot = (marker.rotation * Math.PI) / 180;
  return (
    <group position={[marker.x, 0, marker.y]} rotation={[0, -rot, 0]}>
      <mesh position={[0, 1.3, -2]}>
        <cylinderGeometry args={[0.1, 0.1, 2.6, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.3, 2]}>
        <cylinderGeometry args={[0.1, 0.1, 2.6, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 2.4, 0]}>
        <boxGeometry args={[0.1, 0.4, 4]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function RidingLine({ course }: { course: Course }) {
  const geometry = useMemo(() => {
    const ordered = sortedByNumber(course.obstacles);
    const pts: THREE.Vector3[] = [new THREE.Vector3(course.start.x, 0.1, course.start.y)];
    for (const o of ordered) pts.push(new THREE.Vector3(o.x, 0.1, o.y));
    pts.push(new THREE.Vector3(course.finish.x, 0.1, course.finish.y));
    if (pts.length < 2) return null;
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.3);
    return new THREE.TubeGeometry(curve, Math.max(16, pts.length * 10), 0.1, 8, false);
  }, [course]);

  if (!geometry) return null;

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
    if (pts.length < 2) return null;
    return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.3);
  }, [course]);

  useEffect(() => {
    progressRef.current = 0;
  }, [course]);

  useFrame((_, delta) => {
    if (!curve) return;
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
