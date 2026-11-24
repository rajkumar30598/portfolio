import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Shared, mutable motion state. Written by the scroll/mouse listeners and read
 * every frame by the three.js scene, so it lives outside React state on purpose
 * (no re-renders at 60fps).
 */
export const motion = {
  /** 0..1 progress through the whole page */
  progress: 0,
  /** smoothed scroll velocity (px per frame, signed) */
  velocity: 0,
  /** pointer in normalised device coords (-1..1) */
  pointer: { x: 0, y: 0 },
};

let lenis: Lenis | null = null;

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initSmoothScroll() {
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    motion.progress = max > 0 ? window.scrollY / max : 0;
  };

  const onPointer = (e: PointerEvent) => {
    motion.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    motion.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
  };
  window.addEventListener('pointermove', onPointer, { passive: true });

  if (prefersReducedMotion()) {
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('pointermove', onPointer);
    };
  }

  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.on('scroll', (l: Lenis) => {
    motion.velocity = l.velocity;
    updateProgress();
    ScrollTrigger.update();
  });
  const tick = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  updateProgress();

  return () => {
    gsap.ticker.remove(tick);
    lenis?.destroy();
    lenis = null;
    window.removeEventListener('pointermove', onPointer);
  };
}

export function scrollToId(href: string) {
  const el = document.querySelector<HTMLElement>(href);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.4, force: true });
  else el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

export function lockScroll(locked: boolean) {
  if (!lenis) return;
  if (locked) lenis.stop();
  else lenis.start();
}
