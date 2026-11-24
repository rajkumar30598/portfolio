import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { motion, prefersReducedMotion } from '@/lib/motion';

const LIME = new THREE.Color('#d3e97a');
const VIOLET = new THREE.Color('#7c5cff');
const CYAN = new THREE.Color('#38d9f5');

/* ------------------------------------------------------------------ */
/* GLSL: 3D simplex noise (Ashima Arts / Stefan Gustavson, MIT)       */
/* ------------------------------------------------------------------ */
const noiseGLSL = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

/* ------------------------------------------------------------------ */
/* Morphing energy orb                                                */
/* ------------------------------------------------------------------ */
function Orb({ isMobile }: { isMobile: boolean }) {
  const group = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: 0.35 },
      uFreq: { value: 1.4 },
      uColorA: { value: LIME },
      uColorB: { value: VIOLET },
      uColorC: { value: CYAN },
      uDim: { value: 1 },
    }),
    []
  );

  const vertexShader = /* glsl */ `
    uniform float uTime; uniform float uAmp; uniform float uFreq;
    varying vec3 vNormal; varying vec3 vView; varying float vNoise;
    ${noiseGLSL}
    void main(){
      float n = snoise(normal * uFreq + uTime * 0.35);
      float n2 = snoise(normal * uFreq * 2.3 - uTime * 0.2) * 0.35;
      float d = (n + n2) * uAmp;
      vNoise = d;
      vec3 pos = position + normal * d;
      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      vView = normalize(-mv.xyz);
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * mv;
    }`;

  const fragmentShader = /* glsl */ `
    uniform vec3 uColorA; uniform vec3 uColorB; uniform vec3 uColorC; uniform float uTime; uniform float uDim;
    varying vec3 vNormal; varying vec3 vView; varying float vNoise;
    void main(){
      float fres = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.2);
      float t = smoothstep(-0.4, 0.5, vNoise);
      vec3 base = mix(vec3(0.03,0.03,0.05), uColorB * 0.55, t);
      vec3 rim = mix(uColorA, uColorC, 0.5 + 0.5 * sin(uTime * 0.6 + vNoise * 6.0));
      vec3 col = base + rim * fres * 1.6;
      col += uColorA * pow(t, 6.0) * 0.6;
      gl_FragColor = vec4(col * uDim, 1.0);
    }`;

  const { viewport } = useThree();

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const p = motion.progress;
    const v = Math.min(Math.abs(motion.velocity), 60);
    const u = material.current?.uniforms;
    if (u) {
      u.uTime.value = t;
      // more turbulence while scrolling fast
      u.uAmp.value = THREE.MathUtils.damp(u.uAmp.value, 0.3 + v * 0.012, 4, delta);
      u.uFreq.value = 1.3 + Math.sin(p * Math.PI * 2) * 0.4;
    }

    if (!group.current) return;
    // choreography: big and to the right in the hero, then smaller and parked
    // at alternating screen edges so it never sits behind body text
    const hero = THREE.MathUtils.clamp(1 - p / 0.09, 0, 1);
    const edge = isMobile ? viewport.width * 0.45 : viewport.width * 0.44;
    const heroX = isMobile ? viewport.width * 0.42 : Math.min(viewport.width * 0.24, 2.8);
    const heroY = isMobile ? viewport.height * 0.3 : 0;
    const sideX = Math.cos(p * Math.PI * 3) * edge;
    const targetX = THREE.MathUtils.lerp(sideX, heroX, hero) + motion.pointer.x * 0.3;
    const targetY = THREE.MathUtils.lerp(Math.sin(p * Math.PI * 4) * 0.8, heroY, hero) + motion.pointer.y * 0.25;
    const targetScale = THREE.MathUtils.lerp(isMobile ? 0.45 : 0.6, isMobile ? 0.65 : 1, hero);
    if (u) u.uDim.value = THREE.MathUtils.damp(u.uDim.value, THREE.MathUtils.lerp(0.6, isMobile ? 0.8 : 1, hero), 3, delta);
    const g = group.current;
    g.position.x = THREE.MathUtils.damp(g.position.x, targetX, 2.5, delta);
    g.position.y = THREE.MathUtils.damp(g.position.y, targetY, 2.5, delta);
    const s = THREE.MathUtils.damp(g.scale.x, targetScale, 3, delta);
    g.scale.setScalar(s);
    g.rotation.y += delta * 0.15 + motion.velocity * 0.0008;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, p * Math.PI * 1.5 + motion.pointer.y * 0.3, 2, delta);

    if (shell.current) {
      shell.current.rotation.y -= delta * 0.25;
      shell.current.rotation.z += delta * 0.1;
    }
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[1.5, isMobile ? 48 : 96]} />
        <shaderMaterial
          ref={material}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
        />
      </mesh>
      <mesh ref={shell} scale={1.55}>
        <icosahedronGeometry args={[1.5, 2]} />
        <meshBasicMaterial color={LIME} wireframe transparent opacity={0.08} />
      </mesh>
      <Ring radius={2.6} speed={0.35} tilt={1.1} />
      <Ring radius={3.1} speed={-0.22} tilt={-0.6} />
    </group>
  );
}

