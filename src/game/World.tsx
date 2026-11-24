import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox, useTexture } from '@react-three/drei';
import { CuboidCollider, CylinderCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { projects } from '@/data/portfolio';
import {
  COINS,
  COLLIDERS,
  CONES,
  CRATE_LABELS,
  CRATE_SIZE,
  CRATE_TOWER,
  DOMINOES,
  ISLAND_RADIUS,
  PINS,
  PLACES,
  RAMPS,
  RING_ROAD,
  STATIONS,
  TREES,
} from './layout';
import { nextObjective } from './objectives';
import { playerPos, puffs } from './runtime';
import { gameStore, useGame } from './store';

/* ---------- toy palette (taken from the site theme) ---------- */
const C = {
  bg: '#f1d8c0',
  board: '#f4e7d4',
  boardSide: '#c85a3a',
  boardBottom: '#a8472c',
  road: '#d4693f',
  roadLine: '#fbf1e2',
  plaza: '#ead6bc',
  sage: '#9db682',
  sageDark: '#7f9c68',
  olive: '#b3c08a',
  trunk: '#8a5a3c',
  cream: '#fbf3e6',
  terracotta: '#d9603d',
  ink: '#241c17',
  stone: '#d9c4ab',
};
const SUN: [number, number, number] = [30, 45, 25];
const BOARD_DEPTH = 3;

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* Labels                                                             */
/* ------------------------------------------------------------------ */
function Sign({ position, title, sub }: { position: [number, number, number]; title: string; sub?: string }) {
  return (
    <Html position={position} center distanceFactor={18} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div className="whitespace-nowrap rounded-2xl bg-[#fbf3e6] px-3.5 py-2 text-center shadow-[0_6px_0_rgba(168,71,44,0.35)]">
        <p className="font-display text-xl font-bold leading-none tracking-tight text-[#241c17]">{title}</p>
        {sub && <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c85a3a]">{sub}</p>}
      </div>
    </Html>
  );
}

/* ------------------------------------------------------------------ */
/* The board: a thick cream diorama with terracotta sides             */
/* ------------------------------------------------------------------ */
function Board() {
  const mats = useMemo(
    () => [
      new THREE.MeshStandardMaterial({ color: C.boardSide, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: C.board, roughness: 0.95 }),
      new THREE.MeshStandardMaterial({ color: C.boardBottom, roughness: 1 }),
    ],
    []
  );
  // soft grass patches scattered on the board
  const patches = useMemo(() => {
    const r = rng(5);
    return Array.from({ length: 26 }, () => {
      const a = r() * Math.PI * 2;
      const d = RING_ROAD.outer + 2 + r() * (ISLAND_RADIUS - RING_ROAD.outer - 4);
      return { x: Math.cos(a) * d, z: Math.sin(a) * d, s: 2 + r() * 3.5 };
    });
  }, []);
  const dashes = useMemo(() => {
    const r = (RING_ROAD.inner + RING_ROAD.outer) / 2;
    return Array.from({ length: 36 }, (_, i) => {
      const a = (i / 36) * Math.PI * 2;
      return { x: Math.sin(a) * r, z: Math.cos(a) * r, a };
    });
  }, []);
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
  return (
    <group>
      <mesh position={[0, -BOARD_DEPTH / 2, 0]} material={mats} receiveShadow castShadow>
        <cylinderGeometry args={[ISLAND_RADIUS, ISLAND_RADIUS - 0.4, BOARD_DEPTH, 96]} />
      </mesh>
      {/* cream lip around the edge */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
        <ringGeometry args={[ISLAND_RADIUS - 0.7, ISLAND_RADIUS, 96]} />
        <meshStandardMaterial color={C.stone} roughness={0.9} />
      </mesh>
      {patches.map((p, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[p.x, 0.012, p.z]} receiveShadow>
          <circleGeometry args={[p.s, 28]} />
          <meshStandardMaterial color={i % 3 === 0 ? C.olive : C.sage} roughness={1} />
        </mesh>
      ))}
      {/* ring road */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} receiveShadow>
        <ringGeometry args={[RING_ROAD.inner, RING_ROAD.outer, 128]} />
        <meshStandardMaterial color={C.road} roughness={0.85} />
      </mesh>
      {dashes.map((d, i) => (
        <mesh key={i} position={[d.x, 0.03, d.z]} rotation-y={d.a + Math.PI / 2}>
          <boxGeometry args={[0.18, 0.01, 1.3]} />
          <meshStandardMaterial color={C.roadLine} />
        </mesh>
      ))}
      {spokes.map((p, i) => (
        <mesh key={i} position={[p.x, 0.021, p.z]} rotation-y={p.angle} receiveShadow>
          <boxGeometry args={[3.6, 0.02, p.len]} />
          <meshStandardMaterial color={C.road} roughness={0.85} />
        </mesh>
      ))}
      {/* plaza */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.015, 0]} receiveShadow>
        <circleGeometry args={[RING_ROAD.inner - 0.1, 72]} />
        <meshStandardMaterial color={C.plaza} roughness={0.95} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.025, 0]}>
        <ringGeometry args={[RING_ROAD.inner - 0.8, RING_ROAD.inner - 0.5, 96]} />
        <meshStandardMaterial color={C.terracotta} />
      </mesh>
    </group>
  );
}

