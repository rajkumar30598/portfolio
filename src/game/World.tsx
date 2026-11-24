import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Html, Lightformer, RoundedBox, Sky, useTexture } from '@react-three/drei';
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useTheme } from '@/lib/theme';
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
import { playerPos, puffs } from './runtime';
import { useGame } from './store';

const css = (c: [number, number, number]) => `rgb(${c.join(',')})`;
const SUN: [number, number, number] = [60, 70, 40];
const BEACH_RADIUS = ISLAND_RADIUS + 3;
const WATER_Y = -0.45;
const FOG = '#cfe3f5';

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Speckled grass texture drawn on a canvas (no image download). */
function useGrassTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d')!;
    g.fillStyle = '#5da84f';
    g.fillRect(0, 0, 256, 256);
    const r = rng(9);
    const shades = ['#69b85a', '#4f9a45', '#76c264', '#58a04c', '#82c96b'];
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = shades[Math.floor(r() * shades.length)];
      const s = 1 + r() * 3;
      g.fillRect(r() * 256, r() * 256, s, s * (1 + r() * 2));
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(14, 14);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, []);
}

/* ------------------------------------------------------------------ */
/* Labels                                                             */
/* ------------------------------------------------------------------ */
function Sign({ position, title, sub }: { position: [number, number, number]; title: string; sub?: string }) {
  return (
    <Html position={position} center distanceFactor={18} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div className="whitespace-nowrap rounded-xl border border-white/40 bg-white/80 px-3 py-1.5 text-center shadow-lg backdrop-blur-md">
        <p className="font-display text-xl leading-none tracking-wide text-[#0b1630]">{title}</p>
        {sub && <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2502f]">{sub}</p>}
      </div>
    </Html>
  );
}

