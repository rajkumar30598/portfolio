import { useEffect } from 'react';

const isFinePointer = () => window.matchMedia('(pointer: fine)').matches;

/* Feeds the pointer position into any .spotlight card under it (CSS draws the glow) */
export function useSpotlight() {
  useEffect(() => {
    if (!isFinePointer()) return;
    const move = (e: PointerEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('.spotlight');
      if (!card) return;
      const b = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - b.left}px`);
      card.style.setProperty('--my', `${e.clientY - b.top}px`);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);
}