function Ramps() {
  return (
    <group>
      {RAMPS.map((r, i) => {
        const slope = Math.atan2(r.height, r.length);
        const hyp = Math.hypot(r.height, r.length);
        return (
          <group key={i} position={[r.x, 0, r.z]} rotation-y={r.dir}>
            <mesh position={[0, r.height / 2, r.length / 2]} rotation-x={-slope} castShadow receiveShadow>
              <boxGeometry args={[r.width, 0.18, hyp]} />
              <meshStandardMaterial color={C.cream} roughness={0.7} />
            </mesh>
            {[0.2, 0.45, 0.7].map((t) => (
              <mesh key={t} position={[0, r.height * t + 0.1, r.length * t]} rotation-x={-slope}>
                <boxGeometry args={[r.width * 0.75, 0.02, 0.32]} />
                <meshStandardMaterial color={C.terracotta} />
              </mesh>
            ))}
            <mesh position={[0, r.height / 2, r.length]} castShadow>
              <boxGeometry args={[r.width, r.height, 0.22]} />
              <meshStandardMaterial color={C.boardSide} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Vegetation: lollipop trees, cypresses and bushes                   */
/* ------------------------------------------------------------------ */
function Tree({ kind, seed }: { kind: number; seed: number }) {
  const r = rng(seed);
  if (kind === 0) {
    const h = 1.4 + r() * 0.8;
    return (
      <group>
        <mesh position={[0, h / 2, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.17, h, 8]} />
          <meshStandardMaterial color={C.trunk} roughness={1} />
        </mesh>
        <mesh position={[0, h + 0.9, 0]} castShadow>
          <sphereGeometry args={[1.15 + r() * 0.3, 20, 16]} />
          <meshStandardMaterial color={r() > 0.5 ? C.sage : C.sageDark} roughness={0.9} />
        </mesh>
      </group>
    );
  }
  if (seed % 3 === 0) {
    return (
      <group>
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.14, 0.5, 8]} />
          <meshStandardMaterial color={C.trunk} />
        </mesh>
        <mesh position={[0, 1.9, 0]} castShadow scale={[1, 2.4, 1]}>
          <sphereGeometry args={[0.75, 18, 14]} />
          <meshStandardMaterial color={C.sageDark} roughness={0.9} />
        </mesh>
      </group>
    );
  }
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[(r() - 0.5) * 1.2, 0.5 + r() * 0.2, (r() - 0.5) * 1.2]} scale={0.6 + r() * 0.4} castShadow>
          <sphereGeometry args={[0.85, 16, 12]} />
          <meshStandardMaterial color={[C.sage, C.olive, C.sageDark][i]} roughness={0.95} />
        </mesh>
      ))}
      {[0, 1, 2].map((i) => (
        <mesh key={`f${i}`} position={[(r() - 0.5) * 1.6, 1.05 + r() * 0.25, (r() - 0.5) * 1.6]}>
          <sphereGeometry args={[0.1, 8, 6]} />
          <meshStandardMaterial color={[C.terracotta, C.cream, '#f0b44c'][i]} />
        </mesh>
      ))}
    </group>
  );
}

