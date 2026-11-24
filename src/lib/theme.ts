/**
 * The site's single colour theme: glossy blue.
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
  brand: [84, 166, 255],
  brand2: [111, 92, 255],
  brand3: [120, 232, 255],
  ink: [6, 10, 22],
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
