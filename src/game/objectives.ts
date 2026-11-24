import { COINS, CRATE_TOWER, RAMPS, STATIONS, type StationId } from './layout';
import type { GameState } from './store';

export interface Objective {
  id: string;
  label: string;
  done: (s: GameState) => boolean;
  /** e.g. "2/3" */
  progress?: (s: GameState) => string;
  /** where the guide arrow should point, given the car's position */
  target: (s: GameState, x: number, z: number) => [number, number] | null;
}

const at = (id: StationId) => STATIONS.find((s) => s.id === id)!.at;
const projects: StationId[] = ['project-0', 'project-1', 'project-2'];

export const OBJECTIVES: Objective[] = [
  { id: 'about', label: 'Visit the About house', done: (s) => s.visited.includes('about'), target: () => at('about') },
  { id: 'experience', label: 'Climb the Experience tower', done: (s) => s.visited.includes('experience'), target: () => at('experience') },
  {
    id: 'apps',
    label: 'Open my 3 apps',
    done: (s) => projects.every((p) => s.visited.includes(p)),
    progress: (s) => `${projects.filter((p) => s.visited.includes(p)).length}/3`,
    target: (s) => {
      const next = projects.find((p) => !s.visited.includes(p));
      return next ? at(next) : null;
    },
  },
  {
    id: 'coins',
    label: 'Collect the skill coins',
    done: (s) => s.collected.length === COINS.length,
    progress: (s) => `${s.collected.length}/${COINS.length}`,
    target: (s, x, z) => {
      let best: [number, number] | null = null;
      let bd = Infinity;
      COINS.forEach((c, i) => {
        if (s.collected.includes(i)) return;
        const d = Math.hypot(c.at[0] - x, c.at[1] - z);
        if (d < bd) {
          bd = d;
          best = c.at;
        }
      });
      return best;
    },
  },
  { id: 'crates', label: 'Knock down the skill crates', done: (s) => s.cratesDown, target: () => [CRATE_TOWER.x, CRATE_TOWER.z + 3] },
  { id: 'jump', label: 'Land a ramp jump', done: (s) => s.jumped, target: () => [RAMPS[0].x, RAMPS[0].z - 3] },
  { id: 'contact', label: 'Drop by the mailbox', done: (s) => s.visited.includes('contact'), target: () => at('contact') },
];

export const nextObjective = (s: GameState) => OBJECTIVES.find((o) => !o.done(s)) ?? null;
export const allDone = (s: GameState) => OBJECTIVES.every((o) => o.done(s));