function Vegetation() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const fade = useRef<number[]>(TREES.map(() => 1));
  // fade out plants standing between the camera and the car
  useFrame(({ camera }, d) => {
    const cx = camera.position.x;
    const cz = camera.position.z;
    const sx = playerPos.x - cx;
    const sz = playerPos.z - cz;
    const len2 = sx * sx + sz * sz || 1;
    TREES.forEach((t, i) => {
      const g = refs.current[i];
      if (!g) return;
      const u = THREE.MathUtils.clamp(((t.x - cx) * sx + (t.z - cz) * sz) / len2, 0, 1.08);
      const px = cx + sx * u - t.x;
      const pz = cz + sz * u - t.z;
      const blocking = u > 0.02 && camera.position.y < 40 && px * px + pz * pz < 3 * 3 * t.s;
      const prev = fade.current[i];
      const next = THREE.MathUtils.damp(prev, blocking ? 0.2 : 1, 8, d);
      fade.current[i] = next;
      if (Math.abs(next - prev) < 0.002 && next > 0.995) return;
      g.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.Material | undefined;
        if (!m) return;
        m.transparent = next < 0.99;
        m.opacity = next;
        m.depthWrite = next > 0.99;
      });
    });
  });
  return (
    <group>
      {TREES.map((t, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={[t.x, 0, t.z]}
          scale={t.s}
        >
          <Tree kind={t.kind} seed={i + 1} />
        </group>
      ))}
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2 + 0.2;
        const d = ISLAND_RADIUS - 1.6 - (i % 3) * 0.6;
        return (
          <mesh key={i} position={[Math.cos(a) * d, 0.15, Math.sin(a) * d]} rotation={[i, i * 2, 0]} scale={0.45 + (i % 4) * 0.15} castShadow>
            <dodecahedronGeometry args={[0.8, 0]} />
            <meshStandardMaterial color={C.stone} flatShading roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

function Lamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 3, 10]} />
        <meshStandardMaterial color={C.ink} roughness={0.6} />
      </mesh>
      <mesh position={[0, 3.15, 0]}>
        <sphereGeometry args={[0.3, 16, 12]} />
        <meshStandardMaterial color="#fff6e5" emissive="#ffdca8" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

/** Glowing pad the car parks on to open a building. Pulses while the car is on it. */
function Pad({ at, radius, active }: { at: [number, number]; radius: number; active: boolean }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ring.current) ring.current.scale.setScalar(active ? 1 + Math.sin(clock.elapsedTime * 6) * 0.06 : 1);
  });
  return (
    <group position={[at[0], 0.04, at[1]]}>
      <mesh rotation-x={-Math.PI / 2}>
        <circleGeometry args={[radius, 40]} />
        <meshStandardMaterial color={active ? '#f6c9a8' : C.cream} roughness={0.8} />
      </mesh>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, 0.005, 0]}>
        <ringGeometry args={[radius - 0.25, radius, 48]} />
        <meshStandardMaterial color={C.terracotta} />
      </mesh>
    </group>
  );
}

