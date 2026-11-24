import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { motion, prefersReducedMotion } from '@/lib/motion';
import { getTheme, type Rgb } from '@/lib/theme';

/*
 * One object: a sculpture of glowing particles. Each particle knows where it
 * sits in four shapes (sphere → torus knot → double helix → spiral galaxy) and
 * the vertex shader blends between them as the page scrolls.
 */

/* ---------- colours: raw sRGB values, shaders output them unconverted ---------- */
const raw = (c: Rgb, out = new THREE.Color()) => out.setRGB(c[0] / 255, c[1] / 255, c[2] / 255);
const t0 = getTheme();
const palette = { a: raw(t0.brand), b: raw(t0.brand2), c: raw(t0.brand3) };

/* ---------- deterministic random so shapes are identical every render ---------- */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildShapes(count: number) {
  const r = rng(2024);
  const gauss = () => (r() + r() + r() - 1.5) / 1.5; // cheap bell curve, ~[-1, 1]
  const sphere = new Float32Array(count * 3);
  const knot = new Float32Array(count * 3);
  const helix = new Float32Array(count * 3);
  const galaxy = new Float32Array(count * 3);
  const rand = new Float32Array(count * 4);
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const k = i * 3;

    // 1. sphere: even Fibonacci shell, with a few particles inside and a faint halo
    const y = 1 - (i / (count - 1)) * 2;
    const ring = Math.sqrt(1 - y * y);
    const th = golden * i;
    const roll = r();
    const rad = roll < 0.8 ? 1.6 + gauss() * 0.03 : roll < 0.9 ? 1.6 * Math.cbrt(r()) : 1.9 + r() * 0.9;
    sphere[k] = Math.cos(th) * ring * rad;
    sphere[k + 1] = y * rad;
    sphere[k + 2] = Math.sin(th) * ring * rad;

    // 2. (2,3) torus knot with a soft tube
    const t = r() * Math.PI * 2;
    const R = 1.05 + 0.42 * Math.cos(3 * t);
    const tube = 0.16 * Math.sqrt(r());
    const ta = r() * Math.PI * 2;
    knot[k] = R * Math.cos(2 * t) + Math.cos(ta) * tube;
    knot[k + 1] = R * Math.sin(2 * t) + Math.sin(ta) * tube;
    knot[k + 2] = 0.42 * Math.sin(3 * t) * 1.6 + gauss() * 0.06;

    // 3. DNA double helix: two strands joined by rungs
    const hy = (r() - 0.5) * 4.4;
    const ang = hy * 2.2;
    if (r() < 0.78) {
      const strand = r() < 0.5 ? 0 : Math.PI;
      helix[k] = Math.cos(ang + strand) * 0.95 + gauss() * 0.06;
      helix[k + 1] = hy;
      helix[k + 2] = Math.sin(ang + strand) * 0.95 + gauss() * 0.06;
    } else {
      const rungY = Math.round(hy * 3) / 3;
      const ra = rungY * 2.2;
      const u = r() * 2 - 1;
      helix[k] = Math.cos(ra) * 0.95 * u;
      helix[k + 1] = rungY + gauss() * 0.02;
      helix[k + 2] = Math.sin(ra) * 0.95 * u;
    }

    // 4. spiral galaxy: three arms and a bright core
    const gr = Math.pow(r(), 0.65) * 2.6;
    const arm = Math.floor(r() * 3) * ((Math.PI * 2) / 3);
    const spin = gr * 1.9;
    const scatter = (0.35 * (1 - gr / 3)) + 0.05;
    galaxy[k] = Math.cos(arm + spin) * gr + gauss() * scatter;
    galaxy[k + 1] = gauss() * 0.12 * (1 - gr / 2.8);
    galaxy[k + 2] = Math.sin(arm + spin) * gr + gauss() * scatter;

    rand[i * 4] = r(); // size
    rand[i * 4 + 1] = r(); // morph stagger
    rand[i * 4 + 2] = r(); // colour mix
    rand[i * 4 + 3] = r(); // burst strength
  }
  return { sphere, knot, helix, galaxy, rand };
}

const noiseGLSL = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy; i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx; vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_); vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y); vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const vertexShader = /* glsl */ `
  uniform float uTime; uniform float uMorph; uniform float uPulse; uniform float uPixel; uniform float uSize;
  uniform vec3 uColA; uniform vec3 uColB; uniform vec3 uColC;
  attribute vec3 aKnot; attribute vec3 aHelix; attribute vec3 aGalaxy; attribute vec4 aRand;
  varying vec3 vColor; varying float vAlpha;
  ${noiseGLSL}
  float stage(float m, float i){ return smoothstep(0.0, 1.0, clamp(m - i, 0.0, 1.0)); }
  void main(){
    // stagger each particle a little so shapes flow into each other instead of snapping
    float m = clamp(uMorph * 1.12 - aRand.y * 0.36, 0.0, 3.0);
    vec3 p = mix(position, aKnot, stage(m, 0.0));
    p = mix(p, aHelix, stage(m, 1.0));
    p = mix(p, aGalaxy, stage(m, 2.0));

    // gentle drift through a noise field
    float t = uTime * 0.18;
    p += vec3(snoise(p * 0.7 + t), snoise(p * 0.7 + vec3(19.1) + t), snoise(p * 0.7 + vec3(41.7) + t)) * 0.11;
    // breathing
    p *= 1.0 + sin(uTime * 0.8) * 0.015;
    // click burst: pushes out then springs back
    float burst = sin((1.0 - uPulse) * 3.14159) * uPulse;
    p += normalize(p + 1e-4) * burst * (0.9 + aRand.w * 1.4);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.35 + aRand.x * aRand.x * 1.6) * uPixel / -mv.z;

    // colour: brand along the height, secondary accents sprinkled through
    vec3 base = mix(uColC, uColA, smoothstep(-1.8, 1.8, p.y + p.x * 0.3));
    vColor = mix(base, uColB, step(0.82, aRand.z) * 0.85);
    // particles facing the camera glow more, the far side fades: reads as volume
    vAlpha = smoothstep(-10.5, -5.0, mv.z) * (0.45 + aRand.x * 0.55);
  }`;

