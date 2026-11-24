import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { CuboidCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useTheme } from '@/lib/theme';
import { input } from './input';
import { COINS, COLLIDERS, DRIVE_RADIUS, START, STATIONS, groundHeight } from './layout';
import { hud, playerPos, playerYaw, spawnPuff, view } from './runtime';
import { gameStore } from './store';
import { sfx } from './sound';

const CAR_R = 1.15; // collision radius
const GRAVITY = 26;
const MAX = 17;
const BOOST = 26;
const REVERSE = 8;

const look = new THREE.Vector3();
const quat = new THREE.Quaternion();
const euler = new THREE.Euler();

export function Car() {
  const theme = useTheme();
  const paint = `rgb(${theme.brand.join(',')})`;

  const root = useRef<THREE.Group>(null);
  const rb = useRef<RapierRigidBody>(null);
  const lastBonk = useRef(0);
  const body = useRef<THREE.Group>(null);
  const wheels = useRef<(THREE.Group | null)[]>([]);
  const frontPivots = useRef<(THREE.Group | null)[]>([]);
  const brakeMat = useRef<THREE.MeshStandardMaterial>(null);
  const spot = useRef<THREE.SpotLight>(null);
  const spotTarget = useRef<THREE.Object3D>(null);
  const sim = useRef({
    x: START.x,
    z: START.z,
    y: 0,
    vy: 0,
    yaw: START.yaw,
    speed: 0,
    vx: 0,
    vz: 0,
    steer: 0,
    wheelRot: 0,
    shake: 0,
    grounded: true,
    camYaw: START.yaw,
    fov: 55,
    puffTimer: 0,
  });

  useEffect(() => {
    if (spot.current && spotTarget.current) spot.current.target = spotTarget.current;
  }, []);

  // dev-only test hook: place the car precisely (stripped from production builds)
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as { __placeCar?: (x: number, z: number, yaw: number) => void };
    w.__placeCar = (x, z, yaw) => Object.assign(sim.current, { x, z, yaw, camYaw: yaw, speed: 0, vx: 0, vz: 0, y: 0, vy: 0 });
    return () => {
      delete w.__placeCar;
    };
  }, []);

  useFrame((state, delta) => {
    const s = sim.current;
    const g = root.current;
    if (!g) return;
    const dtAll = Math.min(delta, 0.1);
    const steps = Math.ceil(dtAll / 0.02);
    const dt = dtAll / steps;

    if (input.reset) {
      input.reset = false;
      Object.assign(s, { x: START.x, z: START.z, y: 0, vy: 0, yaw: START.yaw, speed: 0, vx: 0, vz: 0, camYaw: START.yaw });
      gameStore.resetProps();
    }

    const frozen = input.frozen;
    const throttle = frozen ? 0 : -input.z;
    const steerIn = frozen ? 0 : -input.x;
    const boost = !frozen && input.run;
    const handbrake = !frozen && input.handbrake;
    let drifting = false;

    for (let i = 0; i < steps; i++) {
      // ---- engine / brakes ----
      if (s.grounded) {
        if (throttle > 0) s.speed += (s.speed < 0 ? 40 : boost ? 26 : 16) * throttle * dt;
        else if (throttle < 0) s.speed -= (s.speed > 0 ? 38 : 14) * -throttle * dt;
        else s.speed -= Math.sign(s.speed) * Math.min(Math.abs(s.speed), 7 * dt);
        if (handbrake) s.speed *= 1 - 1.2 * dt;
      }
      const max = boost ? BOOST : MAX;
      if (s.speed > max) s.speed = THREE.MathUtils.damp(s.speed, max, 2, dt);
      if (s.speed < -REVERSE) s.speed = -REVERSE;
      if (frozen) s.speed = THREE.MathUtils.damp(s.speed, 0, 8, dt);

      // ---- steering ----
      s.steer = THREE.MathUtils.damp(s.steer, steerIn, 9, dt);
      const turn = s.steer * 2.25 * THREE.MathUtils.clamp(s.speed / 7, -1, 1) * (handbrake ? 1.7 : 1);
      if (s.grounded) s.yaw += turn * dt;

      // ---- grip: velocity slides toward the heading (less grip = drift) ----
      const fx = Math.sin(s.yaw);
      const fz = Math.cos(s.yaw);
      const grip = !s.grounded ? 0.4 : handbrake ? 1.8 : 8;
      s.vx = THREE.MathUtils.damp(s.vx, fx * s.speed, grip, dt);
      s.vz = THREE.MathUtils.damp(s.vz, fz * s.speed, grip, dt);
      if (Math.hypot(s.vx - fx * s.speed, s.vz - fz * s.speed) > 3.2) drifting = true;

      let nx = s.x + s.vx * dt;
      let nz = s.z + s.vz * dt;

      // ---- collisions with buildings / trees: push out and bounce ----
      if (s.y < 3) {
        for (const c of COLLIDERS) {
          const dx = nx - c.x;
          const dz = nz - c.z;
          const d = Math.hypot(dx, dz);
          const min = c.r + CAR_R;
          if (d < min && d > 1e-4) {
            const nxn = dx / d;
            const nzn = dz / d;
            nx = c.x + nxn * min;
            nz = c.z + nzn * min;
            const impact = -(s.vx * nxn + s.vz * nzn);
            if (impact > 0) {
              s.vx += nxn * impact * 1.3;
              s.vz += nzn * impact * 1.3;
              s.speed *= impact > 6 ? -0.25 : 0.6;
              if (impact > 5) {
                s.shake = Math.min(1, impact / 14);
                sfx.crash();
              }
            }
          }
        }
      }
      // ---- island wall ----
      const rr = Math.hypot(nx, nz);
      if (rr > DRIVE_RADIUS) {
        const ux = nx / rr;
        const uz = nz / rr;
        nx = ux * DRIVE_RADIUS;
        nz = uz * DRIVE_RADIUS;
        const out = s.vx * ux + s.vz * uz;
        if (out > 0) {
          s.vx -= ux * out * 1.5;
          s.vz -= uz * out * 1.5;
          s.speed *= 0.4;
          if (out > 6) {
            s.shake = Math.min(1, out / 14);
            sfx.crash();
          }
        }
      }
      s.x = nx;
      s.z = nz;

      // ---- ramps & gravity ----
      const gh = groundHeight(s.x, s.z);
      if (s.grounded) {
        const climb = (gh - s.y) / dt;
        if (gh >= s.y - 0.05) {
          s.vy = Math.min(climb, 12);
          s.y = gh;
        } else {
          // ground fell away (end of a ramp): we're airborne with our climb speed
          s.grounded = false;
        }
      } else {
        s.vy -= GRAVITY * dt;
        s.y += s.vy * dt;
        if (s.y <= gh) {
          if (s.vy < -6) {
            s.shake = Math.min(0.8, -s.vy / 25);
            sfx.land();
            for (let p = 0; p < 6; p++) spawnPuff(s.x, 0.3, s.z, 1.4);
          }
          s.y = gh;
          s.vy = 0;
          s.grounded = true;
        }
      }
    }

    const carSpeed = Math.hypot(s.vx, s.vz);

    // ---- coins (3D distance so floating ones need a jump) ----
    COINS.forEach((c, i) => {
      const cy = c.y ?? 1;
      if (Math.hypot(s.x - c.at[0], s.z - c.at[1]) < 2.1 && Math.abs(s.y + 0.8 - cy) < 1.7 && gameStore.collect(i)) {
        if (gameStore.get().won) sfx.win();
        else sfx.coin();
      }
    });

    // ---- stations ----
    let near: (typeof STATIONS)[number] | null = null;
    let best = Infinity;
    for (const st of STATIONS) {
      const d = Math.hypot(s.x - st.at[0], s.z - st.at[1]);
      if (d < st.radius && d < best) {
        best = d;
        near = st;
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

    // ---- dust ----
    s.puffTimer -= dtAll;
    const spinning = s.grounded && throttle > 0.5 && Math.abs(s.speed) < 9;
    if (s.puffTimer <= 0 && s.grounded && (drifting || spinning || (boost && carSpeed > 14))) {
      s.puffTimer = 0.04;
      const bx = Math.sin(s.yaw);
      const bz = Math.cos(s.yaw);
      for (const side of [-1, 1]) {
        spawnPuff(s.x - bx * 1.3 + bz * 0.75 * side, 0.25, s.z - bz * 1.3 - bx * 0.75 * side, drifting ? 1.2 : 0.8);
      }
    }

    // ---- visuals ----
    // drive the physics body so it shoves crates, pins and dominoes
    rb.current?.setNextKinematicTranslation({ x: s.x, y: s.y, z: s.z });
    rb.current?.setNextKinematicRotation(quat.setFromEuler(euler.set(0, s.yaw, 0)));
    playerPos.set(s.x, s.y, s.z);
    if (body.current) {
      const accel = s.grounded ? throttle * 0.04 : 0;
      const airPitch = s.grounded ? 0 : THREE.MathUtils.clamp(-s.vy * 0.03, -0.4, 0.4);
      const rampPitch = s.grounded ? -Math.atan2(s.vy, Math.max(Math.abs(s.speed), 1)) : 0;
      body.current.rotation.x = THREE.MathUtils.damp(body.current.rotation.x, -accel + airPitch + rampPitch, 8, dtAll);
      body.current.rotation.z = THREE.MathUtils.damp(body.current.rotation.z, -s.steer * THREE.MathUtils.clamp(s.speed / MAX, -1, 1) * 0.07, 6, dtAll);
      body.current.position.y = Math.sin(state.clock.elapsedTime * 30) * 0.008 * Math.min(carSpeed / 5, 1);
    }
    s.wheelRot += (s.speed * dtAll) / 0.42;
    wheels.current.forEach((w) => {
      if (w) w.rotation.x = s.wheelRot;
    });
    frontPivots.current.forEach((p) => {
      if (p) p.rotation.y = s.steer * 0.5;
    });
    if (brakeMat.current) {
      const braking = (throttle < 0 && s.speed > 0.5) || handbrake;
      brakeMat.current.emissiveIntensity = THREE.MathUtils.damp(brakeMat.current.emissiveIntensity, braking ? 4 : 0.8, 14, dtAll);
    }
    if (hud.speed) hud.speed.textContent = String(Math.round(Math.abs(s.speed) * 7));

    // ---- camera ----
    playerYaw.value = s.yaw;
    const cam = state.camera as THREE.PerspectiveCamera;
    const z = view.zoom;
    const fwd = Math.max(s.speed, 0);
    let targetFov = 50;
    if (view.mode === 0) {
      // chase: low behind the car, looking ahead so you see where you're going
      s.camYaw += Math.atan2(Math.sin(s.yaw - s.camYaw), Math.cos(s.yaw - s.camYaw)) * (1 - Math.exp(-2.6 * dtAll));
      const back = (8.2 + fwd * 0.12) * z;
      const tx = s.x - Math.sin(s.camYaw) * back;
      const tz = s.z - Math.cos(s.camYaw) * back;
      cam.position.x = THREE.MathUtils.damp(cam.position.x, tx, 5, dtAll);
      cam.position.y = THREE.MathUtils.damp(cam.position.y, 3.4 * z + s.y * 0.7 + 0.6, 4, dtAll);
      cam.position.z = THREE.MathUtils.damp(cam.position.z, tz, 5, dtAll);
      look.set(s.x + Math.sin(s.camYaw) * 7, s.y * 0.8 + 1.3, s.z + Math.cos(s.camYaw) * 7);
      targetFov = 58 + fwd * 0.45 + (boost ? 6 : 0);
    } else if (view.mode === 1) {
      // top-down follow: fixed angle, never rotates with the car
      const ahead = THREE.MathUtils.clamp(s.speed / MAX, -1, 1) * 2.5;
      const lx = s.x + Math.sin(s.yaw) * ahead;
      const lz = s.z + Math.cos(s.yaw) * ahead;
      cam.position.x = THREE.MathUtils.damp(cam.position.x, lx, 4, dtAll);
      cam.position.y = THREE.MathUtils.damp(cam.position.y, 14 * z + s.y * 0.5, 4, dtAll);
      cam.position.z = THREE.MathUtils.damp(cam.position.z, lz + 13 * z, 4, dtAll);
      look.set(lx, s.y * 0.5 + 0.6, lz);
      targetFov = 48;
    } else {
      // overview: the whole island, still drivable
      cam.position.x = THREE.MathUtils.damp(cam.position.x, s.x * 0.25, 2, dtAll);
      cam.position.y = THREE.MathUtils.damp(cam.position.y, 52 * z, 2, dtAll);
      cam.position.z = THREE.MathUtils.damp(cam.position.z, 46 * z + s.z * 0.25, 2, dtAll);
      look.set(s.x * 0.25, 0, s.z * 0.25 - 2);
      targetFov = 50;
    }
    if (s.shake > 0) {
      cam.position.x += (Math.random() - 0.5) * s.shake * 0.6;
      cam.position.y += (Math.random() - 0.5) * s.shake * 0.6;
      s.shake = Math.max(0, s.shake - dtAll * 2.5);
    }
    cam.lookAt(look);
    s.fov = THREE.MathUtils.damp(s.fov, targetFov, 3, dtAll);
    if (Math.abs(cam.fov - s.fov) > 0.05) {
      cam.fov = s.fov;
      cam.updateProjectionMatrix();
    }
  });

  const wheelPos: [number, number, number][] = [
    [-0.9, 0.44, 1.2],
    [0.9, 0.44, 1.2],
    [-0.9, 0.44, -1.2],
    [0.9, 0.44, -1.2],
  ];
  const trim = '#11141c';

  return (
    <RigidBody
      ref={rb}
      type="kinematicPosition"
      colliders={false}
      position={[START.x, 0, START.z]}
      rotation={[0, START.yaw, 0]}
      onCollisionEnter={({ other }) => {
        // bump sound + a little drag when we hit something loose
        if (!other.rigidBody?.isDynamic()) return;
        const now = performance.now();
        if (now - lastBonk.current > 90) {
          lastBonk.current = now;
          sfx.bonk();
        }
        sim.current.speed *= 0.93;
      }}
    >
      <CuboidCollider args={[0.95, 0.45, 2]} position={[0, 0.8, 0]} />
    <group ref={root}>
      <group ref={body}>
        {/* glossy body */}
        <RoundedBox args={[1.86, 0.62, 3.9]} radius={0.24} smoothness={5} position={[0, 0.78, 0]} castShadow>
          <meshPhysicalMaterial color={paint} metalness={0.45} roughness={0.22} clearcoat={1} clearcoatRoughness={0.04} envMapIntensity={1.4} />
        </RoundedBox>
        {/* cabin: glass greenhouse with a painted roof */}
        <RoundedBox args={[1.56, 0.58, 2.0]} radius={0.22} smoothness={5} position={[0, 1.3, -0.3]} castShadow>
          <meshPhysicalMaterial color="#0c1a2e" metalness={0.2} roughness={0.04} clearcoat={1} envMapIntensity={2} />
        </RoundedBox>
        <RoundedBox args={[1.5, 0.1, 1.6]} radius={0.05} position={[0, 1.6, -0.4]}>
          <meshPhysicalMaterial color={paint} metalness={0.45} roughness={0.22} clearcoat={1} />
        </RoundedBox>
        {/* white racing stripes */}
        {[-0.2, 0.2].map((x) => (
          <mesh key={x} position={[x, 1.095, 1.05]}>
            <boxGeometry args={[0.14, 0.01, 1.6]} />
            <meshStandardMaterial color="#f5f7fb" />
          </mesh>
        ))}
        {/* bumpers */}
        <RoundedBox args={[1.9, 0.26, 0.3]} radius={0.1} position={[0, 0.5, 1.92]}>
          <meshStandardMaterial color={trim} roughness={0.5} />
        </RoundedBox>
        <RoundedBox args={[1.9, 0.26, 0.3]} radius={0.1} position={[0, 0.5, -1.92]}>
          <meshStandardMaterial color={trim} roughness={0.5} />
        </RoundedBox>
        {/* grille */}
        <mesh position={[0, 0.72, 1.96]}>
          <boxGeometry args={[0.8, 0.16, 0.02]} />
          <meshStandardMaterial color={trim} />
        </mesh>
        {/* mirrors */}
        {[-1, 1].map((side) => (
          <RoundedBox key={side} args={[0.22, 0.14, 0.24]} radius={0.05} position={[side * 0.98, 1.22, 0.55]}>
            <meshPhysicalMaterial color={paint} clearcoat={1} roughness={0.25} />
          </RoundedBox>
        ))}
        {/* spoiler */}
        <RoundedBox args={[1.7, 0.07, 0.4]} radius={0.03} position={[0, 1.3, -1.78]} castShadow>
          <meshStandardMaterial color={trim} />
        </RoundedBox>
        {[-0.6, 0.6].map((x) => (
          <mesh key={x} position={[x, 1.17, -1.74]}>
            <boxGeometry args={[0.07, 0.22, 0.12]} />
            <meshStandardMaterial color={trim} />
          </mesh>
        ))}
        {/* headlights */}
        {[-0.62, 0.62].map((x) => (
          <RoundedBox key={x} args={[0.42, 0.14, 0.06]} radius={0.04} position={[x, 0.86, 1.94]}>
            <meshStandardMaterial color="#ffffff" emissive="#fff6dc" emissiveIntensity={2.2} />
          </RoundedBox>
        ))}
        {/* brake lights */}
        <mesh position={[0, 0.88, -1.955]}>
          <boxGeometry args={[1.4, 0.1, 0.03]} />
          <meshStandardMaterial ref={brakeMat} color="#ff2a3d" emissive="#ff2a3d" emissiveIntensity={0.8} />
        </mesh>
        <spotLight ref={spot} position={[0, 0.9, 1.9]} angle={0.5} penumbra={0.6} intensity={12} distance={18} color="#fff1cc" />
        <object3D ref={spotTarget} position={[0, 0, 8]} />
      </group>

      {/* wheels: front ones sit in steering pivots */}
      {wheelPos.map((p, i) => {
        const wheel = (
          <group
            ref={(el) => {
              wheels.current[i] = el;
            }}
          >
            <mesh rotation-z={Math.PI / 2} castShadow>
              <cylinderGeometry args={[0.44, 0.44, 0.34, 28]} />
              <meshStandardMaterial color="#16181e" roughness={0.85} />
            </mesh>
            <mesh rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[0.27, 0.27, 0.36, 10]} />
              <meshPhysicalMaterial color="#e6e9f0" metalness={1} roughness={0.15} clearcoat={1} />
            </mesh>
            <mesh rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[0.08, 0.08, 0.38, 8]} />
              <meshStandardMaterial color={paint} />
            </mesh>
          </group>
        );
        return i < 2 ? (
          <group
            key={i}
            position={p}
            ref={(el) => {
              frontPivots.current[i] = el;
            }}
          >
            {wheel}
          </group>
        ) : (
          <group key={i} position={p}>
            {wheel}
          </group>
        );
      })}
    </group>
    </RigidBody>
  );
}