function Pads() {
  const near = useGame((s) => s.near);
  return (
    <>
      {STATIONS.map((s) => (
        <Pad key={s.id} at={s.at} radius={s.radius} active={near === s.id} />
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
      <RoundedBox args={[6, 3.6, 5]} radius={0.3} smoothness={4} position={[0, 1.8, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={C.cream} roughness={0.9} />
      </RoundedBox>
      <mesh position={[0, 4.7, 0]} rotation-y={Math.PI / 4} castShadow>
        <coneGeometry args={[4.7, 2.4, 4]} />
        <meshStandardMaterial color={C.terracotta} roughness={0.8} flatShading />
      </mesh>
      <RoundedBox args={[0.7, 1.7, 0.7]} radius={0.1} position={[1.7, 5.1, -0.6]} castShadow>
        <meshStandardMaterial color={C.boardSide} />
      </RoundedBox>
      <RoundedBox args={[1.25, 2.2, 0.16]} radius={0.1} position={[0, 1.1, 2.5]}>
        <meshStandardMaterial color={C.ink} roughness={0.5} />
      </RoundedBox>
      {[-1.9, 1.9].map((wx) => (
        <group key={wx} position={[wx, 2.05, 2.52]}>
          <RoundedBox args={[1.25, 1.1, 0.1]} radius={0.08}>
            <meshStandardMaterial color={C.terracotta} />
          </RoundedBox>
          <mesh position={[0, 0, 0.06]}>
            <boxGeometry args={[1.0, 0.85, 0.02]} />
            <meshStandardMaterial color="#fff2dc" emissive="#ffd9a0" emissiveIntensity={0.35} />
          </mesh>
        </group>
      ))}
      <Sign position={[0, 7.4, 0]} title="About Me" sub="who I am" />
    </group>
  );
}

function Tower() {
  const [x, z] = PLACES.tower;
  const floors = [
    { y: 1.5, w: 4.8, label: 'Gloify', color: C.cream },
    { y: 4.6, w: 4.2, label: 'Ninjacart', color: C.terracotta },
    { y: 7.7, w: 3.6, label: 'Neutrinos', color: C.ink },
  ];
  return (
    <group position={[x, 0, z]}>
      {floors.map((f) => (
        <group key={f.label} position={[0, f.y, 0]}>
          <RoundedBox args={[f.w, 2.8, f.w]} radius={0.3} smoothness={4} castShadow receiveShadow>
            <meshStandardMaterial color={f.color} roughness={0.85} />
          </RoundedBox>
          {[-1, 0, 1].map((k) => (
            <mesh key={k} position={[-f.w / 2 - 0.01, 0.2, k * (f.w / 3.4)]} rotation-y={-Math.PI / 2}>
              <planeGeometry args={[f.w / 5, 1.1]} />
              <meshStandardMaterial color="#fff2dc" emissive="#ffd9a0" emissiveIntensity={0.3} />
            </mesh>
          ))}
          <Html position={[-f.w / 2 - 0.1, -0.9, 0]} center distanceFactor={16} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
            <span className="whitespace-nowrap rounded-md bg-[#241c17] px-2 py-0.5 font-display text-sm font-semibold text-[#fbf3e6]">
              {f.label}
            </span>
          </Html>
        </group>
      ))}
      <mesh position={[0, 10.2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.6, 6]} />
        <meshStandardMaterial color={C.ink} />
      </mesh>
      <mesh position={[0, 11.05, 0]}>
        <sphereGeometry args={[0.2, 12, 8]} />
        <meshStandardMaterial color={C.terracotta} emissive={C.terracotta} emissiveIntensity={0.6} />
      </mesh>
      <Sign position={[-1, 12.6, 0]} title="Experience" sub="3 companies · 4+ yrs" />
    </group>
  );
}

function Billboard({ z, index }: { z: number; index: number }) {
  const p = projects[index];
  const tex = useTexture(p.image, (t) => {
    const loaded = Array.isArray(t) ? t[0] : t;
    loaded.colorSpace = THREE.SRGBColorSpace;
  });
  const W = 4.6;
  const H = W * (630 / 1200);
  return (
    <group position={[PLACES.boardsX, 0, z]} rotation-y={Math.PI / 2}>
      {[-1.9, 1.9].map((px) => (
        <mesh key={px} position={[px, 1.6, -0.1]} castShadow>
          <cylinderGeometry args={[0.13, 0.15, 3.2, 12]} />
          <meshStandardMaterial color={C.boardSide} />
        </mesh>
      ))}
      <RoundedBox args={[W + 0.5, H + 0.5, 0.26]} radius={0.16} position={[0, 2.95, -0.12]} castShadow>
        <meshStandardMaterial color={C.cream} roughness={0.8} />
      </RoundedBox>
      <mesh position={[0, 2.95, 0.02]}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <Sign position={[0, 5.1, 0]} title={p.title.split(' – ')[0]} sub={p.company} />
    </group>
  );
}

function Billboards() {
  return (
    <group>
      {PLACES.boardsZ.map((z, i) => (
        <Billboard key={i} z={z} index={i} />
      ))}
      <Sign position={[PLACES.boardsX - 1, 6.8, -3]} title="My Apps" sub="drive up to open" />
    </group>
  );
}

function Kiosk() {
  const [x, z] = PLACES.kiosk;
  const spin = useRef<THREE.Group>(null);
  useFrame((_, d) => {
    if (spin.current) spin.current.rotation.y += d * 0.6;
  });
  return (
    <group position={[x, 0, z]} scale={1.3}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.1, 1.25, 1, 32]} />
        <meshStandardMaterial color={C.cream} />
      </mesh>
      <mesh position={[0, 1.02, 0]}>
        <torusGeometry args={[1.1, 0.06, 8, 40]} />
        <meshStandardMaterial color={C.terracotta} />
      </mesh>
      <group ref={spin} position={[0, 1.4, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <RoundedBox key={i} args={[0.95, 0.2, 0.68]} radius={0.05} position={[0, i * 0.23, 0]} rotation-y={i * 0.4}>
            <meshStandardMaterial color={[C.terracotta, C.sage, C.ink, '#f0b44c'][i]} />
          </RoundedBox>
        ))}
      </group>
      <Sign position={[0, 3.3, 0]} title="Archive" sub="earlier projects" />
    </group>
  );
}

function Mailbox() {
  const [x, z] = PLACES.mailbox;
  const flag = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (flag.current) flag.current.rotation.z = -0.3 + Math.sin(clock.elapsedTime * 2) * 0.25;
  });
  return (
    <group position={[x, 0, z]} rotation-y={-Math.PI / 4} scale={1.7}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 1.2, 10]} />
        <meshStandardMaterial color={C.ink} />
      </mesh>
      <RoundedBox args={[0.62, 0.58, 1.02]} radius={0.16} position={[0, 1.38, 0]} castShadow>
        <meshStandardMaterial color={C.terracotta} roughness={0.6} />
      </RoundedBox>
      <mesh ref={flag} position={[0.34, 1.5, -0.2]}>
        <boxGeometry args={[0.05, 0.45, 0.2]} />
        <meshStandardMaterial color={C.cream} />
      </mesh>
      <Sign position={[0, 2.5, 0]} title="Contact" sub="say hello" />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Physics: static world + knockable playground                       */
