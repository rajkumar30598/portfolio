import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '@/lib/theme';
import { projects } from '@/data/portfolio';
import { COINS, ISLAND_RADIUS, PLACES, STATIONS, TREES } from './layout';
import { playerPos } from './runtime';
import { useGame } from './store';

const css = (c: [number, number, number]) => `rgb(${c.join(',')})`;

/* ------------------------------------------------------------------ */
/* Floating labels                                                    */
/* ------------------------------------------------------------------ */
function Sign({ position, title, sub }: { position: [number, number, number]; title: string; sub?: string }) {
  return (
    <Html position={position} center distanceFactor={14} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div className="whitespace-nowrap rounded-xl border border-white/15 bg-black/55 px-3 py-1.5 text-center backdrop-blur-md">
        <p className="font-display text-xl leading-none tracking-wide text-white">{title}</p>
        {sub && <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-brand">{sub}</p>}
      </div>
    </Html>
  );
}

/* ------------------------------------------------------------------ */
/* Island                                                             */
/* ------------------------------------------------------------------ */
function Island({ brand }: { brand: string }) {
  // paths from the central plaza to each station
  const paths = useMemo(
    () =>
      STATIONS.filter((s) => !s.id.startsWith('project-') || s.id === 'project-1').map((s) => {
        const [x, z] = s.at;
        const len = Math.hypot(x, z);
        return { x: x / 2, z: z / 2, len, angle: Math.atan2(x, z) };
      }),
    []
  );
  return (
    <group>
      {/* grass top */}
      <mesh receiveShadow position={[0, -0.25, 0]}>
        <cylinderGeometry args={[ISLAND_RADIUS, ISLAND_RADIUS - 0.6, 0.5, 64]} />
        <meshStandardMaterial color="#2c5747" roughness={0.95} />
      </mesh>
      {/* rock underside tapering into the void */}
      <mesh position={[0, -4.5, 0]}>
        <coneGeometry args={[ISLAND_RADIUS - 0.6, 8, 32, 1, true]} />
        <meshStandardMaterial color="#2b2433" roughness={1} side={THREE.DoubleSide} flatShading />
      </mesh>
      {/* glowing rim */}
      <mesh rotation-x={Math.PI / 2} position={[0, 0.01, 0]}>
        <torusGeometry args={[ISLAND_RADIUS - 0.1, 0.06, 8, 128]} />
        <meshBasicMaterial color={brand} />
      </mesh>
      {/* central plaza */}
      <mesh receiveShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[4.2, 4.2, 0.06, 48]} />
        <meshStandardMaterial color="#3a3f4a" roughness={0.8} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.06, 0]}>
        <ringGeometry args={[3.6, 3.75, 64]} />
        <meshBasicMaterial color={brand} transparent opacity={0.6} />
      </mesh>
      {paths.map((p, i) => (
        <mesh key={i} position={[p.x, 0.03, p.z]} rotation-y={p.angle} receiveShadow>
          <boxGeometry args={[1.6, 0.04, p.len]} />
          <meshStandardMaterial color="#353a44" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function Trees() {
  return (
    <group>
      {TREES.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} scale={t.s}>
          <mesh position={[0, 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.18, 1.2, 6]} />
            <meshStandardMaterial color="#4a3426" />
          </mesh>
          {t.kind === 0 ? (
            <>
              <mesh position={[0, 1.7, 0]} castShadow>
                <coneGeometry args={[0.9, 1.6, 7]} />
                <meshStandardMaterial color="#2f6b4f" flatShading />
              </mesh>
              <mesh position={[0, 2.45, 0]} castShadow>
                <coneGeometry args={[0.65, 1.2, 7]} />
                <meshStandardMaterial color="#3d8a63" flatShading />
              </mesh>
            </>
          ) : (
            <mesh position={[0, 1.75, 0]} castShadow>
              <icosahedronGeometry args={[0.85, 0]} />
              <meshStandardMaterial color="#4f8f5e" flatShading />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

function Lamp({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 2.6, 8]} />
        <meshStandardMaterial color="#20232b" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.7, 0]}>
        <sphereGeometry args={[0.22, 16, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <pointLight position={[0, 2.7, 0]} color={color} intensity={6} distance={9} decay={1.6} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Stations                                                           */
/* ------------------------------------------------------------------ */
function House({ brand }: { brand: string }) {
  const [x, z] = PLACES.house;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[6, 3.6, 5]} />
        <meshStandardMaterial color="#e9e4da" roughness={0.9} />
      </mesh>
      <mesh position={[0, 4.6, 0]} rotation-y={Math.PI / 4} castShadow>
        <coneGeometry args={[4.6, 2.2, 4]} />
        <meshStandardMaterial color="#c2553f" flatShading />
      </mesh>
      {/* door */}
      <mesh position={[0, 1.1, 2.51]}>
        <boxGeometry args={[1.2, 2.2, 0.05]} />
        <meshStandardMaterial color="#3b2a22" />
      </mesh>
      {/* glowing windows */}
      {[-1.9, 1.9].map((wx) => (
        <mesh key={wx} position={[wx, 2, 2.51]}>
          <boxGeometry args={[1.1, 1, 0.05]} />
          <meshStandardMaterial color="#ffd68a" emissive="#ffb84d" emissiveIntensity={1.4} />
        </mesh>
      ))}
      <pointLight position={[0, 2.2, 4]} color="#ffc97a" intensity={5} distance={8} />
      <mesh position={[0, 0.03, 3.6]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.9, 1.05, 40]} />
        <meshBasicMaterial color={brand} />
      </mesh>
      <Sign position={[0, 6.6, 0]} title="About Me" sub="who I am" />
    </group>
  );
}

function Tower({ brand }: { brand: string }) {
  const [x, z] = PLACES.tower;
  const floors = [
    { y: 1.4, w: 4.2, h: 2.8, label: 'Gloify' },
    { y: 4.2, w: 3.6, h: 2.8, label: 'Ninjacart' },
    { y: 7, w: 3, h: 2.8, label: 'Neutrinos' },
  ];
  return (
    <group position={[x, 0, z]}>
      {floors.map((f, i) => (
        <group key={f.label} position={[0, f.y, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[f.w, f.h, f.w]} />
            <meshStandardMaterial color={i === 2 ? '#2b3140' : '#343b4c'} roughness={0.6} metalness={0.2} />
          </mesh>
          {/* window band facing the plaza */}
          <mesh position={[-f.w / 2 - 0.01, 0.1, 0]} rotation-y={-Math.PI / 2}>
            <planeGeometry args={[f.w * 0.8, f.h * 0.45]} />
            <meshStandardMaterial color={brand} emissive={brand} emissiveIntensity={i === 2 ? 1.2 : 0.5} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 9.1, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.6, 6]} />
        <meshStandardMaterial color="#aab" />
      </mesh>
      <mesh position={[0, 9.95, 0]}>
        <sphereGeometry args={[0.16, 12, 8]} />
        <meshBasicMaterial color="#ff5a5a" />
      </mesh>
      <Sign position={[-1, 11, 0]} title="Experience" sub="3 companies · 4+ yrs" />
    </group>
  );
}

function ArcadeCabinet({ z, index, image, accent }: { z: number; index: number; image: string; accent: string }) {
  const tex = useTexture(image, (t) => {
    const loaded = Array.isArray(t) ? t[0] : t;
    loaded.colorSpace = THREE.SRGBColorSpace;
  });
  const p = projects[index];
  return (
    <group position={[PLACES.arcadeX, 0, z]} rotation-y={Math.PI / 2}>
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 2.4, 1.3]} />
        <meshStandardMaterial color="#1a1c24" roughness={0.5} />
      </mesh>
      {/* side stripes */}
      {[-0.76, 0.76].map((sx) => (
        <mesh key={sx} position={[sx, 1.2, 0]}>
          <boxGeometry args={[0.02, 2.4, 1.3]} />
          <meshBasicMaterial color={accent} />
        </mesh>
      ))}
      {/* marquee */}
      <mesh position={[0, 2.55, 0.25]}>
        <boxGeometry args={[1.5, 0.35, 0.8]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.9} />
      </mesh>
      {/* screen with the real app screenshot */}
      <mesh position={[0, 1.75, 0.66]} rotation-x={-0.18}>
        <planeGeometry args={[1.2, 1.0]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {/* control panel */}
      <mesh position={[0, 1.05, 0.75]} rotation-x={-0.6}>
        <boxGeometry args={[1.4, 0.08, 0.5]} />
        <meshStandardMaterial color="#2a2d38" />
      </mesh>
      <mesh position={[-0.3, 1.13, 0.78]}>
        <sphereGeometry args={[0.07, 12, 8]} />
        <meshBasicMaterial color="#ff4d6d" />
      </mesh>
      <mesh position={[0.25, 1.12, 0.78]}>
        <cylinderGeometry args={[0.07, 0.07, 0.04, 16]} />
        <meshBasicMaterial color={accent} />
      </mesh>
      <pointLight position={[0, 1.8, 1.6]} color={accent} intensity={3} distance={4} />
      <Sign position={[0, 3.4, 0]} title={p.title.split(' – ')[0]} sub={p.company} />
    </group>
  );
}

function Arcade() {
  const accents = ['#8fd16a', '#ff4848', '#5b78ff'];
  const images = projects.slice(0, 3).map((p) => (p.visual ? p.visual.shots[p.visual.kind === 'phones' ? 1 : 0] : p.image));
  return (
    <group>
      {PLACES.cabinetsZ.map((z, i) => (
        <ArcadeCabinet key={i} z={z} index={i} image={images[i]} accent={accents[i]} />
      ))}
      <Sign position={[PLACES.arcadeX - 1, 4.9, -4.5]} title="Project Arcade" sub="my shipped apps" />
    </group>
  );
}

function Kiosk({ brand }: { brand: string }) {
  const [x, z] = PLACES.kiosk;
  const spin = useRef<THREE.Group>(null);
  useFrame((_, d) => {
    if (spin.current) spin.current.rotation.y += d * 0.6;
  });
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[1, 1.2, 1, 8]} />
        <meshStandardMaterial color="#3a3f4a" flatShading />
      </mesh>
      <group ref={spin} position={[0, 1.6, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, i * 0.22, 0]} rotation-y={i * 0.4}>
            <boxGeometry args={[0.9, 0.18, 0.65]} />
            <meshStandardMaterial color={['#c96f4a', '#4a7bc9', brand, '#8a5bc9'][i]} />
          </mesh>
        ))}
      </group>
      <Sign position={[0, 3.3, 0]} title="Archive" sub="earlier projects" />
    </group>
  );
}

