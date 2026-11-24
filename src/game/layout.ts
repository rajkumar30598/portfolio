/** Positions of everything on the island (x, z in world units; y is up). */

export const ISLAND_RADIUS = 20;
/** the player is kept inside this radius */
export const WALK_RADIUS = 18.6;

export type StationId = 'about' | 'experience' | 'project-0' | 'project-1' | 'project-2' | 'archive' | 'contact';

export interface Station {
  id: StationId;
  /** where the player stands to interact */
  at: [number, number];
  radius: number;
  prompt: string;
}

export const STATIONS: Station[] = [
  { id: 'about', at: [0, -9.6], radius: 2.6, prompt: 'Enter the house' },
  { id: 'experience', at: [10, -5], radius: 2.6, prompt: 'Visit the tower' },
  { id: 'project-0', at: [-10.6, -8], radius: 1.7, prompt: 'Play Rookwise' },
  { id: 'project-1', at: [-10.6, -4.5], radius: 1.7, prompt: 'Play AdFree Tube' },
  { id: 'project-2', at: [-10.6, -1], radius: 1.7, prompt: 'Play PDF Toolkit' },
  { id: 'archive', at: [-7.6, 7.4], radius: 2.2, prompt: 'Browse the archive' },
  { id: 'contact', at: [8.4, 7.6], radius: 2.2, prompt: 'Check the mailbox' },
];

/** where the buildings stand (used for drawing and collisions) */
export const PLACES = {
  house: [0, -14] as [number, number],
  tower: [13.4, -5] as [number, number],
  arcadeX: -13,
  cabinetsZ: [-8, -4.5, -1],
  kiosk: [-9.4, 9.2] as [number, number],
  mailbox: [9.8, 9.2] as [number, number],
};

export interface Circle {
  x: number;
  z: number;
  r: number;
}

/** Tech-stack coins to collect (label + position). */
export const COINS: { label: string; at: [number, number] }[] = [
  { label: 'JavaScript', at: [4, 4] },
  { label: 'TypeScript', at: [-4, 3] },
  { label: 'Angular', at: [6, -8] },
  { label: 'React', at: [-5.5, -9] },
  { label: 'React Native', at: [0, -5] },
  { label: 'Next.js', at: [16, 2] },
  { label: 'RxJS', at: [-16, 3] },
  { label: 'Redux', at: [3, 15] },
  { label: 'Firebase', at: [-3, 16] },
  { label: 'WebSocket', at: [11, -13] },
  { label: 'Tailwind', at: [-11, -13.5] },
  { label: 'Expo', at: [0, 10] },
];

// deterministic scatter of trees around the rim, kept clear of buildings and coins
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
  [PLACES.house[0], PLACES.house[1], 6],
  [PLACES.tower[0], PLACES.tower[1], 5],
  [PLACES.arcadeX, -4.5, 6],
  [PLACES.kiosk[0], PLACES.kiosk[1], 4],
  [PLACES.mailbox[0], PLACES.mailbox[1], 4],
  [0, 0, 6],
  ...STATIONS.map((s) => [s.at[0], s.at[1], 3] as [number, number, number]),
  ...COINS.map((c) => [c.at[0], c.at[1], 2.2] as [number, number, number]),
];

export const TREES: { x: number; z: number; s: number; kind: number }[] = (() => {
  const r = rng(77);
  const out: { x: number; z: number; s: number; kind: number }[] = [];
  let tries = 0;
  while (out.length < 34 && tries < 2000) {
    tries++;
    const a = r() * Math.PI * 2;
    const d = 9 + Math.sqrt(r()) * 9.5;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (keepClear.some(([cx, cz, cr]) => Math.hypot(x - cx, z - cz) < cr)) continue;
    if (out.some((t) => Math.hypot(x - t.x, z - t.z) < 2.2)) continue;
    out.push({ x, z, s: 0.8 + r() * 0.6, kind: r() < 0.5 ? 0 : 1 });
  }
  return out;
})();

export const COLLIDERS: Circle[] = [
  { x: PLACES.house[0], z: PLACES.house[1], r: 3.9 },
  { x: PLACES.tower[0], z: PLACES.tower[1], r: 2.6 },
  ...PLACES.cabinetsZ.map((z) => ({ x: PLACES.arcadeX, z, r: 1.15 })),
  { x: PLACES.kiosk[0], z: PLACES.kiosk[1], r: 1.3 },
  { x: PLACES.mailbox[0], z: PLACES.mailbox[1], r: 0.6 },
  ...TREES.map((t) => ({ x: t.x, z: t.z, r: 0.55 * t.s })),
];
