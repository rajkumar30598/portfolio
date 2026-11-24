import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTheme } from '@/lib/theme';
import { input } from './input';
import { COINS, COLLIDERS, STATIONS, WALK_RADIUS } from './layout';
import { playerPos } from './runtime';
import { gameStore } from './store';
import { sfx } from './sound';

const CAM_OFFSET = new THREE.Vector3(0, 8.5, 11);
const LOOK = new THREE.Vector3();
const camTarget = new THREE.Vector3();
const PLAYER_R = 0.45;
const WALK = 5.2;
const RUN = 9;

/** Shortest-path angle interpolation. */
function dampAngle(a: number, b: number, lambda: number, dt: number) {
  const diff = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + diff * (1 - Math.exp(-lambda * dt));
}

export function Player() {
  const theme = useTheme();
  const brand = `rgb(${theme.brand.join(',')})`;
  const glow = `rgb(${theme.brand3.join(',')})`;

  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const footL = useRef<THREE.Mesh>(null);
  const footR = useRef<THREE.Mesh>(null);
  const antenna = useRef<THREE.Mesh>(null);
  const motionState = useRef({ vx: 0, vz: 0, yaw: Math.PI, phase: 0 });

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const g = root.current;
    if (!g) return;
    const m = motionState.current;

    // ---- movement ----
    let ix = input.frozen ? 0 : input.x;
    let iz = input.frozen ? 0 : input.z;
    const len = Math.hypot(ix, iz);
    if (len > 1) {
      ix /= len;
      iz /= len;
    }
    const speed = input.run ? RUN : WALK;
    m.vx = THREE.MathUtils.damp(m.vx, ix * speed, 10, dt);
    m.vz = THREE.MathUtils.damp(m.vz, iz * speed, 10, dt);

    let nx = g.position.x + m.vx * dt;
    let nz = g.position.z + m.vz * dt;
    // push out of buildings / trees
    for (const c of COLLIDERS) {
      const dx = nx - c.x;
      const dz = nz - c.z;
      const d = Math.hypot(dx, dz);
      const min = c.r + PLAYER_R;
      if (d < min && d > 1e-4) {
        nx = c.x + (dx / d) * min;
        nz = c.z + (dz / d) * min;
      }
    }
    // stay on the island
    const rr = Math.hypot(nx, nz);
    if (rr > WALK_RADIUS) {
      nx *= WALK_RADIUS / rr;
      nz *= WALK_RADIUS / rr;
    }
    g.position.x = nx;
    g.position.z = nz;
    playerPos.copy(g.position);

    // ---- facing + walk cycle ----
    const sp = Math.hypot(m.vx, m.vz);
    if (sp > 0.3) m.yaw = dampAngle(m.yaw, Math.atan2(m.vx, m.vz), 12, dt);
    g.rotation.y = m.yaw;
    m.phase += dt * (sp * 2.1);
    const moving = Math.min(sp / WALK, 1.4);
    const t = state.clock.elapsedTime;
    if (body.current) {
      body.current.position.y = Math.abs(Math.sin(m.phase)) * 0.14 * moving + Math.sin(t * 2.2) * 0.02;
      body.current.rotation.x = THREE.MathUtils.damp(body.current.rotation.x, moving * 0.12, 8, dt);
      body.current.rotation.z = Math.sin(m.phase) * 0.05 * moving;
    }
    if (footL.current && footR.current) {
      footL.current.position.z = Math.sin(m.phase) * 0.22 * moving;
      footR.current.position.z = -Math.sin(m.phase) * 0.22 * moving;
      footL.current.position.y = 0.09 + Math.max(0, Math.cos(m.phase)) * 0.1 * moving;
      footR.current.position.y = 0.09 + Math.max(0, -Math.cos(m.phase)) * 0.1 * moving;
    }
    if (antenna.current) antenna.current.rotation.x = -moving * 0.35 + Math.sin(t * 3) * 0.06;

    // ---- stations ----
    let near: (typeof STATIONS)[number] | null = null;
    let best = Infinity;
    for (const s of STATIONS) {
      const d = Math.hypot(nx - s.at[0], nz - s.at[1]);
      if (d < s.radius && d < best) {
        best = d;
        near = s;
      }
    }
    gameStore.setNear(near?.id ?? null);
    if (input.interact) {
      input.interact = false;
      if (near && !gameStore.get().open) {
        gameStore.open(near.id);
        sfx.open();
      }
    }

    // ---- coins ----
    COINS.forEach((c, i) => {
      if (Math.hypot(nx - c.at[0], nz - c.at[1]) < 1.3 && gameStore.collect(i)) {
        if (gameStore.get().won) sfx.win();
        else sfx.coin();
      }
    });

    // ---- follow camera ----
    camTarget.copy(g.position).add(CAM_OFFSET);
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, camTarget.x, 3, dt);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, camTarget.y, 3, dt);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, camTarget.z, 3, dt);
    LOOK.set(g.position.x, 1.1, g.position.z - 1.5);
    state.camera.lookAt(LOOK);
  });

  return (
    <group ref={root} position={[0, 0, 4]}>
      <group ref={body}>
        {/* body */}
        <mesh position={[0, 0.95, 0]} castShadow>
          <capsuleGeometry args={[0.45, 0.55, 8, 20]} />
          <meshStandardMaterial color="#f4f4f6" roughness={0.35} />
        </mesh>
        {/* belt stripe in the theme colour */}
        <mesh position={[0, 0.78, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.455, 0.05, 8, 32]} />
          <meshStandardMaterial color={brand} emissive={brand} emissiveIntensity={0.4} />
        </mesh>
        {/* visor */}
        <mesh position={[0, 1.22, 0.3]} scale={[0.36, 0.2, 0.2]}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshStandardMaterial color="#0d0f14" roughness={0.1} metalness={0.6} />
        </mesh>
        {/* eyes */}
        <mesh position={[-0.11, 1.24, 0.47]}>
          <sphereGeometry args={[0.045, 12, 8]} />
          <meshBasicMaterial color={glow} />
        </mesh>
        <mesh position={[0.11, 1.24, 0.47]}>
          <sphereGeometry args={[0.045, 12, 8]} />
          <meshBasicMaterial color={glow} />
        </mesh>
        {/* backpack */}
        <mesh position={[0, 0.95, -0.42]} castShadow>
          <boxGeometry args={[0.5, 0.55, 0.22]} />
          <meshStandardMaterial color={brand} roughness={0.5} />
        </mesh>
        {/* antenna */}
        <mesh ref={antenna} position={[0, 1.62, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.35, 6]} />
          <meshStandardMaterial color="#9aa0aa" />
          <mesh position={[0, 0.22, 0]}>
            <sphereGeometry args={[0.08, 12, 8]} />
            <meshBasicMaterial color={brand} />
          </mesh>
        </mesh>
      </group>
      {/* feet */}
      <mesh ref={footL} position={[-0.2, 0.09, 0]} castShadow>
        <boxGeometry args={[0.22, 0.16, 0.34]} />
        <meshStandardMaterial color="#2a2d35" />
      </mesh>
      <mesh ref={footR} position={[0.2, 0.09, 0]} castShadow>
        <boxGeometry args={[0.22, 0.16, 0.34]} />
        <meshStandardMaterial color="#2a2d35" />
      </mesh>
      {/* soft glow under the player so they're easy to spot */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.9, 32]} />
        <meshBasicMaterial color={brand} transparent opacity={0.18} />
      </mesh>
    </group>
  );
}
