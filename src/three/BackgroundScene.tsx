import { useMemo, useRef, type ComponentRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { motion, prefersReducedMotion } from '@/lib/motion';
import { getTheme, useTheme, type Rgb } from '@/lib/theme';

const toColor = (c: Rgb, out = new THREE.Color()) =>
  out.setRGB(c[0] / 255, c[1] / 255, c[2] / 255, THREE.SRGBColorSpace);
const css = (c: Rgb) => `rgb(${c.join(',')})`;
const WHITE = new THREE.Color('#ffffff');

/** Live palette, eased toward the active theme every frame. */
const initial = getTheme();
const palette = { a: toColor(initial.brand), ink: toColor(initial.ink) };
const target = { a: new THREE.Color(), ink: new THREE.Color() };

/* ------------------------------------------------------------------ */
/* The one hero object: a liquid-chrome orb                           */
/* ------------------------------------------------------------------ */
type DistortMat = ComponentRef<typeof MeshDistortMaterial>;

function Orb({ isMobile }: { isMobile: boolean }) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<DistortMat>(null);
  const { viewport } = useThree();

  useFrame((_, delta) => {
    const p = motion.progress;
    const v = Math.min(Math.abs(motion.velocity), 60);
    const g = group.current;
    if (!g) return;

    // big and to the right in the hero, then smaller and parked at
    // alternating screen edges so it never sits behind body text
    const hero = THREE.MathUtils.clamp(1 - p / 0.09, 0, 1);
    // parked half off-screen; tanh snaps between the two edges quickly
    const edge = viewport.width * (isMobile ? 0.52 : 0.5);
    const heroX = isMobile ? viewport.width * 0.42 : Math.min(viewport.width * 0.3, 3.4);
    const heroY = isMobile ? viewport.height * 0.3 : -0.1;
    const sideX = Math.tanh(Math.cos(p * Math.PI * 3) * 5) * edge;
    const tx = THREE.MathUtils.lerp(sideX, heroX, hero) + motion.pointer.x * 0.3;
    const ty = THREE.MathUtils.lerp(Math.sin(p * Math.PI * 4) * 0.8, heroY, hero) + motion.pointer.y * 0.25;
    const ts = THREE.MathUtils.lerp(isMobile ? 0.5 : 0.6, isMobile ? 0.7 : 0.9, hero) * (1 + motion.pulse * 0.06);

    g.position.x = THREE.MathUtils.damp(g.position.x, tx, 2.5, delta);
    g.position.y = THREE.MathUtils.damp(g.position.y, ty, 2.5, delta);
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, ts, 3, delta));
    g.rotation.y += delta * 0.12 + motion.velocity * 0.0006;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, motion.pointer.y * 0.35, 2, delta);
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, -motion.pointer.x * 0.2, 2, delta);

    const m = mat.current;
    if (m) {
      // calmer at rest, more liquid when scrolling fast or after a click
      m.distort = THREE.MathUtils.damp(m.distort, 0.32 + v * 0.004 + motion.pulse * 0.25, 4, delta);
      m.envMapIntensity = THREE.MathUtils.damp(m.envMapIntensity, hero > 0.5 ? 1.25 : 0.8, 3, delta);
      m.color.copy(palette.a).lerp(WHITE, 0.15);
    }
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[1.45, isMobile ? 32 : 64]} />
        <MeshDistortMaterial
          ref={mat}
          distort={0.32}
          speed={1.4}
          metalness={0.25}
          roughness={0.16}
          iridescence={0.9}
          iridescenceIOR={1.4}
          iridescenceThicknessRange={[200, 700]}
          clearcoat={1}
          clearcoatRoughness={0.08}
          envMapIntensity={1.25}
        />
      </mesh>
    </group>
  );
}

