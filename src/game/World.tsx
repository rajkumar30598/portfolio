import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '@/lib/theme';
import { projects } from '@/data/portfolio';
import { COINS, ISLAND_RADIUS, PLACES, RAMPS, RING_ROAD, STATIONS, TREES } from './layout';
import { cones, playerPos, puffs } from './runtime';
import { useGame } from './store';

const css = (c: [number, number, number]) => `rgb(${c.join(',')})`;

/* ------------------------------------------------------------------ */
/* Floating labels                                                    */
/* ------------------------------------------------------------------ */
function Sign({ position, title, sub }: { position: [number, number, number]; title: string; sub?: string }) {
  return (
    <Html position={position} center distanceFactor={18} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div className="whitespace-nowrap rounded-xl border border-white/15 bg-black/55 px-3 py-1.5 text-center backdrop-blur-md">
        <p className="font-display text-xl leading-none tracking-wide text-white">{title}</p>
        {sub && <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-brand">{sub}</p>}
      </div>
    </Html>
  );
}

/* ------------------------------------------------------------------ */
/* Island + roads                                                     */
/* ------------------------------------------------------------------ */
function Island({ brand }: { brand: string }) {
  // spokes from the ring road out to each building's pad
  const spokes = useMemo(
    () =>
      STATIONS.filter((s) => !s.id.startsWith('project-') || s.id === 'project-1').map((s) => {
        const [x, z] = s.at;
        const len = Math.hypot(x, z);
        const start = RING_ROAD.outer - 0.5;
        const mid = (start + len) / 2;
        const a = Math.atan2(x, z);
        return { x: Math.sin(a) * mid, z: Math.cos(a) * mid, len: len - start, angle: a };
      }),
    []
  );
  // lane dashes around the ring road
  const dashes = useMemo(() => {
    const r = (RING_ROAD.inner + RING_ROAD.outer) / 2;
    return Array.from({ length: 36 }, (_, i) => {
      const a = (i / 36) * Math.PI * 2;
      return { x: Math.sin(a) * r, z: Math.cos(a) * r, a };
    });
  }, []);
  return (
    <group>
      <mesh receiveShadow position={[0, -0.25, 0]}>
        <cylinderGeometry args={[ISLAND_RADIUS, ISLAND_RADIUS - 0.8, 0.5, 96]} />
        <meshStandardMaterial color="#2c5747" roughness={0.95} />
      </mesh>
      <mesh position={[0, -6, 0]}>
        <coneGeometry args={[ISLAND_RADIUS - 0.8, 11, 40, 1, true]} />
        <meshStandardMaterial color="#2b2433" roughness={1} side={THREE.DoubleSide} flatShading />
      </mesh>
      {/* glowing rim = the wall you bounce off */}
      <mesh rotation-x={Math.PI / 2} position={[0, 0.05, 0]}>
        <torusGeometry args={[ISLAND_RADIUS - 1.4, 0.09, 8, 160]} />
        <meshBasicMaterial color={brand} />
      </mesh>
      {/* ring road */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} receiveShadow>
        <ringGeometry args={[RING_ROAD.inner, RING_ROAD.outer, 96]} />
        <meshStandardMaterial color="#2c3039" roughness={0.9} />
      </mesh>
      {dashes.map((d, i) => (
        <mesh key={i} position={[d.x, 0.035, d.z]} rotation-y={d.a + Math.PI / 2}>
          <boxGeometry args={[0.15, 0.01, 1.1]} />
          <meshBasicMaterial color="#e8e4d4" />
        </mesh>
      ))}
      {/* central plaza */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.015, 0]} receiveShadow>
        <circleGeometry args={[RING_ROAD.inner - 0.2, 64]} />
        <meshStandardMaterial color="#33404a" roughness={0.9} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <ringGeometry args={[RING_ROAD.inner - 0.6, RING_ROAD.inner - 0.35, 96]} />
        <meshBasicMaterial color={brand} transparent opacity={0.55} />
      </mesh>
      {spokes.map((p, i) => (
        <mesh key={i} position={[p.x, 0.022, p.z]} rotation-y={p.angle} receiveShadow>
          <boxGeometry args={[3.4, 0.02, p.len]} />
          <meshStandardMaterial color="#2c3039" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Ramps({ brand }: { brand: string }) {
  return (
    <group>
      {RAMPS.map((r, i) => {
        const slope = Math.atan2(r.height, r.length);
        const hyp = Math.hypot(r.height, r.length);
        return (
          <group key={i} position={[r.x, 0, r.z]} rotation-y={r.dir}>
            {/* sloped deck */}
            <mesh position={[0, r.height / 2, r.length / 2]} rotation-x={-slope} castShadow receiveShadow>
              <boxGeometry args={[r.width, 0.15, hyp]} />
              <meshStandardMaterial color="#e2a93b" roughness={0.6} />
            </mesh>
            {/* chevrons */}
            {[0.25, 0.5, 0.75].map((t) => (
              <mesh key={t} position={[0, r.height * t + 0.09, r.length * t]} rotation-x={-slope}>
                <boxGeometry args={[r.width * 0.7, 0.02, 0.22]} />
                <meshBasicMaterial color="#1b1b1f" />
              </mesh>
            ))}
            {/* back support */}
            <mesh position={[0, r.height / 2, r.length]} castShadow>
              <boxGeometry args={[r.width, r.height, 0.2]} />
              <meshStandardMaterial color="#3a3f4a" />
            </mesh>
            {/* landing guide on the ground */}
            <mesh rotation-x={-Math.PI / 2} position={[0, 0.04, r.length + 7]}>
              <ringGeometry args={[1.6, 1.85, 40]} />
              <meshBasicMaterial color={brand} transparent opacity={0.5} />
            </mesh>
          </group>
        );
      })}
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
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 3.2, 8]} />
        <meshStandardMaterial color="#20232b" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 3.3, 0]}>
        <sphereGeometry args={[0.25, 16, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <pointLight position={[0, 3.3, 0]} color={color} intensity={8} distance={12} decay={1.5} />
    </group>
  );
}

/** Glowing pad the car parks on to open a building. Pulses while the car is on it. */
function Pad({ at, radius, active, brand }: { at: [number, number]; radius: number; active: boolean; brand: string }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ring.current) return;
    const s = active ? 1 + Math.sin(clock.elapsedTime * 6) * 0.06 : 1;
    ring.current.scale.setScalar(s);
  });
  return (
    <group position={[at[0], 0.05, at[1]]}>
      <mesh rotation-x={-Math.PI / 2}>
        <circleGeometry args={[radius, 40]} />
        <meshBasicMaterial color={brand} transparent opacity={active ? 0.28 : 0.1} depthWrite={false} />
      </mesh>
      <mesh ref={ring} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[radius - 0.15, radius, 48]} />
        <meshBasicMaterial color={brand} />
      </mesh>
    </group>
  );
}

