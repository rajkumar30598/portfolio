/** Positions of everything on the island (x, z in world units; y is up). */

export const ISLAND_RADIUS = 32;
/** the car bounces off an invisible wall at this radius */
export const DRIVE_RADIUS = 30;
export const RING_ROAD = { inner: 11, outer: 15 };

export type StationId = 'about' | 'experience' | 'project-0' | 'project-1' | 'project-2' | 'archive' | 'contact';

export interface Station {
  id: StationId;
  /** centre of the glowing pad the car parks on */
  at: [number, number];
  radius: number;
  prompt: string;
}

export const STATIONS: Station[] = [
  { id: 'about', at: [0, -17.5], radius: 2.8, prompt: 'Enter the house' },
  { id: 'experience', at: [15.5, -7], radius: 2.8, prompt: 'Visit the tower' },
  { id: 'project-0', at: [-18, -8], radius: 2, prompt: 'Play Rookwise' },
  { id: 'project-1', at: [-18, -3], radius: 2, prompt: 'Play AdFree Tube' },
  { id: 'project-2', at: [-18, 2], radius: 2, prompt: 'Play PDF Toolkit' },
  { id: 'archive', at: [-12, 12.5], radius: 2.6, prompt: 'Browse the archive' },
  { id: 'contact', at: [12.5, 12.5], radius: 2.6, prompt: 'Check the mailbox' },
];

/** where the buildings stand (used for drawing and collisions) */
export const PLACES = {
  house: [0, -23] as [number, number],
  tower: [21, -9] as [number, number],
  arcadeX: -22,
  cabinetsZ: [-8, -3, 2],
  kiosk: [-15.5, 16] as [number, number],
  mailbox: [16, 16] as [number, number],
};

/** Jump ramps: start point, direction (radians, 0 = +z), length, height, width. */
export interface Ramp {
  x: number;
  z: number;
  dir: number;
  length: number;
  height: number;
  width: number;
}
export const RAMPS: Ramp[] = [
  { x: 0, z: 6, dir: 0, length: 5, height: 1.7, width: 4.2 },
  { x: 6, z: 0, dir: Math.PI / 2, length: 5, height: 1.7, width: 4.2 },
];

/** Ground height at (x, z): 0 except on ramps. */
export function groundHeight(x: number, z: number) {
  let h = 0;
  for (const r of RAMPS) {
    const dx = x - r.x;
    const dz = z - r.z;
    const u = dx * Math.sin(r.dir) + dz * Math.cos(r.dir); // along the ramp
    const v = dx * Math.cos(r.dir) - dz * Math.sin(r.dir); // across it
    if (u >= 0 && u <= r.length && Math.abs(v) <= r.width / 2) h = Math.max(h, (u / r.length) * r.height);
  }
  return h;
}

export interface Circle {
  x: number;
  z: number;
  r: number;
}

/** Tech-stack coins (y > 1 means it floats above a ramp landing: jump for it). */
export const COINS: { label: string; at: [number, number]; y?: number }[] = [
  { label: 'JavaScript', at: [-13, 0] },
  { label: 'TypeScript', at: [11.3, 6.5] },
  { label: 'Angular', at: [-11.3, 6.5] },
  { label: 'React', at: [-11.3, -6.5] },
  { label: 'React Native', at: [0, -13] },
  { label: 'Next.js', at: [11.3, -6.5] },
  { label: 'RxJS', at: [0, 15.5], y: 3.6 },
  { label: 'Redux', at: [15.5, 0], y: 3.6 },
  { label: 'Firebase', at: [0, 25] },
  { label: 'WebSocket', at: [-21, -20] },
  { label: 'Tailwind', at: [21, -20] },
  { label: 'Expo', at: [6.5, 11.3] },
];

/** Traffic cones: a slalom in front of the start and a bowling triangle. */
export const CONES: [number, number][] = [
  ...[-6, -4, -2, 0, 2, 4, 6].map((x, i) => [x, -5 + (i % 2) * 1.6] as [number, number]),
  ...[
    [0, 0],
    [-0.7, 1.1],
    [0.7, 1.1],
    [-1.4, 2.2],
    [0, 2.2],
    [1.4, 2.2],
  ].map(([x, z]) => [x - 6, z - 0.5] as [number, number]),
];

export const START = { x: 0, z: 1.5, yaw: Math.PI };

// deterministic scatter of trees, kept clear of roads, buildings, ramps and coins
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const keepClear: [number, number, number][] = [
  [PLACES.house[0], PLACES.house[1], 7],
  [PLACES.tower[0], PLACES.tower[1], 6],
  [PLACES.arcadeX, -3, 8],
  [PLACES.kiosk[0], PLACES.kiosk[1], 5],
  [PLACES.mailbox[0], PLACES.mailbox[1], 5],
  [0, 18, 7],
  [18, 0, 7],
  ...STATIONS.map((s) => [s.at[0], s.at[1], 4] as [number, number, number]),
  ...COINS.map((c) => [c.at[0], c.at[1], 3] as [number, number, number]),
];

export const TREES: { x: number; z: number; s: number; kind: number }[] = (() => {
  const r = rng(77);
  const out: { x: number; z: number; s: number; kind: number }[] = [];
  let tries = 0;
  while (out.length < 46 && tries < 4000) {
    tries++;
    const a = r() * Math.PI * 2;
    const d = 17 + Math.sqrt(r()) * 13;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (d > RING_ROAD.inner - 1.5 && d < RING_ROAD.outer + 1.5) continue;
    if (keepClear.some(([cx, cz, cr]) => Math.hypot(x - cx, z - cz) < cr)) continue;
    if (out.some((t) => Math.hypot(x - t.x, z - t.z) < 2.6)) continue;
    out.push({ x, z, s: 0.9 + r() * 0.7, kind: r() < 0.5 ? 0 : 1 });
  }
  return out;
})();

export const COLLIDERS: Circle[] = [
  { x: PLACES.house[0], z: PLACES.house[1], r: 4.2 },
  { x: PLACES.tower[0], z: PLACES.tower[1], r: 3.1 },
  ...PLACES.cabinetsZ.map((z) => ({ x: PLACES.arcadeX, z, r: 1.3 })),
  { x: PLACES.kiosk[0], z: PLACES.kiosk[1], r: 1.5 },
  { x: PLACES.mailbox[0], z: PLACES.mailbox[1], r: 0.7 },
  ...TREES.map((t) => ({ x: t.x, z: t.z, r: 0.6 * t.s })),
];
