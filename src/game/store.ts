import { useSyncExternalStore } from 'react';
import { COINS, type StationId } from './layout';

/** Game state the React HUD needs. Changes only on events, never per frame. */
export interface GameState {
  near: StationId | null;
  open: StationId | null;
  /** stations whose panel has been opened at least once (tour progress) */
  visited: StationId[];
  collected: number[];
  lastCoin: { label: string; at: number } | null;
  won: boolean;
  jumped: boolean;
  cratesDown: boolean;
  /** set once every tour objective is done */
  tourDone: boolean;
  /** bumped to rebuild all physics props (reset) */
  resetKey: number;
  /** short message shown in the HUD (e.g. "Nice jump!") */
  toast: { text: string; at: number } | null;
}

const initial: GameState = {
  near: null,
  open: null,
  visited: [],
  collected: [],
  lastCoin: null,
  won: false,
  jumped: false,
  cratesDown: false,
  tourDone: false,
  resetKey: 0,
  toast: null,
};
let state: GameState = initial;
const listeners = new Set<() => void>();

function set(patch: Partial<GameState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export const gameStore = {
  get: () => state,
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
  setNear(near: StationId | null) {
    if (near !== state.near) set({ near });
  },
  open(open: StationId | null) {
    if (open === state.open) return;
    const visited = open && !state.visited.includes(open) ? [...state.visited, open] : state.visited;
    set({ open, visited });
  },
  collect(index: number) {
    if (state.collected.includes(index)) return false;
    const collected = [...state.collected, index];
    set({ collected, lastCoin: { label: COINS[index].label, at: performance.now() }, won: collected.length === COINS.length });
    return true;
  },
  markJump() {
    if (!state.jumped) set({ jumped: true, toast: { text: 'Nice jump!', at: performance.now() } });
  },
  markCratesDown() {
    if (!state.cratesDown) set({ cratesDown: true, toast: { text: 'Strike! Skill crates down', at: performance.now() } });
  },
  toast(text: string) {
    set({ toast: { text, at: performance.now() } });
  },
  finishTour() {
    if (!state.tourDone) set({ tourDone: true });
  },
  resetProps() {
    set({ resetKey: state.resetKey + 1, cratesDown: state.cratesDown });
  },
  reset() {
    state = initial;
    listeners.forEach((l) => l());
  },
};

export function useGame<T>(select: (s: GameState) => T): T {
  return useSyncExternalStore(gameStore.subscribe, () => select(gameStore.get()));
}