/* ------------------------------------------------------------------ */
/* Ocean                                                              */
/* ------------------------------------------------------------------ */
function Ocean() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSun: { value: new THREE.Vector3(...SUN).normalize() },
      uShore: { value: BEACH_RADIUS - 0.6 },
      uFog: { value: new THREE.Color(FOG) },
    }),
    []
  );
  useFrame(({ clock }) => {
    if (mat.current) mat.current.uniforms.uTime.value = clock.elapsedTime;
  });
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, WATER_Y, 0]}>
      <planeGeometry args={[700, 700, 220, 220]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        transparent
        vertexShader={/* glsl */ `
          uniform float uTime;
          varying vec3 vWorld;
          float wave(vec2 p){
            return sin(p.x * 0.14 + uTime * 0.9) * 0.22
                 + sin(p.y * 0.19 + uTime * 1.2) * 0.16
                 + sin((p.x + p.y) * 0.07 + uTime * 0.6) * 0.28;
          }
          void main(){
            vec3 p = position;
            vec4 w = modelMatrix * vec4(p, 1.0);
            // calmer near the shore
            float calm = smoothstep(34.0, 60.0, length(w.xz));
            p.z += wave(w.xz) * (0.25 + 0.75 * calm);
            w = modelMatrix * vec4(p, 1.0);
            vWorld = w.xyz;
            gl_Position = projectionMatrix * viewMatrix * w;
          }`}
        fragmentShader={/* glsl */ `
          uniform float uTime; uniform vec3 uSun; uniform float uShore; uniform vec3 uFog;
          varying vec3 vWorld;
          void main(){
            vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
            if (n.y < 0.0) n = -n;
            vec3 v = normalize(cameraPosition - vWorld);
            float d = length(vWorld.xz);
            // turquoise shallows fading to deep blue
            vec3 shallow = vec3(0.16, 0.82, 0.86);
            vec3 deep = vec3(0.03, 0.27, 0.62);
            vec3 col = mix(shallow, deep, smoothstep(uShore, uShore + 26.0, d));
            // sky reflection (fresnel) and sun glints
            float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
            col = mix(col, vec3(0.72, 0.86, 1.0), fres * 0.6);
            float spec = pow(max(dot(reflect(-uSun, n), v), 0.0), 120.0);
            col += vec3(1.0, 0.96, 0.85) * spec * 1.6;
            // animated foam line around the beach
            float a = atan(vWorld.z, vWorld.x);
            float edge = uShore + 0.5 + sin(a * 23.0 + uTime * 1.4) * 0.35 + sin(a * 57.0 - uTime) * 0.2;
            float foam = smoothstep(edge + 1.4, edge, d) * (0.65 + 0.35 * sin(uTime * 2.0 + a * 9.0));
            col = mix(col, vec3(0.97, 0.99, 1.0), foam);
            // distance fog to match the scene
            float fog = smoothstep(70.0, 260.0, length(cameraPosition - vWorld));
            col = mix(col, uFog, fog);
            gl_FragColor = vec4(col, 0.97);
          }`}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Island, beach and roads                                            */
/* ------------------------------------------------------------------ */
function Island({ brand }: { brand: string }) {
  const grass = useGrassTexture();
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
  const dashes = useMemo(() => {
    const r = (RING_ROAD.inner + RING_ROAD.outer) / 2;
    return Array.from({ length: 40 }, (_, i) => {
      const a = (i / 40) * Math.PI * 2;
      return { x: Math.sin(a) * r, z: Math.cos(a) * r, a };
    });
  }, []);
  return (
    <group>
      {/* sandy beach sloping into the sea */}
      <mesh position={[0, -1.33, 0]} receiveShadow>
        <cylinderGeometry args={[BEACH_RADIUS, BEACH_RADIUS + 4, 2.5, 96]} />
        <meshStandardMaterial color="#ead7a8" roughness={1} />
      </mesh>
      {/* grass plateau */}
      <mesh position={[0, -0.25, 0]} receiveShadow>
        <cylinderGeometry args={[ISLAND_RADIUS, ISLAND_RADIUS + 0.4, 0.5, 96]} />
        <meshStandardMaterial map={grass} roughness={0.95} />
      </mesh>
      {/* ring road with white edge lines and centre dashes */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} receiveShadow>
        <ringGeometry args={[RING_ROAD.inner, RING_ROAD.outer, 128]} />
        <meshStandardMaterial color="#3b4049" roughness={0.85} />
      </mesh>
      {[RING_ROAD.inner + 0.3, RING_ROAD.outer - 0.3].map((r) => (
        <mesh key={r} rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
          <ringGeometry args={[r - 0.07, r + 0.07, 128]} />
          <meshBasicMaterial color="#f1efe8" />
        </mesh>
      ))}
      {dashes.map((d, i) => (
        <mesh key={i} position={[d.x, 0.035, d.z]} rotation-y={d.a + Math.PI / 2}>
          <boxGeometry args={[0.14, 0.01, 1.2]} />
          <meshBasicMaterial color="#ffd34d" />
        </mesh>
      ))}
      {/* plaza */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.015, 0]} receiveShadow>
        <circleGeometry args={[RING_ROAD.inner - 0.1, 72]} />
        <meshStandardMaterial color="#d9d3c7" roughness={0.9} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <ringGeometry args={[RING_ROAD.inner - 0.7, RING_ROAD.inner - 0.4, 96]} />
        <meshBasicMaterial color={brand} />
      </mesh>
      {spokes.map((p, i) => (
        <mesh key={i} position={[p.x, 0.022, p.z]} rotation-y={p.angle} receiveShadow>
          <boxGeometry args={[3.6, 0.02, p.len]} />
          <meshStandardMaterial color="#3b4049" roughness={0.85} />
        </mesh>
      ))}
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
              <boxGeometry args={[r.width, 0.16, hyp]} />
              <meshPhysicalMaterial color="#ffb928" roughness={0.35} clearcoat={0.8} />
            </mesh>
            {[0.2, 0.45, 0.7].map((t) => (
              <mesh key={t} position={[0, r.height * t + 0.09, r.length * t]} rotation-x={-slope}>
                <boxGeometry args={[r.width * 0.75, 0.02, 0.3]} />
                <meshBasicMaterial color="#1b1b1f" />
              </mesh>
            ))}
            <mesh position={[0, r.height / 2, r.length]} castShadow>
              <boxGeometry args={[r.width, r.height, 0.2]} />
              <meshStandardMaterial color="#4b515c" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Vegetation                                                         */
/* ------------------------------------------------------------------ */
function Palm({ seed }: { seed: number }) {
  const r = rng(seed);
  const lean = 0.25 + r() * 0.25;
  const segs = 6;
  const fronds = 8;
  const top: [number, number, number] = [Math.sin(lean) * 2.2, 4.1, 0];
  return (
    <group rotation-y={r() * Math.PI * 2}>
      {Array.from({ length: segs }, (_, i) => {
        const t = i / segs;
        return (
          <mesh key={i} position={[Math.sin(lean * t) * 2.2 * t, 0.35 + t * 3.9, 0]} rotation-z={-lean * t} castShadow>
            <cylinderGeometry args={[0.17 - t * 0.05, 0.2 - t * 0.05, 0.72, 8]} />
            <meshStandardMaterial color={i % 2 ? '#8a6a46' : '#9c7a52'} roughness={1} />
          </mesh>
        );
      })}
      <group position={top}>
        {Array.from({ length: fronds }, (_, i) => (
          <group key={i} rotation-y={(i / fronds) * Math.PI * 2}>
            <mesh position={[0, -0.25, 1.15]} rotation-x={0.55} castShadow>
              <boxGeometry args={[0.55, 0.04, 2.5]} />
              <meshStandardMaterial color={i % 2 ? '#3f9e4c' : '#4bb359'} roughness={0.8} />
            </mesh>
          </group>
        ))}
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[Math.cos(i * 2.1) * 0.25, -0.3, Math.sin(i * 2.1) * 0.25]} castShadow>
            <sphereGeometry args={[0.16, 10, 8]} />
            <meshStandardMaterial color="#6b4a2a" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Bush({ seed }: { seed: number }) {
  const r = rng(seed);
  const greens = ['#4fae55', '#5cbf62', '#45a04d'];
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[(r() - 0.5) * 1.1, 0.45 + r() * 0.2, (r() - 0.5) * 1.1]} scale={0.6 + r() * 0.35} castShadow>
          <icosahedronGeometry args={[0.9, 1]} />
          <meshStandardMaterial color={greens[i]} flatShading roughness={0.9} />
        </mesh>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={`f${i}`} position={[(r() - 0.5) * 1.6, 0.95 + r() * 0.3, (r() - 0.5) * 1.6]}>
          <sphereGeometry args={[0.09, 8, 6]} />
          <meshStandardMaterial color={['#ff6fa3', '#ffd34d', '#ffffff', '#ff8a4c'][i]} />
        </mesh>
      ))}
    </group>
  );
}