function Pads({ brand }: { brand: string }) {
  const near = useGame((s) => s.near);
  return (
    <>
      {STATIONS.map((s) => (
        <Pad key={s.id} at={s.at} radius={s.radius} active={near === s.id} brand={brand} />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Buildings                                                          */
/* ------------------------------------------------------------------ */
function House() {
  const [x, z] = PLACES.house;
  return (
    <group position={[x, 0, z]} scale={1.15}>
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[6, 3.6, 5]} />
        <meshStandardMaterial color="#e9e4da" roughness={0.9} />
      </mesh>
      <mesh position={[0, 4.6, 0]} rotation-y={Math.PI / 4} castShadow>
        <coneGeometry args={[4.6, 2.2, 4]} />
        <meshStandardMaterial color="#c2553f" flatShading />
      </mesh>
      <mesh position={[0, 1.1, 2.51]}>
        <boxGeometry args={[1.2, 2.2, 0.05]} />
        <meshStandardMaterial color="#3b2a22" />
      </mesh>
      {[-1.9, 1.9].map((wx) => (
        <mesh key={wx} position={[wx, 2, 2.51]}>
          <boxGeometry args={[1.1, 1, 0.05]} />
          <meshStandardMaterial color="#ffd68a" emissive="#ffb84d" emissiveIntensity={1.4} />
        </mesh>
      ))}
      <pointLight position={[0, 2.2, 4]} color="#ffc97a" intensity={6} distance={9} />
      <Sign position={[0, 6.8, 0]} title="About Me" sub="who I am" />
    </group>
  );
}

function Tower({ brand }: { brand: string }) {
  const [x, z] = PLACES.tower;
  const floors = [
    { y: 1.4, w: 4.6, h: 2.8, label: 'Gloify' },
    { y: 4.2, w: 4, h: 2.8, label: 'Ninjacart' },
    { y: 7, w: 3.4, h: 2.8, label: 'Neutrinos' },
  ];
  return (
    <group position={[x, 0, z]}>
      {floors.map((f, i) => (
        <group key={f.label} position={[0, f.y, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[f.w, f.h, f.w]} />
            <meshStandardMaterial color={i === 2 ? '#2b3140' : '#343b4c'} roughness={0.6} metalness={0.2} />
          </mesh>
          <mesh position={[-f.w / 2 - 0.01, 0.1, 0]} rotation-y={-Math.PI / 2}>
            <planeGeometry args={[f.w * 0.8, f.h * 0.45]} />
            <meshStandardMaterial color={brand} emissive={brand} emissiveIntensity={i === 2 ? 1.2 : 0.5} />
          </mesh>
          <Html position={[-f.w / 2 - 0.1, 0.1, 0]} center distanceFactor={16} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
            <span className="whitespace-nowrap font-display text-lg text-ink">{f.label}</span>
          </Html>
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
      <Sign position={[-1, 11.2, 0]} title="Experience" sub="3 companies · 4+ yrs" />
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
    <group position={[PLACES.arcadeX, 0, z]} rotation-y={Math.PI / 2} scale={1.35}>
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 2.4, 1.3]} />
        <meshStandardMaterial color="#1a1c24" roughness={0.5} />
      </mesh>
      {[-0.76, 0.76].map((sx) => (
        <mesh key={sx} position={[sx, 1.2, 0]}>
          <boxGeometry args={[0.02, 2.4, 1.3]} />
          <meshBasicMaterial color={accent} />
        </mesh>
      ))}
      <mesh position={[0, 2.55, 0.25]}>
        <boxGeometry args={[1.5, 0.35, 0.8]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.9} />
      </mesh>
      <mesh position={[0, 1.75, 0.66]} rotation-x={-0.18}>
        <planeGeometry args={[1.2, 1.0]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[0, 1.05, 0.75]} rotation-x={-0.6}>
        <boxGeometry args={[1.4, 0.08, 0.5]} />
        <meshStandardMaterial color="#2a2d38" />
      </mesh>
      <mesh position={[-0.3, 1.13, 0.78]}>
        <sphereGeometry args={[0.07, 12, 8]} />
        <meshBasicMaterial color="#ff4d6d" />
      </mesh>
      <pointLight position={[0, 1.8, 1.6]} color={accent} intensity={4} distance={5} />
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
      <Sign position={[PLACES.arcadeX - 1.5, 6.4, -3]} title="Project Arcade" sub="my shipped apps" />
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
    <group position={[x, 0, z]} scale={1.3}>
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
    <group position={[x, 0, z]} rotation-y={-Math.PI / 4} scale={1.6}>
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
      <Sign position={[0, 2.4, 0]} title="Contact" sub="say hello" />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Dynamic bits: cones, dust, coins                                   */
/* ------------------------------------------------------------------ */
function Cones() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    cones.forEach((c, i) => {
      // integrate: gravity, ground friction, tumble
      c.vy -= 22 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.z += c.vz * dt;
      if (c.y <= 0) {
        c.y = 0;
        c.vy = Math.abs(c.vy) > 3 ? -c.vy * 0.3 : 0;
        const f = Math.exp(-5 * dt);
        c.vx *= f;
        c.vz *= f;
        c.spin *= f;
        // settle upright slowly when slow, otherwise lie on its side
        const moving = Math.hypot(c.vx, c.vz) > 0.5;
        c.rx = THREE.MathUtils.damp(c.rx, moving ? c.rx : Math.round(c.rx / (Math.PI / 2)) * (Math.PI / 2), 6, dt);
      } else {
        c.rx += c.spin * dt;
        c.rz += c.spin * 0.6 * dt;
      }
      const g = refs.current[i];
      if (g) {
        g.position.set(c.x, c.y, c.z);
        g.rotation.set(c.rx, 0, c.rz);
      }
    });
  });
  return (
    <>
      {cones.map((c, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={[c.x, 0, c.z]}
        >
          <mesh position={[0, 0.05, 0]} castShadow>
            <boxGeometry args={[0.7, 0.1, 0.7]} />
            <meshStandardMaterial color="#ff6a1a" />
          </mesh>
          <mesh position={[0, 0.5, 0]} castShadow>
            <coneGeometry args={[0.28, 0.9, 16]} />
            <meshStandardMaterial color="#ff6a1a" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.17, 0.21, 0.16, 16]} />
            <meshStandardMaterial color="#f4f4f4" />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Dust() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((_, delta) => {
    puffs.forEach((p, i) => {
      const m = refs.current[i];
      if (!m) return;
      if (p.life <= 0) {
        m.visible = false;
        return;
      }
      p.life -= delta * 1.4;
      p.y += p.vy * delta;
      m.visible = true;
      m.position.set(p.x, p.y, p.z);
      m.scale.setScalar(p.size * (0.4 + (1 - p.life) * 1.1));
      (m.material as THREE.MeshBasicMaterial).opacity = Math.max(p.life, 0) * 0.35;
    });
  });
  return (
    <>
      {puffs.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          visible={false}
        >
          <icosahedronGeometry args={[0.45, 0]} />
          <meshBasicMaterial color="#c9c3b5" transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

function Coin({ index, brand }: { index: number; brand: string }) {
  const ref = useRef<THREE.Group>(null);
  const collected = useGame((s) => s.collected.includes(index));
  const c = COINS[index];
  const baseY = c.y ?? 1;
  useFrame(({ clock }, d) => {
    const g = ref.current;
    if (!g) return;
    const s = THREE.MathUtils.damp(g.scale.x, collected ? 0 : 1, 10, d);
    g.scale.setScalar(s);
    g.visible = s > 0.02;
    g.rotation.y += d * 2.4;
    g.position.y = baseY + Math.sin(clock.elapsedTime * 2 + index) * 0.15 + (collected ? (1 - s) * 3 : 0);
    const dist = Math.hypot(playerPos.x - c.at[0], playerPos.z - c.at[1]);
    if (!collected && dist < 3.5 && Math.abs(playerPos.y + 1 - baseY) < 2) {
      g.position.x = THREE.MathUtils.damp(g.position.x, c.at[0] + (playerPos.x - c.at[0]) * 0.5, 6, d);
      g.position.z = THREE.MathUtils.damp(g.position.z, c.at[1] + (playerPos.z - c.at[1]) * 0.5, 6, d);
    }
  });
  return (
    <group ref={ref} position={[c.at[0], baseY, c.at[1]]} scale={1}>
      <mesh rotation-x={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.12, 28]} />
        <meshStandardMaterial color="#ffd166" emissive="#ffb703" emissiveIntensity={0.7} metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.4, 0.04, 8, 28]} />
        <meshBasicMaterial color={brand} />
      </mesh>
      {/* light beam so coins are visible from afar */}
      <mesh position={[0, -baseY / 2 + 2, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 4 + baseY, 6]} />
        <meshBasicMaterial color="#ffd166" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      {!collected && (
        <Html position={[0, 1, 0]} center distanceFactor={16} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <span className="whitespace-nowrap rounded-full bg-black/55 px-2 py-0.5 font-mono text-[11px] text-[#ffd166]">
            {c.label}
            {c.y ? ' ↑ jump' : ''}
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
      <fog attach="fog" args={['#070a12', 40, 95]} />
      <Stars radius={120} depth={50} count={3000} factor={4} saturation={0} fade speed={0.6} />
      <hemisphereLight args={['#9fb4ff', '#24382c', 0.9]} />
      <directionalLight
        position={[18, 28, 14]}
        intensity={1.4}
        color="#cdd8ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-36}
        shadow-camera-right={36}
        shadow-camera-top={36}
        shadow-camera-bottom={-36}
        shadow-bias={-0.0005}
      />
      <Island brand={brand} />
      <Ramps brand={brand} />
      <Trees />
      <Pads brand={brand} />
      <House />
      <Tower brand={brand} />
      <Arcade />
      <Kiosk brand={brand} />
      <Mailbox brand={brand} />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        const r = RING_ROAD.outer + 1.2;
        return <Lamp key={i} position={[Math.sin(a) * r, 0, Math.cos(a) * r]} color={i % 2 ? brand2 : brand} />;
      })}
      <Cones />
      <Dust />
      {COINS.map((_, i) => (
        <Coin key={i} index={i} brand={brand} />
      ))}
    </>
  );
}