function Mailbox({ brand }: { brand: string }) {
  const [x, z] = PLACES.mailbox;
  const flag = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (flag.current) flag.current.rotation.z = -0.3 + Math.sin(clock.elapsedTime * 2) * 0.25;
  });
  return (
    <group position={[x, 0, z]} rotation-y={-Math.PI / 4}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 1.2, 8]} />
        <meshStandardMaterial color="#5a4636" />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow>
        <boxGeometry args={[0.6, 0.5, 0.95]} />
        <meshStandardMaterial color={brand} roughness={0.4} />
      </mesh>
      <mesh ref={flag} position={[0.32, 1.45, -0.2]}>
        <boxGeometry args={[0.04, 0.45, 0.2]} />
        <meshStandardMaterial color="#ff4d4d" />
      </mesh>
      <Sign position={[0, 2.6, 0]} title="Contact" sub="say hello" />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Coins                                                              */
/* ------------------------------------------------------------------ */
function Coin({ index, brand }: { index: number; brand: string }) {
  const ref = useRef<THREE.Group>(null);
  const collected = useGame((s) => s.collected.includes(index));
  const c = COINS[index];
  useFrame(({ clock }, d) => {
    const g = ref.current;
    if (!g) return;
    const target = collected ? 0 : 1;
    const s = THREE.MathUtils.damp(g.scale.x, target, 10, d);
    g.scale.setScalar(s);
    g.visible = s > 0.02;
    g.rotation.y += d * 2.4;
    // fly up when collected
    g.position.y = 1 + Math.sin(clock.elapsedTime * 2 + index) * 0.15 + (collected ? (1 - s) * 2 : 0);
    // gentle magnet pull when the player is close
    const dist = Math.hypot(playerPos.x - c.at[0], playerPos.z - c.at[1]);
    if (!collected && dist < 2.4) {
      g.position.x = THREE.MathUtils.damp(g.position.x, c.at[0] + (playerPos.x - c.at[0]) * 0.4, 6, d);
      g.position.z = THREE.MathUtils.damp(g.position.z, c.at[1] + (playerPos.z - c.at[1]) * 0.4, 6, d);
    }
  });
  return (
    <group ref={ref} position={[c.at[0], 1, c.at[1]]}>
      <mesh rotation-x={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.38, 0.38, 0.09, 28]} />
        <meshStandardMaterial color="#ffd166" emissive="#ffb703" emissiveIntensity={0.6} metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.27, 0.03, 8, 28]} />
        <meshBasicMaterial color={brand} />
      </mesh>
      {!collected && (
        <Html position={[0, 0.75, 0]} center distanceFactor={12} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <span className="whitespace-nowrap rounded-full bg-black/50 px-2 py-0.5 font-mono text-[10px] text-[#ffd166]">
            {c.label}
          </span>
        </Html>
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ */
export function World() {
  const theme = useTheme();
  const brand = css(theme.brand);
  const brand2 = css(theme.brand2);
  return (
    <>
      <color attach="background" args={['#070a12']} />
      <fog attach="fog" args={['#070a12', 28, 70]} />
      <Stars radius={90} depth={40} count={2500} factor={4} saturation={0} fade speed={0.6} />
      <hemisphereLight args={['#9fb4ff', '#24382c', 0.9]} />
      <directionalLight
        position={[12, 20, 10]}
        intensity={1.3}
        color="#cdd8ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-bias={-0.0005}
      />
      <Island brand={brand} />
      <Trees />
      <House brand={brand} />
      <Tower brand={brand} />
      <Arcade />
      <Kiosk brand={brand} />
      <Mailbox brand={brand} />
      <Lamp position={[3.2, 0, 3.2]} color={brand} />
      <Lamp position={[-3.2, 0, -3.2]} color={brand2} />
      <Lamp position={[-7.5, 0, -10]} color={brand} />
      <Lamp position={[6, 0, 11]} color={brand2} />
      {COINS.map((_, i) => (
        <Coin key={i} index={i} brand={brand} />
      ))}
    </>
  );
}
