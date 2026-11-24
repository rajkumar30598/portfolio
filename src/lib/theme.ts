import { useSyncExternalStore } from 'react';

export type Rgb = [number, number, number];

export interface Theme {
  id: string;
  name: string;
  /** main accent */
  brand: Rgb;
  /** secondary glow colour (orb body, gradients) */
  brand2: Rgb;
  /** tertiary highlight (orb rim shimmer, gradients) */
  brand3: Rgb;
  /** page background */
  ink: Rgb;
}

export const THEMES: Theme[] = [
  { id: 'lime', name: 'Lime', brand: [211, 233, 122], brand2: [124, 92, 255], brand3: [56, 217, 245], ink: [11, 11, 13] },
  { id: 'aurora', name: 'Aurora', brand: [190, 166, 255], brand2: [255, 92, 190], brand3: [94, 234, 212], ink: [11, 8, 20] },
  { id: 'ocean', name: 'Ocean', brand: [94, 226, 232], brand2: [59, 91, 255], brand3: [167, 243, 208], ink: [5, 11, 20] },
  { id: 'sunset', name: 'Sunset', brand: [255, 160, 92], brand2: [255, 70, 110], brand3: [255, 214, 102], ink: [16, 9, 9] },
];

const KEY = 'portfolio-theme';

function readSaved(): Theme {
  try {
    const id = localStorage.getItem(KEY);
    return THEMES.find((t) => t.id === id) ?? THEMES[0];
  } catch {
    return THEMES[0];
  }
}

let current: Theme = typeof window === 'undefined' ? THEMES[0] : readSaved();
const listeners = new Set<() => void>();

const triplet = (c: Rgb) => c.join(' ');

function paint(theme: Theme) {
  const root = document.documentElement.style;
  root.setProperty('--brand', triplet(theme.brand));
  root.setProperty('--brand-2', triplet(theme.brand2));
  root.setProperty('--brand-3', triplet(theme.brand3));
  root.setProperty('--ink', triplet(theme.ink));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', `rgb(${theme.ink.join(',')})`);
}

export function initTheme() {
  paint(current);
}

export function getTheme() {
  return current;
}

/** Switch theme; when supported, reveal it with a circle growing from (x, y). */
export function setTheme(id: string, origin?: { x: number; y: number }) {
  const next = THEMES.find((t) => t.id === id);
  if (!next || next.id === current.id) return;
  const apply = () => {
    current = next;
    paint(next);
    listeners.forEach((l) => l());
  };
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* storage unavailable: theme still applies for this visit */
  }

  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!doc.startViewTransition || reduced || !origin) {
    apply();
    return;
  }
  const r = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y));
  const t = doc.startViewTransition(apply);
  t.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${r}px at ${origin.x}px ${origin.y}px)`] },
      { duration: 700, easing: 'cubic-bezier(.7,0,.2,1)', pseudoElement: '::view-transition-new(root)' }
    );
  });
}

export function subscribeTheme(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useTheme() {
  return useSyncExternalStore(subscribeTheme, getTheme, () => THEMES[0]);
}
