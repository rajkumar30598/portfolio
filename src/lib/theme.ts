/**
 * The site's single colour theme: near-black + warm cream with an electric-blue accent.
 * Colours are applied as CSS variables (rgb triplets) so Tailwind's `brand`
 * utilities and the three.js scenes read the same palette.
 */
export type Rgb = [number, number, number];

export interface Theme {
  /** main accent */
  brand: Rgb;
  /** secondary glow (gradients, particles) */
  brand2: Rgb;
  /** highlight (gradients, particles) */
  brand3: Rgb;
  /** page background */
  ink: Rgb;
}

export const THEME: Theme = {
  brand: [47, 91, 255], // electric blue accent
  brand2: [130, 150, 255],
  brand3: [214, 224, 255], // cool white (particle highlights)
  ink: [11, 11, 12], // near-black
};

const triplet = (c: Rgb) => c.join(' ');

export function initTheme() {
  const root = document.documentElement.style;
  root.setProperty('--brand', triplet(THEME.brand));
  root.setProperty('--brand-2', triplet(THEME.brand2));
  root.setProperty('--brand-3', triplet(THEME.brand3));
  root.setProperty('--ink', triplet(THEME.ink));
  try {
    localStorage.removeItem('portfolio-theme'); // from the old multi-theme switcher
  } catch {
    /* storage unavailable */
  }
}

export const getTheme = () => THEME;
export const useTheme = () => THEME;
