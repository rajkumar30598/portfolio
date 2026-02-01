import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/hooks/useScrollProgress';

gsap.registerPlugin(ScrollTrigger);

interface AnimatedTextProps {
  children: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  animation?: 'chars' | 'words' | 'lines';
  stagger?: number;
  duration?: number;
  delay?: number;
  once?: boolean;
}

export function AnimatedText({
  children,
  className = '',
  as: Component = 'span',
  animation = 'words',
  stagger = 0.08,
  duration = 0.6,
  delay = 0,
  once = true,
}: AnimatedTextProps) {
  const containerRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const container = containerRef.current;
    if (!container) return;

    const triggers: ScrollTrigger[] = [];

    const ctx = gsap.context(() => {
      let elements: Element[] = [];

      if (animation === 'chars') {
        const text = children;
        container.innerHTML = text
          .split('')
          .map((char) =>
            char === ' '
              ? '<span class="inline-block">&nbsp;</span>'
              : `<span class="inline-block overflow-hidden"><span class="char-inner inline-block">${char}</span></span>`
          )
          .join('');
        elements = Array.from(container.querySelectorAll('.char-inner'));
      } else if (animation === 'words') {
        const text = children;
        container.innerHTML = text
          .split(' ')
          .map(
            (word) =>
              `<span class="inline-block overflow-hidden mr-[0.25em]"><span class="word-inner inline-block">${word}</span></span>`
          )
          .join('');
        elements = Array.from(container.querySelectorAll('.word-inner'));
      }

      gsap.set(elements, { y: '100%', opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top 85%',
          once,
          onEnter: () => {
            tl.to(elements, {
              y: '0%',
              opacity: 1,
              duration,
              stagger,
              ease: 'expo.out',
              delay,
            });
          },
        },
      });

      if (tl.scrollTrigger) {
        triggers.push(tl.scrollTrigger);
      }
    }, container);

    return () => {
      triggers.forEach((st) => st.kill());
      ctx.revert();
    };
  }, [children, animation, stagger, duration, delay, once, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return <Component className={className}>{children}</Component>;
  }

  return (
    <Component
      ref={containerRef as React.RefObject<HTMLHeadingElement & HTMLParagraphElement & HTMLSpanElement>}
      className={className}
    >
      {children}
    </Component>
  );
}

interface FadeInTextProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function FadeInText({
  children,
  className = '',
  delay = 0,
  direction = 'up',
}: FadeInTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const element = ref.current;
    if (!element) return;

    const triggers: ScrollTrigger[] = [];

    const ctx = gsap.context(() => {
      const distance = 40;
      const x = direction === 'left' ? distance : direction === 'right' ? -distance : 0;
      const y = direction === 'up' ? distance : direction === 'down' ? -distance : 0;

      gsap.set(element, { x, y, opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: element,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            tl.to(element, {
              x: 0,
              y: 0,
              opacity: 1,
              duration: 0.6,
              ease: 'expo.out',
              delay,
            });
          },
        },
      });

      if (tl.scrollTrigger) {
        triggers.push(tl.scrollTrigger);
      }
    }, element);

    return () => {
      triggers.forEach((st) => st.kill());
      ctx.revert();
    };
  }, [delay, direction, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