const fragmentShader = /* glsl */ `
  uniform float uDim;
  varying vec3 vColor; varying float vAlpha;
  void main(){
    float d = length(gl_PointCoord - 0.5);
    float glow = smoothstep(0.5, 0.0, d);
    float core = smoothstep(0.18, 0.0, d);
    gl_FragColor = vec4(vColor * (0.75 + core * 0.9), (glow * glow * 0.7 + core * 0.5) * vAlpha * uDim);
  }`;

function ParticleSculpture({ isMobile }: { isMobile: boolean }) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();
  const count = isMobile ? 6000 : 14000;
  const shapes = useMemo(() => buildShapes(count), [count]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uPulse: { value: 0 },
      uPixel: { value: 1 },
      uSize: { value: isMobile ? 28 : 38 },
      uDim: { value: 1 },
      uColA: { value: palette.a },
      uColB: { value: palette.b },
      uColC: { value: palette.c },
    }),
    [isMobile]
  );

  useFrame((state, delta) => {
    const p = motion.progress;
    const u = material.current?.uniforms;
    const hero = THREE.MathUtils.clamp(1 - p / 0.09, 0, 1);
    if (u) {
      u.uTime.value = state.clock.elapsedTime;
      u.uPixel.value = state.gl.getPixelRatio();
      u.uPulse.value = motion.pulse;
      // sphere in the hero, then knot → helix → galaxy through the page
      const morphTarget = THREE.MathUtils.clamp(((p - 0.06) / 0.7) * 3, 0, 3);
      u.uMorph.value = THREE.MathUtils.damp(u.uMorph.value, morphTarget, 2.2, delta);
      u.uDim.value = THREE.MathUtils.damp(u.uDim.value, THREE.MathUtils.lerp(0.55, 1, hero), 3, delta);
    }

    const g = group.current;
    if (!g) return;
    // big on the right in the hero, then drifting between the screen edges
    const edge = viewport.width * (isMobile ? 0.42 : 0.45);
    const heroX = isMobile ? viewport.width * 0.3 : Math.min(viewport.width * 0.27, 3.2);
    const heroY = isMobile ? viewport.height * 0.28 : -0.1;
    const sideX = Math.tanh(Math.cos(p * Math.PI * 3) * 4) * edge;
    const tx = THREE.MathUtils.lerp(sideX, heroX, hero) + motion.pointer.x * 0.25;
    const ty = THREE.MathUtils.lerp(0, heroY, hero) + motion.pointer.y * 0.2;
    const ts = THREE.MathUtils.lerp(isMobile ? 0.55 : 0.75, isMobile ? 0.65 : 0.95, hero);
    g.position.x = THREE.MathUtils.damp(g.position.x, tx, 2.2, delta);
    g.position.y = THREE.MathUtils.damp(g.position.y, ty, 2.2, delta);
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, ts, 3, delta));
    g.rotation.y += delta * 0.12 + motion.velocity * 0.0006;
    // the galaxy reads best tilted towards the viewer
    const tilt = u ? THREE.MathUtils.smoothstep(u.uMorph.value, 2, 3) * 0.9 : 0;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, tilt + motion.pointer.y * 0.3, 2, delta);
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, -motion.pointer.x * 0.15, 2, delta);
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[shapes.sphere, 3]} />
          <bufferAttribute attach="attributes-aKnot" args={[shapes.knot, 3]} />
          <bufferAttribute attach="attributes-aHelix" args={[shapes.helix, 3]} />
          <bufferAttribute attach="attributes-aGalaxy" args={[shapes.galaxy, 3]} />
          <bufferAttribute attach="attributes-aRand" args={[shapes.rand, 4]} />
        </bufferGeometry>
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

/** Decays the click pulse that makes the sculpture burst. */
function PulseDecay() {
  useFrame((_, delta) => {
    motion.pulse = Math.max(0, motion.pulse - delta * 0.7);
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
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        frameloop={reduced ? 'demand' : 'always'}
      >
        <ParticleSculpture isMobile={isMobile} />
        <CameraRig />
        <PulseDecay />
      </Canvas>
      {/* vignette + grain keep text readable over the scene */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgb(var(--ink)/0.25)_70%,rgb(var(--ink)/0.75)_100%)]" />
      <div className="noise-overlay absolute inset-0" />
    </div>
  );
}