/** Studio lighting rendered into the environment map; strips pick up the theme colours. */
function Studio() {
  const theme = useTheme();
  return (
    <Environment resolution={256} frames={Infinity}>
      <color attach="background" args={['#101014']} />
      {/* soft key from above, coloured rims left/right, warm fill from below */}
      <Lightformer form="rect" intensity={2.2} color="#ffffff" position={[0, 6, 0]} scale={[16, 6, 1]} rotation-x={Math.PI / 2} />
      <Lightformer form="rect" intensity={3} color={css(theme.brand)} position={[-6, 0, 2]} scale={[5, 12, 1]} rotation-y={Math.PI / 2} />
      <Lightformer form="rect" intensity={3} color={css(theme.brand2)} position={[6, 0, 2]} scale={[5, 12, 1]} rotation-y={-Math.PI / 2} />
      <Lightformer form="rect" intensity={1.6} color={css(theme.brand3)} position={[0, -6, 2]} scale={[14, 5, 1]} rotation-x={-Math.PI / 2} />
      <Lightformer form="circle" intensity={2.5} color="#ffffff" position={[2.5, 2.5, 6]} scale={2} />
    </Environment>
  );
}

/* ------------------------------------------------------------------ */
/* Faint star field                                                   */
/* ------------------------------------------------------------------ */
// Deterministic pseudo-random (mulberry32) so geometry is identical every render
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Stars({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const { positions, scales } = useMemo(() => {
    const random = rng(1337);
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 5 + random() * 14;
      const a = random() * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = (random() - 0.5) * 40;
      positions[i * 3 + 2] = Math.sin(a) * r - 8;
      scales[i] = random();
    }
    return { positions, scales };
  }, [count]);

  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uColor: { value: palette.a }, uPixel: { value: 1 } }), []);

  useFrame((state, delta) => {
    const u = material.current?.uniforms;
    if (u) {
      u.uTime.value = state.clock.elapsedTime;
      u.uPixel.value = state.gl.getPixelRatio();
    }
    if (!ref.current) return;
    ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, motion.progress * 16, 3, delta);
    ref.current.rotation.y += delta * 0.015;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          uniform float uTime; uniform float uPixel; attribute float aScale; varying float vA;
          void main(){
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            float tw = 0.6 + 0.4 * sin(uTime * (0.8 + aScale * 1.5) + aScale * 40.0);
            vA = tw * (0.15 + aScale * 0.45);
            gl_PointSize = (1.5 + aScale * 3.0) * uPixel * (12.0 / -mv.z);
          }`}
        fragmentShader={/* glsl */ `
          uniform vec3 uColor; varying float vA;
          void main(){
            float d = length(gl_PointCoord - 0.5);
            gl_FragColor = vec4(mix(vec3(1.0), uColor, 0.6), smoothstep(0.5, 0.0, d) * vA);
          }`}
      />
    </points>
  );
}

/** Eases the palette toward the active theme; also decays the click pulse. */
function ThemeSync() {
  useFrame(({ scene }, delta) => {
    const t = getTheme();
    toColor(t.brand, target.a);
    toColor(t.ink, target.ink);
    const k = 1 - Math.exp(-4 * delta);
    palette.a.lerp(target.a, k);
    palette.ink.lerp(target.ink, k);
    scene.background = palette.ink;
    motion.pulse = Math.max(0, motion.pulse - delta * 0.85);
  });
  return null;
}

function CameraRig() {
  useFrame((state, delta) => {
    const cam = state.camera;
    cam.position.x = THREE.MathUtils.damp(cam.position.x, motion.pointer.x * 0.35, 2, delta);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, motion.pointer.y * 0.25, 2, delta);
    cam.lookAt(0, 0, 0);
  });
  return null;
}

export default function BackgroundScene() {
  const reduced = prefersReducedMotion();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  return (
    <div className="pointer-events-none fixed inset-0" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 45 }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
        frameloop={reduced ? 'demand' : 'always'}
      >
        <Studio />
        <ambientLight intensity={0.25} />
        <directionalLight position={[3, 4, 5]} intensity={1.2} />
        <Stars count={isMobile ? 700 : 1600} />
        <Orb isMobile={isMobile} />
        <CameraRig />
        <ThemeSync />
      </Canvas>
      {/* vignette + grain keep text readable over the scene */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgb(var(--ink)/0.5)_70%,rgb(var(--ink)/0.9)_100%)]" />
      <div className="noise-overlay absolute inset-0" />
    </div>
  );
}
