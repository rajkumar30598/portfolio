import * as THREE from 'three';
import { CONES, START } from './layout';

/** Car world position, written by the car every frame and read by the world (e.g. coin magnets). */
export const playerPos = new THREE.Vector3(START.x, 0, START.z);

/** Speedometer element; the car writes its text directly to avoid React re-renders every frame. */
export const hud = { speed: null as HTMLElement | null };

/** Knockable cones: simple rigid-ish bodies integrated by <Cones/>, kicked by the car. */
export interface ConeBody {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  rz: number;
  spin: number;
}
export const cones: ConeBody[] = CONES.map(([x, z]) => ({ x, y: 0, z, vx: 0, vy: 0, vz: 0, rx: 0, rz: 0, spin: 0 }));

export function resetCones() {
  CONES.forEach(([x, z], i) => Object.assign(cones[i], { x, y: 0, z, vx: 0, vy: 0, vz: 0, rx: 0, rz: 0, spin: 0 }));
}

/** Dust puff pool; the car spawns puffs and <Dust/> animates them. */
export interface Puff {
  x: number;
  y: number;
  z: number;
  vy: number;
  life: number;
  size: number;
}
export const puffs: Puff[] = Array.from({ length: 48 }, () => ({ x: 0, y: -10, z: 0, vy: 0, life: 0, size: 1 }));
let nextPuff = 0;
export function spawnPuff(x: number, y: number, z: number, size = 1) {
  const p = puffs[nextPuff];
  nextPuff = (nextPuff + 1) % puffs.length;
  p.x = x + (Math.random() - 0.5) * 0.4;
  p.y = y;
  p.z = z + (Math.random() - 0.5) * 0.4;
  p.vy = 0.6 + Math.random() * 0.6;
  p.life = 1;
  p.size = size;
}
