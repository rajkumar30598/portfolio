import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTheme } from '@/lib/theme';
import { input } from './input';
import { COINS, COLLIDERS, DRIVE_RADIUS, START, STATIONS, groundHeight } from './layout';
import { cones, hud, playerPos, resetCones, spawnPuff } from './runtime';
import { gameStore } from './store';
import { sfx } from './sound';

const CAR_R = 1.15; // collision radius
const GRAVITY = 26;
const MAX = 17;
const BOOST = 26;
const REVERSE = 8;

const look = new THREE.Vector3();

export function Car() {
  const theme = useTheme();
  const paint = `rgb(${theme.brand.join(',')})`;
  const accent = `rgb(${theme.brand2.join(',')})`;

  const root = useRef<THREE.Group>(null);
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
      resetCones();
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

    // ---- cones ----
    const carSpeed = Math.hypot(s.vx, s.vz);
    for (const c of cones) {
      const d = Math.hypot(c.x - s.x, c.z - s.z);
      if (d < 1.5 && c.y < 1.2 && s.y < 1.2 && carSpeed > 1) {
        const ux = (c.x - s.x) / (d || 1);
        const uz = (c.z - s.z) / (d || 1);
        c.vx = s.vx * 0.9 + ux * 4;
        c.vz = s.vz * 0.9 + uz * 4;
        c.vy = 3 + carSpeed * 0.35;
        c.spin = (Math.random() - 0.5) * 18;
        c.x += ux * 0.4;
        c.z += uz * 0.4;
        sfx.bonk();
      }
    }

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
    g.position.set(s.x, s.y, s.z);
    g.rotation.y = s.yaw;
    playerPos.copy(g.position);
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

    // ---- chase camera ----
    s.camYaw = s.camYaw + Math.atan2(Math.sin(s.yaw - s.camYaw), Math.cos(s.yaw - s.camYaw)) * (1 - Math.exp(-3 * dtAll));
    const back = 9 + Math.max(s.speed, 0) * 0.12;
    const cam = state.camera as THREE.PerspectiveCamera;
    const tx = s.x - Math.sin(s.camYaw) * back;
    const tz = s.z - Math.cos(s.camYaw) * back;
    const ty = s.y * 0.6 + 4.6;
    cam.position.x = THREE.MathUtils.damp(cam.position.x, tx, 5, dtAll);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, ty, 4, dtAll);
    cam.position.z = THREE.MathUtils.damp(cam.position.z, tz, 5, dtAll);
    if (s.shake > 0) {
      cam.position.x += (Math.random() - 0.5) * s.shake * 0.6;
      cam.position.y += (Math.random() - 0.5) * s.shake * 0.6;
      s.shake = Math.max(0, s.shake - dtAll * 2.5);
    }
    look.set(s.x + Math.sin(s.yaw) * 4, s.y * 0.8 + 1, s.z + Math.cos(s.yaw) * 4);
    cam.lookAt(look);
    s.fov = THREE.MathUtils.damp(s.fov, 55 + Math.max(s.speed, 0) * 0.55 + (boost ? 6 : 0), 3, dtAll);
    if (Math.abs(cam.fov - s.fov) > 0.05) {
      cam.fov = s.fov;
      cam.updateProjectionMatrix();
    }
  });

  const wheelPos: [number, number, number][] = [
    [-0.85, 0.42, 1.15],
    [0.85, 0.42, 1.15],
    [-0.85, 0.42, -1.15],
    [0.85, 0.42, -1.15],
  ];

  return (
    <group ref={root} position={[START.x, 0, START.z]} rotation-y={START.yaw}>
      <group ref={body}>
        {/* chassis */}
        <mesh position={[0, 0.72, 0]} castShadow>
          <boxGeometry args={[1.7, 0.5, 3.2]} />
          <meshStandardMaterial color={paint} roughness={0.35} metalness={0.25} />
        </mesh>
        {/* rounded nose and tail */}
        <mesh position={[0, 0.72, 1.6]} rotation-z={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.25, 0.25, 1.7, 16]} />
          <meshStandardMaterial color={paint} roughness={0.35} metalness={0.25} />
        </mesh>
        <mesh position={[0, 0.72, -1.6]} rotation-z={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.25, 0.25, 1.7, 16]} />
          <meshStandardMaterial color={paint} roughness={0.35} metalness={0.25} />
        </mesh>
        {/* cabin with dark glass */}
        <mesh position={[0, 1.22, -0.25]} castShadow>
          <boxGeometry args={[1.42, 0.55, 1.7]} />
          <meshStandardMaterial color="#111520" roughness={0.1} metalness={0.7} />
        </mesh>
        <mesh position={[0, 1.52, -0.25]}>
          <boxGeometry args={[1.46, 0.06, 1.74]} />
          <meshStandardMaterial color={paint} roughness={0.35} />
        </mesh>
        {/* racing stripe */}
        <mesh position={[0, 0.975, 0.9]}>
          <boxGeometry args={[0.36, 0.02, 1.4]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.3} />
        </mesh>
        {/* spoiler */}
        <mesh position={[0, 1.15, -1.55]} castShadow>
          <boxGeometry args={[1.6, 0.07, 0.35]} />
          <meshStandardMaterial color="#14161d" />
        </mesh>
        {[-0.6, 0.6].map((x) => (
          <mesh key={x} position={[x, 1.02, -1.55]}>
            <boxGeometry args={[0.07, 0.25, 0.12]} />
            <meshStandardMaterial color="#14161d" />
          </mesh>
        ))}
        {/* headlights */}
        {[-0.55, 0.55].map((x) => (
          <mesh key={x} position={[x, 0.8, 1.83]}>
            <boxGeometry args={[0.38, 0.14, 0.05]} />
            <meshStandardMaterial color="#fffbe6" emissive="#fff3c4" emissiveIntensity={3} />
          </mesh>
        ))}
        {/* brake lights */}
        <mesh position={[0, 0.82, -1.84]}>
          <boxGeometry args={[1.3, 0.1, 0.04]} />
          <meshStandardMaterial ref={brakeMat} color="#ff2a3d" emissive="#ff2a3d" emissiveIntensity={0.8} />
        </mesh>
        <spotLight ref={spot} position={[0, 0.9, 1.7]} angle={0.5} penumbra={0.6} intensity={40} distance={22} color="#fff1cc" />
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
              <cylinderGeometry args={[0.42, 0.42, 0.32, 20]} />
              <meshStandardMaterial color="#15161b" roughness={0.9} />
            </mesh>
            <mesh rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[0.22, 0.22, 0.34, 6]} />
              <meshStandardMaterial color="#c9ccd6" metalness={0.8} roughness={0.3} />
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

      {/* soft glow under the car so it's easy to spot */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <planeGeometry args={[2.6, 4.2]} />
        <meshBasicMaterial color={paint} transparent opacity={0.12} depthWrite={false} />
      </mesh>
    </group>
  );
}
