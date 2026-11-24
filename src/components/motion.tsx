import { useEffect, useRef, useState, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '@/lib/motion';

gsap.registerPlugin(ScrollTrigger);

const isFinePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

/* Custom cursor: a dot and a lagging ring that grows over interactive elements */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isFinePointer() || prefersReducedMotion()) return;
    const d = dot.current!;
    const r = ring.current!;
    document.documentElement.classList.add('has-custom-cursor');
    gsap.set([d, r], { xPercent: -50, yPercent: -50 });
    let shown = false;
    const dx = gsap.quickTo(d, 'x', { duration: 0.1, ease: 'power3' });
    const dy = gsap.quickTo(d, 'y', { duration: 0.1, ease: 'power3' });
    const rx = gsap.quickTo(r, 'x', { duration: 0.45, ease: 'power3' });
    const ry = gsap.quickTo(r, 'y', { duration: 0.45, ease: 'power3' });

    const move = (e: PointerEvent) => {
      if (!shown) {
        shown = true;
        gsap.set([d, r], { x: e.clientX, y: e.clientY });
        gsap.to([d, r], { opacity: 1, duration: 0.3 });
      }
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>('a, button, [data-cursor]');
      const text = target?.dataset.cursor ?? '';
      if (label.current) label.current.textContent = text;
      gsap.to(r, {
        scale: target ? (text ? 2.6 : 1.8) : 1,
        backgroundColor: target ? 'rgba(211,233,122,0.12)' : 'rgba(211,233,122,0)',
        duration: 0.3,
      });
      gsap.to(d, { scale: target ? 0 : 1, duration: 0.2 });
    };
    const down = () => gsap.to(r, { scale: '-=0.3', duration: 0.15 });
    const up = () => gsap.to(r, { scale: '+=0.3', duration: 0.15 });

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerover', over);
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    return () => {
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  return (
    <>
      <div
        ref={ring}
        className="pointer-events-none fixed left-0 top-0 z-[100] flex h-10 w-10 items-center justify-center rounded-full border border-[#d3e97a]/60 opacity-0 mix-blend-difference"
      >
        <span ref={label} className="text-[5px] font-semibold uppercase tracking-widest text-[#d3e97a]" />
      </div>
      <div
        ref={dot}
        className="pointer-events-none fixed left-0 top-0 z-[100] h-1.5 w-1.5 rounded-full bg-[#d3e97a] opacity-0"
      />
    </>
  );
}

/* Pulls its child toward the pointer while hovered */
export function Magnetic({ children, strength = 0.35 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !isFinePointer() || prefersReducedMotion()) return;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const move = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      xTo((e.clientX - (b.left + b.width / 2)) * strength);
      yTo((e.clientY - (b.top + b.height / 2)) * strength);
    };
    const leave = () => { xTo(0); yTo(0); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, [strength]);
  return <div ref={ref} className="inline-block">{children}</div>;
}

