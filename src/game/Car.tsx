import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { CuboidCollider, RigidBody, useBeforePhysicsStep, useRapier, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { input } from './input';
import { COINS, START, STATIONS } from './layout';
import { allDone } from './objectives';
import { hud, playerPos, playerYaw, spawnPuff, view } from './runtime';
import { gameStore } from './store';
import { setEngine, sfx } from './sound';

/* ---------- tuning ---------- */
const ENGINE = 34; // engine force per driven wheel
const BOOST = 1.6;
const MAX_SPEED = 20; // m/s (~ 72 km/h on the dial below)
const MAX_BOOST_SPEED = 28;
const MAX_REVERSE = 8;
const BRAKE = 0.9;
const MAX_STEER = 0.55;
const WHEEL_RADIUS = 0.42;
const REST = 0.32;

/** Wheel mount points in chassis space (+z is forward). */
const WHEELS: { pos: [number, number, number]; front: boolean }[] = [
  { pos: [-0.88, -0.12, 1.15], front: true },
  { pos: [0.88, -0.12, 1.15], front: true },
  { pos: [-0.88, -0.12, -1.15], front: false },
  { pos: [0.88, -0.12, -1.15], front: false },
];

const PAINT = '#d9603d';
const CREAM = '#f6ead8';
const INK = '#1b1714';

const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();
const fwd = new THREE.Vector3();
const up = new THREE.Vector3();
const look = new THREE.Vector3();
const camGoal = new THREE.Vector3();

export function Car() {
  const { world } = useRapier();
  const body = useRef<RapierRigidBody>(null);
  const controller = useRef<ReturnType<typeof world.createVehicleController> | null>(null);
  const wheelRefs = useRef<(THREE.Group | null)[]>([]);
  const spinRefs = useRef<(THREE.Group | null)[]>([]);
  const brakeMat = useRef<THREE.MeshStandardMaterial>(null);
  const sim = useRef({
    steer: 0,
    speed: 0,
    airTime: 0,
    upsideDown: 0,
    camYaw: START.yaw,
    shake: 0,
    puffTimer: 0,
    lastBonk: 0,
    intro: 0,
  });

  // build the ray-cast vehicle on the chassis body
  useEffect(() => {
    const chassis = body.current;
    if (!chassis) return;
    const c = world.createVehicleController(chassis);
    c.indexUpAxis = 1;
    c.setIndexForwardAxis = 2;
    WHEELS.forEach((w, i) => {
      c.addWheel({ x: w.pos[0], y: w.pos[1], z: w.pos[2] }, { x: 0, y: -1, z: 0 }, { x: -1, y: 0, z: 0 }, REST, WHEEL_RADIUS);
      c.setWheelSuspensionStiffness(i, 26);
      c.setWheelSuspensionCompression(i, 2.4);
      c.setWheelSuspensionRelaxation(i, 2.0);
      c.setWheelMaxSuspensionTravel(i, 0.35);
      c.setWheelMaxSuspensionForce(i, 400);
      c.setWheelFrictionSlip(i, w.front ? 2.6 : 2.3);
      c.setWheelSideFrictionStiffness(i, 1);
    });
    controller.current = c;
    // dev-only hook for scripted testing (stripped from production builds)
    if (import.meta.env.DEV) {
      (window as unknown as { __car?: unknown }).__car = {
        place: (x: number, z: number, yaw: number) => placeCar(chassis, x, z, yaw),
        state: () => ({ p: chassis.translation(), v: chassis.linvel(), speed: c.currentVehicleSpeed() }),
      };
    }
    return () => {
      world.removeVehicleController(c);
      controller.current = null;
    };
  }, [world]);

  // forces go in before every physics step
  useBeforePhysicsStep((w) => {
    const c = controller.current;
    if (!c) return;
    const s = sim.current;
    const frozen = input.frozen;
    const throttle = frozen ? 0 : -input.z;
    const steerIn = frozen ? 0 : -input.x;
    const boost = !frozen && input.run;
    const handbrake = !frozen && input.handbrake;
    const speed = c.currentVehicleSpeed();
    s.speed = speed;

    let engine = 0;
    let brake = 0.04; // rolling resistance
    const top = boost ? MAX_BOOST_SPEED : MAX_SPEED;
    if (throttle > 0) {
      if (speed < -0.6) brake = BRAKE;
      else if (speed < top) engine = ENGINE * (boost ? BOOST : 1) * throttle;
    } else if (throttle < 0) {
      if (speed > 0.6) brake = BRAKE;
      else if (speed > -MAX_REVERSE) engine = -ENGINE * 0.6;
    }
    if (frozen) brake = 2;

    // steering eases in and gets gentler at speed
    s.steer += (steerIn - s.steer) * Math.min(1, w.timestep * 9);
    const steer = s.steer * MAX_STEER * (1 - Math.min(Math.abs(speed) / 45, 0.55));

    WHEELS.forEach((wh, i) => {
      if (wh.front) c.setWheelSteering(i, steer);
      c.setWheelEngineForce(i, wh.front ? 0 : engine);
      c.setWheelBrake(i, handbrake && !wh.front ? 1.6 : brake);
      // looser rear grip on the handbrake = drift
      c.setWheelFrictionSlip(i, wh.front ? 2.6 : handbrake ? 1.1 : 2.3);
    });
    c.updateVehicle(w.timestep);
  });

  useFrame((state, delta) => {
    const chassis = body.current;
    const c = controller.current;
    if (!chassis || !c) return;
    const s = sim.current;
    const dt = Math.min(delta, 0.1);

    const p = chassis.translation();
    const r = chassis.rotation();
    tmpQ.set(r.x, r.y, r.z, r.w);
    fwd.set(0, 0, 1).applyQuaternion(tmpQ);
    up.set(0, 1, 0).applyQuaternion(tmpQ);
    const yaw = Math.atan2(fwd.x, fwd.z);
    playerPos.set(p.x, p.y, p.z);
    playerYaw.value = yaw;
    const speed = s.speed;
    const absSpeed = Math.abs(speed);

    // ---- reset (R), falling off the board, or stuck upside down ----
    s.upsideDown = up.y < 0.25 && absSpeed < 2 ? s.upsideDown + dt : 0;
    if (input.reset || p.y < -12 || s.upsideDown > 1.2) {
      if (p.y < -12) gameStore.toast('Back on the board!');
      if (input.reset) gameStore.resetProps();
      input.reset = false;
      placeCar(chassis, START.x, START.z, START.yaw);
      s.upsideDown = 0;
      return;
    }

    // ---- wheels: suspension travel, spin and steering ----
    let grounded = 0;
    WHEELS.forEach((w, i) => {
      const g = wheelRefs.current[i];
      const spin = spinRefs.current[i];
      const susp = c.wheelSuspensionLength(i) ?? REST;
      if (g) {
        g.position.set(w.pos[0], w.pos[1] - susp, w.pos[2]);
        g.rotation.y = c.wheelSteering(i) ?? 0;
      }
      if (spin) spin.rotation.x = c.wheelRotation(i) ?? 0;
      if (c.wheelIsInContact(i)) grounded++;
    });

    // ---- airtime + landing ----
    if (grounded === 0) s.airTime += dt;
    else {
      if (s.airTime > 0.45) {
        gameStore.markJump();
        sfx.land();
        s.shake = Math.min(0.7, s.airTime * 0.6);
        for (let k = 0; k < 8; k++) spawnPuff(p.x, 0.3, p.z, 1.5);
      }
      s.airTime = 0;
    }

    // ---- dust when drifting, launching or boosting ----
    s.puffTimer -= dt;
    const v = chassis.linvel();
    const sideSlip = Math.abs(v.x * fwd.z - v.z * fwd.x);
    const launching = input.z < -0.5 && absSpeed < 6 && grounded > 2;
    if (s.puffTimer <= 0 && grounded > 2 && (sideSlip > 3 || launching || (input.run && absSpeed > 15))) {
      s.puffTimer = 0.05;
      for (const side of [-1, 1]) {
        spawnPuff(p.x - fwd.x * 1.3 + fwd.z * 0.8 * side, 0.25, p.z - fwd.z * 1.3 - fwd.x * 0.8 * side, sideSlip > 3 ? 1.3 : 0.8);
      }
    }

    // ---- brake lights + HUD + engine sound ----
    if (brakeMat.current) {
      const braking = (input.z > 0.5 && speed > 0.5) || input.handbrake;
      brakeMat.current.emissiveIntensity = THREE.MathUtils.damp(brakeMat.current.emissiveIntensity, braking ? 4 : 0.6, 14, dt);
    }
    if (hud.speed) hud.speed.textContent = String(Math.round(absSpeed * 3.6));
    setEngine(Math.min(absSpeed / MAX_BOOST_SPEED, 1), input.z < -0.3 && !input.frozen);

    // ---- coins ----
    COINS.forEach((coin, i) => {
      const cy = coin.y ?? 1;
      if (Math.hypot(p.x - coin.at[0], p.z - coin.at[1]) < 2.2 && Math.abs(p.y + 0.4 - cy) < 1.8 && gameStore.collect(i)) {
        if (gameStore.get().won) sfx.win();
        else sfx.coin();
      }
    });

    // ---- stations ----
    let near: (typeof STATIONS)[number] | null = null;
    let best = Infinity;
    for (const st of STATIONS) {
      const d = Math.hypot(p.x - st.at[0], p.z - st.at[1]);
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
    if (!gameStore.get().tourDone && allDone(gameStore.get())) {
      gameStore.finishTour();
      sfx.win();
    }

    // ---- camera ----
    const cam = state.camera as THREE.PerspectiveCamera;
    const z = view.zoom;
    s.intro = Math.min(1, s.intro + dt / 2.2); // opening fly-in
    const follow = 2 + (1 - s.intro) * -1.5;
    if (view.mode === 0) {
      // chase: eases behind the car's direction of travel
      s.camYaw += Math.atan2(Math.sin(yaw - s.camYaw), Math.cos(yaw - s.camYaw)) * (1 - Math.exp(-2.4 * dt));
      const back = (8.5 + Math.max(speed, 0) * 0.12) * z;
      camGoal.set(p.x - Math.sin(s.camYaw) * back, p.y + 3.6 * z + 0.6, p.z - Math.cos(s.camYaw) * back);
      look.set(p.x + Math.sin(s.camYaw) * 6, p.y + 1, p.z + Math.cos(s.camYaw) * 6);
    } else if (view.mode === 1) {
      camGoal.set(p.x, p.y + 15 * z, p.z + 13 * z);
      look.set(p.x, p.y, p.z);
    } else {
      camGoal.set(p.x * 0.25, 52 * z, 46 * z + p.z * 0.25);
      look.set(p.x * 0.25, 0, p.z * 0.25 - 2);
    }
    const k = 1 - Math.exp(-follow * 2.2 * dt);
    cam.position.lerp(camGoal, k);
    if (s.shake > 0) {
      cam.position.x += (Math.random() - 0.5) * s.shake * 0.5;
      cam.position.y += (Math.random() - 0.5) * s.shake * 0.5;
      s.shake = Math.max(0, s.shake - dt * 2.5);
    }
    cam.lookAt(look);
    const fov = view.mode === 0 ? 55 + absSpeed * 0.5 : 48;
    if (Math.abs(cam.fov - fov) > 0.05) {
      cam.fov = THREE.MathUtils.damp(cam.fov, fov, 3, dt);
      cam.updateProjectionMatrix();
    }
  });

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={[START.x, 1.4, START.z]}
      rotation={[0, START.yaw, 0]}
      canSleep={false}
      angularDamping={1.4}
      linearDamping={0.05}
      ccd
      onCollisionEnter={({ other }) => {
        const now = performance.now();
        if (now - sim.current.lastBonk < 120) return;
        sim.current.lastBonk = now;
        if (other.rigidBody?.isDynamic()) sfx.bonk();
        else if (Math.abs(sim.current.speed) > 7) {
          sfx.crash();
          sim.current.shake = 0.5;
        }
      }}
    >
      {/* chassis collider; low and wide so it doesn't tip easily */}
      <CuboidCollider args={[0.92, 0.32, 1.78]} position={[0, 0.12, 0]} density={1.6} friction={0.4} />

      {/* ---- toy car body ---- */}
      <group position={[0, 0.06, 0]}>
        <RoundedBox args={[1.9, 0.62, 3.6]} radius={0.28} smoothness={6} position={[0, 0.25, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={PAINT} roughness={0.42} />
        </RoundedBox>
        {/* cream cabin with dark windows */}
        <RoundedBox args={[1.62, 0.66, 1.75]} radius={0.3} smoothness={6} position={[0, 0.82, -0.25]} castShadow>
          <meshStandardMaterial color={CREAM} roughness={0.5} />
        </RoundedBox>
        <RoundedBox args={[1.66, 0.38, 1.8]} radius={0.16} smoothness={4} position={[0, 0.86, -0.25]}>
          <meshStandardMaterial color={INK} roughness={0.2} metalness={0.3} />
        </RoundedBox>
        {/* racing stripe */}
        <mesh position={[0, 0.565, 1.05]}>
          <boxGeometry args={[0.32, 0.02, 1.3]} />
          <meshStandardMaterial color={CREAM} />
        </mesh>
        {/* bumpers */}
        {[1.82, -1.82].map((zz) => (
          <RoundedBox key={zz} args={[1.96, 0.24, 0.26]} radius={0.1} position={[0, 0.02, zz]} castShadow>
            <meshStandardMaterial color={INK} roughness={0.6} />
          </RoundedBox>
        ))}
        {/* headlights */}
        {[-0.6, 0.6].map((x) => (
          <mesh key={x} position={[x, 0.32, 1.79]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.15, 0.15, 0.06, 20]} />
            <meshStandardMaterial color="#fffaf0" emissive="#ffe9c2" emissiveIntensity={1.6} />
          </mesh>
        ))}
        {/* brake lights */}
        <mesh position={[0, 0.34, -1.8]}>
          <boxGeometry args={[1.3, 0.1, 0.04]} />
          <meshStandardMaterial ref={brakeMat} color="#ff3b2f" emissive="#ff3b2f" emissiveIntensity={0.6} />
        </mesh>
        {/* little roof antenna with a cream ball */}
        <mesh position={[0.55, 1.35, -0.75]} rotation-z={-0.15}>
          <cylinderGeometry args={[0.02, 0.02, 0.55, 6]} />
          <meshStandardMaterial color={INK} />
        </mesh>
        <mesh position={[0.6, 1.62, -0.75]}>
          <sphereGeometry args={[0.08, 12, 10]} />
          <meshStandardMaterial color={PAINT} />
        </mesh>
      </group>

      {/* ---- wheels (positioned from the suspension each frame) ---- */}
      {WHEELS.map((w, i) => (
        <group
          key={i}
          position={[w.pos[0], w.pos[1] - REST, w.pos[2]]}
          ref={(el) => {
            wheelRefs.current[i] = el;
          }}
        >
          <group
            ref={(el) => {
              spinRefs.current[i] = el;
            }}
          >
            <mesh rotation-z={Math.PI / 2} castShadow>
              <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, 0.36, 24]} />
              <meshStandardMaterial color={INK} roughness={0.9} />
            </mesh>
            <mesh rotation-z={Math.PI / 2} position={[w.pos[0] < 0 ? -0.05 : 0.05, 0, 0]}>
              <cylinderGeometry args={[0.24, 0.24, 0.32, 16]} />
              <meshStandardMaterial color={CREAM} roughness={0.5} />
            </mesh>
            <mesh rotation-z={Math.PI / 2} position={[w.pos[0] < 0 ? -0.07 : 0.07, 0, 0]}>
              <boxGeometry args={[0.08, 0.4, 0.06]} />
              <meshStandardMaterial color={PAINT} />
            </mesh>
          </group>
        </group>
      ))}
    </RigidBody>
  );
}

function placeCar(chassis: RapierRigidBody, x: number, z: number, yaw: number) {
  tmpQ.setFromEuler(tmpE.set(0, yaw, 0));
  chassis.setTranslation({ x, y: 1.4, z }, true);
  chassis.setRotation({ x: tmpQ.x, y: tmpQ.y, z: tmpQ.z, w: tmpQ.w }, true);
  chassis.setLinvel({ x: 0, y: 0, z: 0 }, true);
  chassis.setAngvel({ x: 0, y: 0, z: 0 }, true);
}