function Vegetation() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const fade = useRef<number[]>(TREES.map(() => 1));
  // fade out plants standing on the line between the camera and the car
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
      const blocking = u > 0.02 && camera.position.y < 40 && px * px + pz * pz < 3.4 * 3.4 * t.s;
      const prev = fade.current[i];
      const next = THREE.MathUtils.damp(prev, blocking ? 0.18 : 1, 8, d);
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
          {t.kind === 0 ? <Palm seed={i + 1} /> : <Bush seed={i + 100} />}
        </group>
      ))}
      {/* rocks on the beach */}
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2 + 0.3;
        const d = ISLAND_RADIUS + 1.2 + (i % 3) * 0.5;
        return (
          <mesh key={i} position={[Math.cos(a) * d, -0.15, Math.sin(a) * d]} rotation={[i, i * 2, 0]} scale={0.5 + (i % 4) * 0.2} castShadow>
            <dodecahedronGeometry args={[0.8, 0]} />
            <meshStandardMaterial color="#9aa1a8" flatShading roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

function Lamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.7, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 3.4, 10]} />
        <meshPhysicalMaterial color="#2b3340" metalness={0.7} roughness={0.3} clearcoat={1} />
      </mesh>
      <mesh position={[0.35, 3.4, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.05, 0.05, 0.75, 8]} />
        <meshPhysicalMaterial color="#2b3340" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.68, 3.32, 0]}>
        <boxGeometry args={[0.36, 0.12, 0.22]} />
        <meshStandardMaterial color="#fffaf0" emissive="#fff3d6" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