/* 3D tilt toward the pointer with a moving glare highlight */
export function TiltCard({
  children,
  className = '',
  max = 10,
  cursor,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  cursor?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const glare = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !isFinePointer() || prefersReducedMotion()) return;
    const move = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      const px = (e.clientX - b.left) / b.width;
      const py = (e.clientY - b.top) / b.height;
      gsap.to(el, {
        rotateY: (px - 0.5) * max * 2,
        rotateX: -(py - 0.5) * max * 2,
        transformPerspective: 900,
        duration: 0.5,
        ease: 'power3.out',
      });
      if (glare.current) {
        glare.current.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(211,233,122,0.18), transparent 55%)`;
        glare.current.style.opacity = '1';
      }
    };
    const leave = () => {
      gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
      if (glare.current) glare.current.style.opacity = '0';
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, [max]);
  return (
    <div ref={ref} className={`relative [transform-style:preserve-3d] ${className}`} data-cursor={cursor}>
      {children}
      <div
        ref={glare}
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300"
      />
    </div>
  );
}

/* Counts up from 0 when scrolled into view */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    const match = value.match(/^(\d+)(.*)$/);
    if (!el || !match || prefersReducedMotion()) return;
    const end = Number(match[1]);
    const suffix = match[2];
    const obj = { n: 0 };
    el.textContent = `0${suffix}`;
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () =>
        gsap.to(obj, {
          n: end,
          duration: 1.8,
          ease: 'power3.out',
          onUpdate: () => { el.textContent = `${Math.round(obj.n)}${suffix}`; },
        }),
    });
    return () => st.kill();
  }, [value]);
  return <span ref={ref} className={className}>{value}</span>;
}

/* Infinite horizontal marquee; direction flips with scroll direction */
export function Marquee({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = track.current;
    if (!el || prefersReducedMotion()) return;
    const tween = gsap.fromTo(
      el,
      { xPercent: reverse ? -50 : 0 },
      { xPercent: reverse ? 0 : -50, duration: 30, ease: 'none', repeat: -1 }
    );
    // speed up with scroll velocity and flip direction when scrolling up
    const st = ScrollTrigger.create({
      onUpdate: (self) => {
        const dir = self.direction;
        const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 400, 4);
        gsap.timeline()
          .to(tween, { timeScale: dir * boost, duration: 0.3, overwrite: true })
          .to(tween, { timeScale: dir, duration: 1.2 });
      },
    });
    return () => { tween.kill(); st.kill(); };
  }, [reverse]);
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden py-3 [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
      <div ref={track} className="flex w-max gap-4">
        {row.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-4 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 font-display text-2xl tracking-wide text-white/80 backdrop-blur-sm sm:text-3xl"
          >
            <span className="h-2 w-2 rotate-45 bg-[#d3e97a]" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* Top-of-page scroll progress bar */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        if (bar.current) bar.current.style.transform = `scaleX(${self.progress})`;
      },
    });
    return () => st.kill();
  }, []);
  return (
    <div className="fixed left-0 right-0 top-0 z-[60] h-[2px] bg-white/5">
      <div
        ref={bar}
        className="h-full origin-left bg-gradient-to-r from-[#d3e97a] via-[#38d9f5] to-[#7c5cff]"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  );
}

/* Counter preloader that wipes away to reveal the page */
export function Preloader({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setGone(true);
      onDone();
      return;
    }
    const obj = { n: 0 };
    const tl = gsap.timeline({
      onComplete: () => { setGone(true); },
    });
    tl.to(obj, {
      n: 100,
      duration: 1.6,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (count.current) count.current.textContent = String(Math.round(obj.n)).padStart(3, '0');
      },
    })
      .to('.preloader-line', { scaleX: 1, duration: 1.6, ease: 'power2.inOut' }, 0)
      .to('.preloader-inner', { y: -40, opacity: 0, duration: 0.5, ease: 'power3.in' })
      .add(onDone)
      .to(root.current, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.inOut' }, '-=0.1');
    return () => { tl.kill(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;
  return (
    <div
      ref={root}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0b0b0d]"
      style={{ clipPath: 'inset(0 0 0% 0)' }}
    >
      <div className="preloader-inner w-64 text-center">
        <p className="mb-4 text-xs uppercase tracking-[0.4em] text-white/40">Loading experience</p>
        <span ref={count} className="font-display text-8xl text-[#d3e97a]">000</span>
        <div className="mt-6 h-px w-full bg-white/10">
          <div className="preloader-line h-full origin-left scale-x-0 bg-[#d3e97a]" />
        </div>
      </div>
    </div>
  );
}

/* Reveals each word of a heading from below when scrolled into view */
export function RevealText({
  text,
  as: Tag = 'h2',
  className = '',
}: {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'p';
  className?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const words = el.querySelectorAll('.rw');
    gsap.set(words, { yPercent: 110, rotate: 6 });
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => gsap.to(words, { yPercent: 0, rotate: 0, duration: 1, stagger: 0.06, ease: 'expo.out' }),
    });
    return () => st.kill();
  }, [text]);
  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {text.split(' ').map((w, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden pb-[0.08em] align-bottom mr-[0.22em] last:mr-0">
          <span className="rw inline-block origin-bottom-left">{w}</span>
        </span>
      ))}
    </Tag>
  );
}

/* Small eyebrow label with an index number and animated rule */
export function SectionLabel({ index, label }: { index: string; label: string }) {
  const line = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = line.current;
    if (!el || prefersReducedMotion()) return;
    gsap.set(el, { scaleX: 0 });
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => gsap.to(el, { scaleX: 1, duration: 1.4, ease: 'expo.out' }),
    });
    return () => st.kill();
  }, []);
  return (
    <div className="mb-8 flex items-center gap-4">
      <span className="font-mono text-xs text-[#d3e97a]">{index}</span>
      <span className="text-sm font-medium uppercase tracking-[0.3em] text-white/70">{label}</span>
      <div ref={line} className="h-px flex-1 origin-left bg-gradient-to-r from-[#d3e97a]/60 to-transparent" />
    </div>
  );
}