/* ------------------------------------------------------------------ */
function StaticColliders() {
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        {/* the board itself; drive off the edge and you fall (and respawn) */}
        <CylinderCollider args={[BOARD_DEPTH / 2, ISLAND_RADIUS]} position={[0, -BOARD_DEPTH / 2, 0]} friction={1} />
        {COLLIDERS.map((c, i) => (
          <CylinderCollider key={i} args={[3, c.r]} position={[c.x, 3, c.z]} />
        ))}
      </RigidBody>
      {RAMPS.map((r, i) => {
        const slope = Math.atan2(r.height, r.length);
        const hyp = Math.hypot(r.height, r.length);
        return (
          <RigidBody key={i} type="fixed" colliders={false} position={[r.x, 0, r.z]} rotation={[0, r.dir, 0]}>
            <CuboidCollider args={[r.width / 2, 0.09, hyp / 2]} position={[0, r.height / 2, r.length / 2]} rotation={[-slope, 0, 0]} />
            <CuboidCollider args={[r.width / 2, r.height / 2, 0.11]} position={[0, r.height / 2, r.length]} />
          </RigidBody>
        );
      })}
    </>
  );
}

function crateTexture(label: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = C.cream;
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = C.terracotta;
  g.fillRect(0, 0, 256, 22);
  g.fillRect(0, 234, 256, 22);
  g.fillStyle = C.ink;
  g.font = `bold ${label.length > 8 ? 38 : 48}px Inter, Arial, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(label, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function SkillCrates() {
  const mats = useMemo(() => CRATE_LABELS.map((l) => new THREE.MeshStandardMaterial({ map: crateTexture(l), roughness: 0.7 })), []);
  const bodies = useRef<(RapierRigidBody | null)[]>([]);
  const crates = useMemo(() => {
    const out: { x: number; y: number; label: number }[] = [];
    let n = 0;
    CRATE_TOWER.rows.forEach((count, row) => {
      for (let i = 0; i < count; i++) {
        out.push({ x: CRATE_TOWER.x + (i - (count - 1) / 2) * (CRATE_SIZE + 0.02), y: CRATE_SIZE / 2 + row * CRATE_SIZE, label: n++ });
      }
    });
    return out;
  }, []);
  // objective: tower counts as knocked down once half the crates have moved
  useFrame(() => {
    if (gameStore.get().cratesDown) return;
    let moved = 0;
    bodies.current.forEach((b, i) => {
      if (!b) return;
      const t = b.translation();
      if (Math.hypot(t.x - crates[i].x, t.y - crates[i].y, t.z - CRATE_TOWER.z) > 1.2) moved++;
    });
    if (moved >= crates.length / 2) gameStore.markCratesDown();
  });
  return (
    <>
      {crates.map((c, i) => (
        <RigidBody
          key={i}
          ref={(el) => {
            bodies.current[i] = el;
          }}
          position={[c.x, c.y + 0.01, CRATE_TOWER.z]}
          colliders="cuboid"
          mass={0.5}
          restitution={0.15}
          friction={0.8}
        >
          <mesh castShadow receiveShadow material={mats[c.label % mats.length]}>
            <boxGeometry args={[CRATE_SIZE, CRATE_SIZE, CRATE_SIZE]} />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}

function Pin({ x, z }: { x: number; z: number }) {
  const geo = useMemo(() => {
    const pts = [
      [0, 0],
      [0.16, 0],
      [0.2, 0.18],
      [0.21, 0.36],
      [0.15, 0.56],
      [0.09, 0.66],
      [0.1, 0.76],
      [0.12, 0.84],
      [0.09, 0.94],
      [0, 0.97],
    ].map(([a, b]) => new THREE.Vector2(a, b));
    return new THREE.LatheGeometry(pts, 20);
  }, []);
  return (
    <RigidBody position={[x, 0.01, z]} colliders={false} mass={0.2} restitution={0.3} friction={0.6} angularDamping={0.4}>
      <CylinderCollider args={[0.46, 0.19]} position={[0, 0.48, 0]} />
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial color={C.cream} roughness={0.4} />
      </mesh>
      {[0.7, 0.76].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.103, 0.103, 0.025, 20]} />
          <meshStandardMaterial color={C.terracotta} />
        </mesh>
      ))}
    </RigidBody>
  );
}

function Dominoes() {
  return (
    <>
      {DOMINOES.map((d, i) => (
        <RigidBody key={i} position={[d.x, 0.61, d.z]} rotation={[0, d.rot, 0]} colliders="cuboid" mass={0.12} friction={0.5}>
          <RoundedBox args={[0.9, 1.2, 0.22]} radius={0.05} castShadow>
            <meshStandardMaterial color={i % 2 ? C.terracotta : C.cream} roughness={0.6} />
          </RoundedBox>
        </RigidBody>
      ))}
    </>
  );
}

function Cones() {
  return (
    <>
      {CONES.map(([x, z], i) => (
        <RigidBody key={i} position={[x, 0.01, z]} colliders={false} mass={0.1} restitution={0.25} angularDamping={0.5}>
          <CylinderCollider args={[0.45, 0.24]} position={[0, 0.45, 0]} />
          <mesh position={[0, 0.05, 0]} castShadow>
            <boxGeometry args={[0.7, 0.1, 0.7]} />
            <meshStandardMaterial color={C.terracotta} />
          </mesh>
          <mesh position={[0, 0.5, 0]} castShadow>
            <coneGeometry args={[0.28, 0.9, 16]} />
            <meshStandardMaterial color={C.terracotta} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.17, 0.21, 0.16, 16]} />
            <meshStandardMaterial color={C.cream} />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}

function Playground() {
  const resetKey = useGame((s) => s.resetKey);
  return (
    <group key={resetKey}>
      <SkillCrates />
      {PINS.map(([x, z], i) => (
        <Pin key={i} x={x} z={z} />
      ))}
      <Dominoes />
      <Cones />
    </group>
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
      (m.material as THREE.MeshBasicMaterial).opacity = Math.max(p.life, 0) * 0.5;
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
          <sphereGeometry args={[0.45, 10, 8]} />
          <meshBasicMaterial color="#f3dfc6" transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

function Coin({ index }: { index: number }) {
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
  });
  return (
    <group ref={ref} position={[c.at[0], baseY, c.at[1]]}>
      <mesh rotation-x={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.14, 32]} />
        <meshStandardMaterial color="#f2b543" emissive="#e08a1e" emissiveIntensity={0.25} metalness={0.4} roughness={0.35} />
      </mesh>
      <mesh rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.4, 0.05, 8, 32]} />
        <meshStandardMaterial color={C.cream} />
      </mesh>
      {!collected && (
        <Html position={[0, 1, 0]} center distanceFactor={16} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <span className="whitespace-nowrap rounded-full bg-[#241c17]/80 px-2 py-0.5 font-mono text-[11px] text-[#f6c86a]">
            {c.label}
            {c.y ? ' ↑ jump' : ''}
          </span>
        </Html>
      )}
    </group>
  );
}

/** Floating arrow above the car pointing at the next tour goal. */
function GuideArrow() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }, d) => {
    const arrow = g.current;
    if (!arrow) return;
    const s = gameStore.get();
    const obj = nextObjective(s);
    const target = obj?.target(s, playerPos.x, playerPos.z);
    const far = target ? Math.hypot(target[0] - playerPos.x, target[1] - playerPos.z) > 4 : false;
    const visible = !!target && far && !s.open;
    arrow.scale.setScalar(THREE.MathUtils.damp(arrow.scale.x, visible ? 1 : 0, 8, d));
    arrow.position.set(playerPos.x, playerPos.y + 3.3 + Math.sin(clock.elapsedTime * 3) * 0.15, playerPos.z);
    if (target) {
      const yaw = Math.atan2(target[0] - playerPos.x, target[1] - playerPos.z);
      arrow.rotation.y = arrow.rotation.y + Math.atan2(Math.sin(yaw - arrow.rotation.y), Math.cos(yaw - arrow.rotation.y)) * (1 - Math.exp(-8 * d));
    }
  });
  return (
    <group ref={g} scale={0}>
      <mesh rotation-x={Math.PI / 2} position={[0, 0, 0.35]}>
        <coneGeometry args={[0.42, 0.9, 3]} />
        <meshStandardMaterial color={C.terracotta} emissive={C.terracotta} emissiveIntensity={0.35} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, 0, -0.3]}>
        <boxGeometry args={[0.24, 0.6, 0.12]} />
        <meshStandardMaterial color={C.terracotta} emissive={C.terracotta} emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
export function World() {
  return (
    <>
      <color attach="background" args={[C.bg]} />
      <fog attach="fog" args={[C.bg, 70, 170]} />
      <hemisphereLight args={['#fff3e3', '#c9734f', 0.9]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={SUN}
        intensity={2.1}
        color="#fff1dc"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-38}
        shadow-camera-right={38}
        shadow-camera-top={38}
        shadow-camera-bottom={-38}
        shadow-camera-far={150}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-radius={6}
      />
      <Board />
      <Ramps />
      <Vegetation />
      <Pads />
      <House />
      <Tower />
      <Billboards />
      <Kiosk />
      <Mailbox />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        const r = RING_ROAD.outer + 1.3;
        return <Lamp key={i} position={[Math.sin(a) * r, 0, Math.cos(a) * r]} />;
      })}
      <StaticColliders />
      <Playground />
      <Dust />
      <GuideArrow />
      {COINS.map((_, i) => (
        <Coin key={i} index={i} />
      ))}
    </>
  );
}