/** Glowing pad the car parks on to open a building. Pulses while the car is on it. */
function Pad({ at, radius, active, brand }: { at: [number, number]; radius: number; active: boolean; brand: string }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ring.current) ring.current.scale.setScalar(active ? 1 + Math.sin(clock.elapsedTime * 6) * 0.06 : 1);
  });
  return (
    <group position={[at[0], 0.05, at[1]]}>
      <mesh rotation-x={-Math.PI / 2}>
        <circleGeometry args={[radius, 40]} />
        <meshBasicMaterial color={brand} transparent opacity={active ? 0.45 : 0.22} depthWrite={false} />
      </mesh>
      <mesh ref={ring} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[radius - 0.18, radius, 48]} />
        <meshBasicMaterial color="#ffffff" />
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
const glass = { color: '#9fd3ff', metalness: 0.3, roughness: 0.05, clearcoat: 1, envMapIntensity: 1.6 } as const;

function House({ brand }: { brand: string }) {
  const [x, z] = PLACES.house;
  return (
    <group position={[x, 0, z]} scale={1.15}>
      <RoundedBox args={[6, 3.6, 5]} radius={0.15} position={[0, 1.8, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#f7f2e8" roughness={0.85} />
      </RoundedBox>
      <mesh position={[0, 4.65, 0]} rotation-y={Math.PI / 4} castShadow>
        <coneGeometry args={[4.7, 2.3, 4]} />
        <meshPhysicalMaterial color="#d9674e" roughness={0.5} clearcoat={0.4} flatShading />
      </mesh>
      <mesh position={[1.6, 5, -0.6]} castShadow>
        <boxGeometry args={[0.6, 1.6, 0.6]} />
        <meshStandardMaterial color="#b8a48c" />
      </mesh>
      {/* door + step */}
      <RoundedBox args={[1.2, 2.2, 0.12]} radius={0.05} position={[0, 1.1, 2.5]}>
        <meshPhysicalMaterial color={brand} roughness={0.25} clearcoat={1} />
      </RoundedBox>
      <mesh position={[0, 0.08, 2.9]} receiveShadow>
        <boxGeometry args={[2, 0.16, 0.8]} />
        <meshStandardMaterial color="#cfc8bb" />
      </mesh>
      {/* windows with frames and flower boxes */}
      {[-1.9, 1.9].map((wx) => (
        <group key={wx} position={[wx, 2.05, 2.52]}>
          <mesh>
            <boxGeometry args={[1.25, 1.1, 0.06]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <boxGeometry args={[1.05, 0.9, 0.02]} />
            <meshPhysicalMaterial {...glass} />
          </mesh>
          <mesh position={[0, -0.7, 0.15]}>
            <boxGeometry args={[1.2, 0.22, 0.3]} />
            <meshStandardMaterial color="#8a5a3c" />
          </mesh>
          {[-0.4, -0.1, 0.2, 0.45].map((fx, i) => (
            <mesh key={fx} position={[fx, -0.52, 0.15]}>
              <sphereGeometry args={[0.1, 8, 6]} />
              <meshStandardMaterial color={['#ff6fa3', '#ffd34d', '#ff8a4c', '#ffffff'][i]} />
            </mesh>
          ))}
        </group>
      ))}
      <Sign position={[0, 7.1, 0]} title="About Me" sub="who I am" />
    </group>
  );
}

function Tower({ brand }: { brand: string }) {
  const [x, z] = PLACES.tower;
  const floors = [
    { y: 1.5, w: 4.8, label: 'Gloify' },
    { y: 4.6, w: 4.2, label: 'Ninjacart' },
    { y: 7.7, w: 3.6, label: 'Neutrinos' },
  ];
  return (
    <group position={[x, 0, z]}>
      {floors.map((f, i) => (
        <group key={f.label} position={[0, f.y, 0]}>
          <RoundedBox args={[f.w, 2.8, f.w]} radius={0.12} castShadow receiveShadow>
            <meshPhysicalMaterial {...glass} color={i === 2 ? '#7cc0ff' : '#a7d6ff'} />
          </RoundedBox>
          {/* white floor slab */}
          <mesh position={[0, -1.48, 0]}>
            <boxGeometry args={[f.w + 0.3, 0.16, f.w + 0.3]} />
            <meshStandardMaterial color="#f4f6fa" />
          </mesh>
          {/* brand light strip facing the road */}
          <mesh position={[-f.w / 2 - 0.02, 0.9, 0]} rotation-y={-Math.PI / 2}>
            <planeGeometry args={[f.w * 0.85, 0.12]} />
            <meshBasicMaterial color={brand} />
          </mesh>
          <Html position={[-f.w / 2 - 0.1, 0, 0]} center distanceFactor={16} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
            <span className="whitespace-nowrap rounded-md bg-[#0b1630]/70 px-2 py-0.5 font-display text-lg text-white">{f.label}</span>
          </Html>
        </group>
      ))}
      <mesh position={[0, 9.4, 0]}>
        <boxGeometry args={[3.9, 0.2, 3.9]} />
        <meshStandardMaterial color="#f4f6fa" />
      </mesh>
      <mesh position={[0, 10.3, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.6, 6]} />
        <meshStandardMaterial color="#c9ccd6" />
      </mesh>
      <mesh position={[0, 11.15, 0]}>
        <sphereGeometry args={[0.16, 12, 8]} />
        <meshBasicMaterial color="#ff4d4d" />
      </mesh>
      <Sign position={[-1, 12.4, 0]} title="Experience" sub="3 companies · 4+ yrs" />
    </group>
  );
}

function Billboard({ z, index, brand }: { z: number; index: number; brand: string }) {
  const p = projects[index];
  const tex = useTexture(p.image, (t) => {
    const loaded = Array.isArray(t) ? t[0] : t;
    loaded.colorSpace = THREE.SRGBColorSpace;
  });
  const W = 4.6;
  const H = W * (630 / 1200);
  return (
    <group position={[PLACES.boardsX, 0, z]} rotation-y={Math.PI / 2}>
      {[-1.9, 1.9].map((x) => (
        <mesh key={x} position={[x, 1.6, -0.1]} castShadow>
          <cylinderGeometry args={[0.12, 0.14, 3.2, 12]} />
          <meshPhysicalMaterial color="#e9edf5" metalness={0.6} roughness={0.25} clearcoat={1} />
        </mesh>
      ))}
      <RoundedBox args={[W + 0.4, H + 0.4, 0.22]} radius={0.1} position={[0, 2.9, -0.12]} castShadow>
        <meshPhysicalMaterial color="#ffffff" roughness={0.3} clearcoat={1} />
      </RoundedBox>
      <mesh position={[0, 2.9, 0.005]}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[0, 2.9 - H / 2 - 0.22, 0.01]}>
        <planeGeometry args={[W + 0.4, 0.06]} />
        <meshBasicMaterial color={brand} />
      </mesh>
      <Sign position={[0, 4.9, 0]} title={p.title.split(' – ')[0]} sub={p.company} />
    </group>
  );
}

function Billboards({ brand }: { brand: string }) {
  return (
    <group>
      {PLACES.boardsZ.map((z, i) => (
        <Billboard key={i} z={z} index={i} brand={brand} />
      ))}
      <Sign position={[PLACES.boardsX - 1, 6.4, -3]} title="My Apps" sub="drive up to open" />
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
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.1, 1.25, 1, 24]} />
        <meshStandardMaterial color="#f4f1ea" />
      </mesh>
      <mesh position={[0, 1.02, 0]}>
        <torusGeometry args={[1.1, 0.05, 8, 40]} />
        <meshBasicMaterial color={brand} />
      </mesh>
      <group ref={spin} position={[0, 1.4, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <RoundedBox key={i} args={[0.95, 0.2, 0.68]} radius={0.04} position={[0, i * 0.23, 0]} rotation-y={i * 0.4}>
            <meshPhysicalMaterial color={['#e06c4a', '#4a7bc9', brand, '#8a5bc9'][i]} roughness={0.3} clearcoat={1} />
          </RoundedBox>
        ))}
      </group>
      <Sign position={[0, 3.2, 0]} title="Archive" sub="earlier projects" />
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
        <cylinderGeometry args={[0.08, 0.08, 1.2, 10]} />
        <meshStandardMaterial color="#f4f6fa" />
      </mesh>
      <RoundedBox args={[0.6, 0.55, 1]} radius={0.12} position={[0, 1.38, 0]} castShadow>
        <meshPhysicalMaterial color={brand} roughness={0.2} metalness={0.3} clearcoat={1} />
      </RoundedBox>
      <mesh ref={flag} position={[0.33, 1.5, -0.2]}>
        <boxGeometry args={[0.04, 0.45, 0.2]} />
        <meshStandardMaterial color="#ff4d4d" />
      </mesh>
      <Sign position={[0, 2.5, 0]} title="Contact" sub="say hello" />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Dynamic bits: cones, dust, coins                                   */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* Physics: static world colliders + the knockable playground         */
/* ------------------------------------------------------------------ */
function StaticColliders() {
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[48, 0.5, 48]} position={[0, -0.5, 0]} friction={0.9} />
        {COLLIDERS.map((c, i) => (
          <CylinderCollider key={i} args={[3, c.r]} position={[c.x, 3, c.z]} />
        ))}
      </RigidBody>
      {RAMPS.map((r, i) => {
        const slope = Math.atan2(r.height, r.length);
        const hyp = Math.hypot(r.height, r.length);
        return (
          <RigidBody key={i} type="fixed" colliders={false} position={[r.x, 0, r.z]} rotation={[0, r.dir, 0]}>
            <CuboidCollider args={[r.width / 2, 0.08, hyp / 2]} position={[0, r.height / 2, r.length / 2]} rotation={[-slope, 0, 0]} />
          </RigidBody>
        );
      })}
    </>
  );
}

