import { Obstacle } from '../../types';

// Build a 3D representation of a single obstacle. All units in meters.
// Course coordinates: x = east, y = north (top-down). We map to Three.js world
// as x = east, z = north, y = up (vertical height).

const POLE_RADIUS = 0.05;
const STANDARD_SIZE = 0.18;

type Props = { obstacle: Obstacle };

export function Obstacle3D({ obstacle: o }: Props) {
  const h = Math.max(0.05, o.height / 100);
  const w = o.width;
  const spread = o.spread;
  const rot = (o.rotation * Math.PI) / 180;

  return (
    <group position={[o.x, 0, o.y]} rotation={[0, -rot, 0]}>
      {renderObstacle(o.type, w, h, spread)}
      {o.number != null && (
        <group position={[0, h + 0.6, w / 2 + 0.6]}>
          <mesh>
            <boxGeometry args={[0.6, 0.4, 0.05]} />
            <meshStandardMaterial color="#fbbf24" />
          </mesh>
        </group>
      )}
    </group>
  );
}

function renderObstacle(type: Obstacle['type'], w: number, h: number, spread: number) {
  switch (type) {
    case 'vertical':
    case 'combination':
      return <Vertical w={w} h={h} />;
    case 'oxer':
      return <Oxer w={w} h={h} spread={spread} />;
    case 'triple':
      return <Triple w={w} h={h} spread={spread} />;
    case 'wall':
      return <Wall w={w} h={h} spread={spread || 0.4} />;
    case 'liverpool':
      return <Liverpool w={w} h={h} spread={spread} />;
    case 'water':
      return <Water w={w} spread={spread} />;
    case 'cavaletti':
      return <Cavaletti w={w} h={h} />;
    default:
      return <Vertical w={w} h={h} />;
  }
}

function Standard({ x, h }: { x: number; h: number }) {
  return (
    <mesh position={[x, h / 2 + 0.2, 0]} castShadow>
      <boxGeometry args={[STANDARD_SIZE, h + 0.4, STANDARD_SIZE]} />
      <meshStandardMaterial color="#f8fafc" />
    </mesh>
  );
}

function Pole({ y, w, color = '#ef4444' }: { y: number; w: number; color?: string }) {
  return (
    <mesh position={[0, y, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[POLE_RADIUS, POLE_RADIUS, w, 12]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function Vertical({ w, h }: { w: number; h: number }) {
  return (
    <>
      <Standard x={-w / 2} h={h} />
      <Standard x={w / 2} h={h} />
      <Pole y={h} w={w} color="#ef4444" />
      {h > 0.6 && <Pole y={h * 0.6} w={w} color="#f8fafc" />}
    </>
  );
}

function Oxer({ w, h, spread }: { w: number; h: number; spread: number }) {
  return (
    <>
      {/* front rail */}
      <group position={[0, 0, -spread / 2]}>
        <Standard x={-w / 2} h={h} />
        <Standard x={w / 2} h={h} />
        <Pole y={h} w={w} color="#2563eb" />
      </group>
      {/* back rail */}
      <group position={[0, 0, spread / 2]}>
        <Standard x={-w / 2} h={h} />
        <Standard x={w / 2} h={h} />
        <Pole y={h} w={w} color="#2563eb" />
      </group>
    </>
  );
}

function Triple({ w, h, spread }: { w: number; h: number; spread: number }) {
  return (
    <>
      {[-spread / 2, 0, spread / 2].map((z, i) => (
        <group key={i} position={[0, 0, z]}>
          <Standard x={-w / 2} h={h * (0.7 + 0.15 * i)} />
          <Standard x={w / 2} h={h * (0.7 + 0.15 * i)} />
          <Pole y={h * (0.7 + 0.15 * i)} w={w} color="#16a34a" />
        </group>
      ))}
    </>
  );
}

function Wall({ w, h, spread }: { w: number; h: number; spread: number }) {
  return (
    <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[w, h, spread]} />
      <meshStandardMaterial color="#92400e" />
    </mesh>
  );
}

function Liverpool({ w, h, spread }: { w: number; h: number; spread: number }) {
  return (
    <>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w + 1, spread]} />
        <meshStandardMaterial color="#0369a1" opacity={0.7} transparent />
      </mesh>
      <Standard x={-w / 2} h={h} />
      <Standard x={w / 2} h={h} />
      <Pole y={h} w={w} color="#0891b2" />
    </>
  );
}

function Water({ w, spread }: { w: number; spread: number }) {
  return (
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[w, spread]} />
      <meshStandardMaterial color="#0ea5e9" />
    </mesh>
  );
}

function Cavaletti({ w, h }: { w: number; h: number }) {
  return (
    <>
      <Pole y={Math.max(0.15, h)} w={w} color="#9ca3af" />
      {/* X-shaped supports */}
      <mesh position={[-w / 2, h / 2, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.05, h * 1.4, 0.05]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>
      <mesh position={[w / 2, h / 2, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.05, h * 1.4, 0.05]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>
    </>
  );
}
