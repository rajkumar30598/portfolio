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
        backgroundColor: target ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0)',
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
        className="custom-cursor pointer-events-none fixed left-0 top-0 z-[400] flex h-10 w-10 items-center justify-center rounded-full border border-white opacity-0 mix-blend-difference"
      >
        <span ref={label} className="text-[5px] font-semibold uppercase tracking-widest text-white" />
      </div>
      <div
        ref={dot}
        className="custom-cursor pointer-events-none fixed left-0 top-0 z-[400] h-1.5 w-1.5 rounded-full bg-white opacity-0 mix-blend-difference"
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
        glare.current.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgb(var(--brand) / 0.18), transparent 55%)`;
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
            className="flex items-center gap-3 whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-white/75 sm:text-base"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
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
        className="h-full origin-left bg-brand"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  );
}

/* Loading screen: name reveals letter by letter over a thin progress line,
   then the screen splits open (top half up, bottom half down). */
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
    const el = root.current!;
    const obj = { n: 0 };
    const q = gsap.utils.selector(el);
    const tl = gsap.timeline({ onComplete: () => setGone(true) });
    tl.from(q('.pl-char'), { yPercent: 110, duration: 0.9, stagger: 0.035, ease: 'expo.out' })
      .from(q('.pl-meta'), { opacity: 0, y: 10, duration: 0.6, stagger: 0.08, ease: 'power2.out' }, 0.2)
      .to(
        obj,
        {
          n: 100,
          duration: 1.5,
          ease: 'power2.inOut',
          onUpdate: () => {
            if (count.current) count.current.textContent = `${Math.round(obj.n)}%`;
          },
        },
        0.15
      )
      .to(q('.pl-bar'), { scaleX: 1, duration: 1.5, ease: 'power2.inOut' }, 0.15)
      // exit: content lifts away, then the two halves part
      .to(q('.pl-content'), { opacity: 0, y: -16, duration: 0.45, ease: 'power2.in' })
      .add(onDone)
      .to(q('.pl-top'), { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '-=0.05')
      .to(q('.pl-bottom'), { yPercent: 100, duration: 1, ease: 'expo.inOut' }, '<');
    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;
  const name = 'Rajkumar V';
  return (
    <div ref={root} className="fixed inset-0 z-[200]" aria-label="Loading">
      <div className="pl-top absolute inset-x-0 top-0 h-1/2 bg-[#0b0b0c]" />
      <div className="pl-bottom absolute inset-x-0 bottom-0 h-1/2 bg-[#0b0b0c]" />
      <div className="pl-content absolute inset-0 flex flex-col items-center justify-center px-6 text-white">
        <h2 className="font-display text-5xl font-bold tracking-tight sm:text-7xl" aria-label={name}>
          {name.split('').map((c, i) => (
            <span key={i} aria-hidden="true" className="inline-block overflow-hidden align-bottom">
              <span className="pl-char inline-block">{c === ' ' ? '\u00A0' : c}</span>
            </span>
          ))}
        </h2>
        <div className="mt-8 flex w-full max-w-xs items-center gap-4">
          <div className="h-px flex-1 bg-white/15">
            <div className="pl-bar h-full origin-left scale-x-0 bg-brand" />
          </div>
          <span ref={count} className="w-10 text-right text-sm font-medium tabular-nums text-white/70">
            0%
          </span>
        </div>
        <div className="absolute inset-x-6 bottom-6 flex justify-between text-xs font-medium uppercase tracking-[0.16em] text-white/45 sm:inset-x-10 sm:bottom-8">
          <span className="pl-meta">Frontend Engineer</span>
          <span className="pl-meta">Portfolio ©2026</span>
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
  // words wrapped in *asterisks* render as the italic serif accent
  const plain = text.replace(/\*/g, '');
  return (
    <Tag ref={ref} className={className} aria-label={plain}>
      {text.split(' ').map((w, i) => {
        const accent = w.startsWith('*');
        const word = w.replace(/\*/g, '');
        return (
          <span
            key={i}
            aria-hidden="true"
            className="mr-[0.22em] inline-block overflow-hidden pb-[0.12em] pr-[0.06em] align-bottom last:mr-0"
          >
            <span
              className={`rw inline-block origin-bottom-left ${
                accent ? 'text-brand' : ''
              }`}
            >
              {word}
            </span>
          </span>
        );
      })}
    </Tag>
  );
}

const GLYPHS = '!<>-_\\/[]{}=+*^?#ABCDEFGHJKLMNPQRSTUVWXYZ';

/* Characters shuffle through random glyphs and settle left to right on hover */
export function ScrambleText({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    const host = el?.closest('a, button') as HTMLElement | null;
    if (!el || !host || prefersReducedMotion()) return;
    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf);
      const start = performance.now();
      const dur = 450;
      const tick = (now: number) => {
        const p = Math.min((now - start) / dur, 1);
        const settled = Math.floor(p * text.length);
        el.textContent = text
          .split('')
          .map((c, i) => (i < settled || c === ' ' ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join('');
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    host.addEventListener('pointerenter', run);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener('pointerenter', run);
      el.textContent = text;
    };
  }, [text]);
  return (
    <span className="relative inline-block">
      {/* invisible copy reserves the final width so the layout doesn't jitter */}
      <span className="invisible">{text}</span>
      <span ref={ref} aria-hidden="true" className="absolute inset-0 text-center">
        {text}
      </span>
      <span className="sr-only">{text}</span>
    </span>
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
    <div className="mb-8 flex items-center gap-4 text-sm font-medium">
      <span className="text-brand">({index})</span>
      <span className="opacity-70">{label}</span>
      <div ref={line} className="h-px flex-1 origin-left bg-current opacity-20" />
    </div>
  );
}

/* Statement paragraph whose words light up as you scroll past it */
export function ScrubText({ text, className = '' }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const words = el.querySelectorAll('.sw');
    const tween = gsap.fromTo(
      words,
      { opacity: 0.16 },
      {
        opacity: 1,
        stagger: 0.08,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
      }
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [text]);
  const plain = text.replace(/\*/g, '');
  return (
    <p ref={ref} className={className} aria-label={plain}>
      {text.split(' ').map((w, i) => {
        const accent = w.startsWith('*');
        return (
          <span key={i} aria-hidden="true" className={`sw inline-block pr-[0.25em] ${accent ? 'text-brand' : ''}`}>
            {w.replace(/\*/g, '')}
          </span>
        );
      })}
    </p>
  );
}

/* Two full-bleed marquee bands crossing at slight angles */
export function BandMarquee({ items }: { items: string[] }) {
  const a = useRef<HTMLDivElement>(null);
  const b = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ta = gsap.fromTo(a.current, { xPercent: 0 }, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
    const tb = gsap.fromTo(b.current, { xPercent: -50 }, { xPercent: 0, duration: 32, ease: 'none', repeat: -1 });
    const st = ScrollTrigger.create({
      onUpdate: (self) => {
        const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 300, 5);
        gsap.timeline()
          .to([ta, tb], { timeScale: boost * self.direction, duration: 0.25, overwrite: true })
          .to([ta, tb], { timeScale: self.direction, duration: 1 });
      },
    });
    return () => {
      ta.kill();
      tb.kill();
      st.kill();
    };
  }, []);
  const row = [...items, ...items, ...items, ...items];
  const band = (ref: React.RefObject<HTMLDivElement | null>, cls: string) => (
    <div ref={ref} className={`flex w-max items-center gap-8 py-4 sm:gap-12 sm:py-5 ${cls}`}>
      {row.map((t, i) => (
        <span key={i} className="flex items-center gap-8 whitespace-nowrap font-display text-3xl font-bold uppercase sm:gap-12 sm:text-5xl">
          {t}
          <span className="text-[0.6em]">✦</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="relative z-10 overflow-hidden py-16 sm:py-20" aria-hidden="true">
      <div className="-rotate-[2.5deg] scale-110 bg-brand text-white">{band(a, '')}</div>
      <div className="-mt-[2.4rem] rotate-[2deg] scale-110 bg-white text-ink sm:-mt-[3.2rem]">{band(b, '')}</div>
    </div>
  );
}
