import { useSyncExternalStore } from 'react';
import { COINS, type StationId } from './layout';

/** Game state the React HUD needs. Changes only on events, never per frame. */
export interface GameState {
  near: StationId | null;
  open: StationId | null;
  collected: number[];
  lastCoin: { label: string; at: number } | null;
  won: boolean;
  /** bumped to rebuild all physics props (reset) */
  resetKey: number;
}

const initial: GameState = { near: null, open: null, collected: [], lastCoin: null, won: false, resetKey: 0 };
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
    return () => listeners.delete(cb);
  },
  setNear(near: StationId | null) {
    if (near !== state.near) set({ near });
  },
  open(open: StationId | null) {
    if (open !== state.open) set({ open });
  },
  collect(index: number) {
    if (state.collected.includes(index)) return false;
    const collected = [...state.collected, index];
    set({ collected, lastCoin: { label: COINS[index].label, at: performance.now() }, won: collected.length === COINS.length });
    return true;
  },
  resetProps() {
    set({ resetKey: state.resetKey + 1 });
  },
  reset() {
    state = initial;
    listeners.forEach((l) => l());
  },
};

export function useGame<T>(select: (s: GameState) => T): T {
  return useSyncExternalStore(gameStore.subscribe, () => select(gameStore.get()));
}