function Ring({ radius, speed, tilt }: { radius: number; speed: number; tilt: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * speed;
  });
  return (
    <mesh ref={ref} rotation={[tilt, 0.3, 0]}>
      <torusGeometry args={[radius, 0.006, 8, 200]} />
      <meshBasicMaterial color={LIME} transparent opacity={0.35} />
    </mesh>
  );
}

// Deterministic pseudo-random (mulberry32) so geometry is the same every render
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
/* Particle field                                                     */
/* ------------------------------------------------------------------ */
function Particles({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const { positions, scales } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const random = rng(1337);
    for (let i = 0; i < count; i++) {
      // a tall column of particles so scrolling reveals new ones
      const r = 4 + random() * 14;
      const a = random() * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = (random() - 0.5) * 40;
      positions[i * 3 + 2] = Math.sin(a) * r - 6;
      scales[i] = random();
    }
    return { positions, scales };
  }, [count]);

  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uColor: { value: LIME }, uPixel: { value: 1 } }),
    []
  );

  useFrame((state, delta) => {
    const u = material.current?.uniforms;
    if (u) {
      u.uTime.value = state.clock.elapsedTime;
      u.uPixel.value = state.gl.getPixelRatio();
    }
    if (!ref.current) return;
    const p = motion.progress;
    ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, p * 18, 3, delta);
    ref.current.rotation.y += delta * 0.02 + motion.velocity * 0.0004;
    ref.current.rotation.x = THREE.MathUtils.damp(ref.current.rotation.x, motion.pointer.y * 0.08, 2, delta);
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
            vec3 p = position;
            p.y += sin(uTime * 0.3 + position.x) * 0.25;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            float tw = 0.55 + 0.45 * sin(uTime * (1.0 + aScale * 2.0) + aScale * 40.0);
            vA = tw * (0.3 + aScale * 0.7);
            gl_PointSize = (2.0 + aScale * 5.0) * uPixel * (12.0 / -mv.z);
          }`}
        fragmentShader={/* glsl */ `
          uniform vec3 uColor; varying float vA;
          void main(){
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.0, d);
            gl_FragColor = vec4(uColor, a * vA);
          }`}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Floating glass shapes                                              */
/* ------------------------------------------------------------------ */
function Shapes() {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, motion.progress * 10, 3, delta);
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, motion.pointer.x * 0.2, 2, delta);
  });
  const items: { pos: [number, number, number]; geo: 'oct' | 'torus' | 'box' | 'tetra'; color: THREE.Color; s: number }[] = [
    { pos: [-4.5, 2.2, -2], geo: 'oct', color: LIME, s: 0.35 },
    { pos: [4.8, -1.8, -3], geo: 'torus', color: VIOLET, s: 0.4 },
    { pos: [-3.6, -4.5, -1], geo: 'box', color: CYAN, s: 0.3 },
    { pos: [3.8, -7, -2], geo: 'tetra', color: LIME, s: 0.45 },
    { pos: [-5, -10, -3], geo: 'torus', color: LIME, s: 0.35 },
    { pos: [5, -13, -2], geo: 'oct', color: VIOLET, s: 0.4 },
    { pos: [-4, -16, -2], geo: 'tetra', color: CYAN, s: 0.35 },
  ];
  return (
    <group ref={group}>
      {items.map((it, i) => (
        <Float key={i} speed={1.5 + i * 0.2} rotationIntensity={2} floatIntensity={1.5}>
          <mesh position={it.pos} scale={it.s}>
            {it.geo === 'oct' && <octahedronGeometry args={[1, 0]} />}
            {it.geo === 'torus' && <torusGeometry args={[1, 0.35, 16, 48]} />}
            {it.geo === 'box' && <boxGeometry args={[1.3, 1.3, 1.3]} />}
            {it.geo === 'tetra' && <tetrahedronGeometry args={[1, 0]} />}
            <meshStandardMaterial
              color={it.color}
              emissive={it.color}
              emissiveIntensity={0.25}
              roughness={0.25}
              metalness={0.6}
              wireframe={i % 2 === 1}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function CameraRig() {
  useFrame((state, delta) => {
    const cam = state.camera;
    cam.position.x = THREE.MathUtils.damp(cam.position.x, motion.pointer.x * 0.4, 2, delta);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, motion.pointer.y * 0.3, 2, delta);
    cam.position.z = THREE.MathUtils.damp(cam.position.z, 7 - Math.sin(motion.progress * Math.PI) * 0.8, 2, delta);
    cam.lookAt(0, 0, 0);
  });
  return null;
}

export default function BackgroundScene() {
  const reduced = prefersReducedMotion();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  return (
    <div className="fixed inset-0 -z-0 pointer-events-none" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 45 }}
        dpr={[1, isMobile ? 1.5 : 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        frameloop={reduced ? 'demand' : 'always'}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={40} color="#d3e97a" />
        <pointLight position={[-5, -3, 2]} intensity={30} color="#7c5cff" />
        <Particles count={isMobile ? 900 : 2200} />
        <Orb isMobile={isMobile} />
        {!isMobile && <Shapes />}
        <CameraRig />
      </Canvas>
      {/* vignette + grain so text stays readable over the scene */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,10,12,0.55)_70%,rgba(10,10,12,0.9)_100%)]" />
      <div className="absolute inset-0 noise-overlay" />
    </div>
  );
}