function crateTexture(label: string, brand: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#f6f3ec';
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = brand;
  g.fillRect(0, 0, 256, 18);
  g.fillRect(0, 238, 256, 18);
  g.strokeStyle = 'rgba(0,0,0,0.12)';
  g.lineWidth = 6;
  g.strokeRect(10, 10, 236, 236);
  g.fillStyle = '#0b1630';
  g.font = `bold ${label.length > 8 ? 38 : 48}px Inter, Arial, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(label, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function SkillCrates({ brand }: { brand: string }) {
  const mats = useMemo(
    () => CRATE_LABELS.map((l) => new THREE.MeshPhysicalMaterial({ map: crateTexture(l, brand), roughness: 0.4, clearcoat: 0.6 })),
    [brand]
  );
  const crates: { x: number; y: number; label: number }[] = [];
  let n = 0;
  CRATE_TOWER.rows.forEach((count, row) => {
    for (let i = 0; i < count; i++) {
      crates.push({ x: CRATE_TOWER.x + (i - (count - 1) / 2) * (CRATE_SIZE + 0.02), y: CRATE_SIZE / 2 + row * CRATE_SIZE, label: n++ });
    }
  });
  return (
    <>
      {crates.map((c, i) => (
        <RigidBody key={i} position={[c.x, c.y + 0.01, CRATE_TOWER.z]} colliders="cuboid" mass={0.6} restitution={0.15} friction={0.8}>
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
    <RigidBody position={[x, 0.01, z]} colliders={false} mass={0.25} restitution={0.3} friction={0.6} angularDamping={0.4}>
      <CylinderCollider args={[0.46, 0.19]} position={[0, 0.48, 0]} />
      <mesh geometry={geo} castShadow>
        <meshPhysicalMaterial color="#fbfbf8" roughness={0.25} clearcoat={1} />
      </mesh>
      {[0.7, 0.76].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.103, 0.103, 0.025, 20]} />
          <meshStandardMaterial color="#e23b3b" />
        </mesh>
      ))}
    </RigidBody>
  );
}

function Dominoes({ brand }: { brand: string }) {
  return (
    <>
      {DOMINOES.map((d, i) => (
        <RigidBody key={i} position={[d.x, 0.61, d.z]} rotation={[0, d.rot, 0]} colliders="cuboid" mass={0.15} friction={0.5}>
          <RoundedBox args={[0.9, 1.2, 0.22]} radius={0.05} castShadow>
            <meshPhysicalMaterial color={i % 2 ? brand : '#ffffff'} roughness={0.3} clearcoat={1} />
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
        <RigidBody key={i} position={[x, 0.01, z]} colliders={false} mass={0.12} restitution={0.25} angularDamping={0.5}>
          <CylinderCollider args={[0.45, 0.24]} position={[0, 0.45, 0]} />
          <mesh position={[0, 0.05, 0]} castShadow>
            <boxGeometry args={[0.7, 0.1, 0.7]} />
            <meshStandardMaterial color="#ff6a1a" />
          </mesh>
          <mesh position={[0, 0.5, 0]} castShadow>
            <coneGeometry args={[0.28, 0.9, 16]} />
            <meshPhysicalMaterial color="#ff6a1a" roughness={0.4} clearcoat={0.6} />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.17, 0.21, 0.16, 16]} />
            <meshStandardMaterial color="#f4f4f4" />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}

function Playground({ brand }: { brand: string }) {
  const resetKey = useGame((s) => s.resetKey);
  return (
    <group key={resetKey}>
      <SkillCrates brand={brand} />
      {PINS.map(([x, z], i) => (
        <Pin key={i} x={x} z={z} />
      ))}
      <Dominoes brand={brand} />
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
      (m.material as THREE.MeshBasicMaterial).opacity = Math.max(p.life, 0) * 0.45;
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
          <icosahedronGeometry args={[0.45, 1]} />
          <meshBasicMaterial color="#f1ead9" transparent opacity={0} depthWrite={false} />
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
    <group ref={ref} position={[c.at[0], baseY, c.at[1]]}>
      <mesh rotation-x={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.12, 32]} />
        <meshPhysicalMaterial color="#ffcf4a" emissive="#ffb703" emissiveIntensity={0.25} metalness={0.9} roughness={0.15} clearcoat={1} />
      </mesh>
      <mesh rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.4, 0.045, 8, 32]} />
        <meshBasicMaterial color={brand} />
      </mesh>
      <mesh position={[0, -baseY / 2 + 2, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 4 + baseY, 6]} />
        <meshBasicMaterial color="#ffe08a" transparent opacity={0.35} depthWrite={false} />
      </mesh>
      {!collected && (
        <Html position={[0, 1, 0]} center distanceFactor={16} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <span className="whitespace-nowrap rounded-full bg-[#0b1630]/75 px-2 py-0.5 font-mono text-[11px] text-[#ffd166]">
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
  return (
    <>
      <color attach="background" args={[FOG]} />
      <fog attach="fog" args={[FOG, 80, 240]} />
      <Sky sunPosition={SUN} turbidity={5} rayleigh={1.2} mieCoefficient={0.004} mieDirectionalG={0.86} />
      {/* studio-style reflections for glossy paint and glass (rendered once) */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={1.6} color="#cfe6ff" position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={[40, 40, 1]} />
        <Lightformer form="circle" intensity={6} color="#fff4dc" position={SUN.map((v) => v / 6) as [number, number, number]} scale={4} />
        <Lightformer form="rect" intensity={0.6} color="#7fb36a" position={[0, -6, 0]} rotation-x={-Math.PI / 2} scale={[40, 40, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#8fd0ff" position={[-14, 2, 0]} rotation-y={Math.PI / 2} scale={[30, 6, 1]} />
      </Environment>
      <hemisphereLight args={['#d6ecff', '#7a9a62', 0.85]} />
      <directionalLight
        position={SUN}
        intensity={2.4}
        color="#fff1d8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-camera-far={200}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <Ocean />
      <Island brand={brand} />
      <Ramps />
      <Vegetation />
      <Pads brand={brand} />
      <House brand={brand} />
      <Tower brand={brand} />
      <Billboards brand={brand} />
      <Kiosk brand={brand} />
      <Mailbox brand={brand} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        const r = RING_ROAD.outer + 1.3;
        return <Lamp key={i} position={[Math.sin(a) * r, 0, Math.cos(a) * r]} />;
      })}
      <StaticColliders />
      <Playground brand={brand} />
      <Dust />
      {COINS.map((_, i) => (
        <Coin key={i} index={i} brand={brand} />
      ))}
    </>
  );
}
