import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDownRight, Gamepad2, Github, Linkedin, Mail } from 'lucide-react';
import { startGame } from '@/lib/game';
import { Magnetic } from '@/components/motion';
import { prefersReducedMotion, scrollToId } from '@/lib/motion';

gsap.registerPlugin(ScrollTrigger);

const ROLES = ['design systems', 'real-time web apps', 'mobile apps', 'AI-powered tools'];

const socials = [
  { href: 'https://www.linkedin.com/in/rajkumar-v-b11282225/', label: 'LinkedIn', icon: Linkedin },
  { href: 'https://github.com/rajkumar30598', label: 'GitHub', icon: Github },
  { href: 'mailto:rajkumar30598@gmail.com', label: 'Email', icon: Mail },
];

function SplitChars({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className} aria-label={text}>
      {text.split('').map((c, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden align-bottom">
          <span className="hero-char inline-block will-change-transform">{c === ' ' ? ' ' : c}</span>
        </span>
      ))}
    </span>
  );
}

export function Hero({ ready }: { ready: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLSpanElement>(null);
  const [roleIndex, setRoleIndex] = useState(0);

  // Intro timeline once the preloader finishes
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.set('.hero-char', { yPercent: 120, rotateX: -90, opacity: 0 });
      gsap.set('.hero-fade', { y: 30, opacity: 0 });
    }, section);
    if (!ready) return () => ctx.revert();

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    ctx.add(() => {
      tl.to('.hero-char', { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.4, stagger: 0.035 })
        .to('.hero-fade', { y: 0, opacity: 1, duration: 1, stagger: 0.08 }, '-=1');

      // Parallax out as the user scrolls away
      gsap.to(contentRef.current, {
        yPercent: -25,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.to('.hero-scroll', {
        opacity: 0,
        scrollTrigger: { trigger: section, start: 'top top', end: '20% top', scrub: true },
      });
    });
    return () => ctx.revert();
  }, [ready]);

  // Rotating role text
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = setInterval(() => {
      const el = roleRef.current;
      if (!el) return;
      gsap.to(el, {
        yPercent: -100,
        opacity: 0,
        duration: 0.4,
        ease: 'power3.in',
        onComplete: () => {
          setRoleIndex((i) => (i + 1) % ROLES.length);
          gsap.fromTo(el, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'expo.out' });
        },
      });
    }, 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="home" ref={sectionRef} className="relative flex min-h-[100svh] items-center overflow-hidden">
      <div ref={contentRef} className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-24 pt-32 lg:px-10">
        <div className="hero-fade mb-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
          </span>
          <span className="text-xs uppercase tracking-[0.25em] text-white/70">SDE 2 · Neutrinos · Bangalore</span>
        </div>

        <h1 className="whitespace-nowrap font-display text-[17vw] leading-[0.85] text-white [perspective:800px] sm:text-[15vw] lg:text-[11.5rem] xl:text-[13rem]">
          <SplitChars text="RAJKUMAR" />
          <span className="inline-block w-[0.22em]" aria-hidden="true" />
          <SplitChars text="V" className="text-brand" />
        </h1>

        <div className="mt-8 flex max-w-2xl flex-col gap-10">
          <div>
            <p className="hero-fade text-xl font-light text-white/70 sm:text-2xl">Frontend engineer who builds</p>
            <div className="hero-fade h-[1.45em] overflow-hidden text-5xl leading-[1.35] sm:text-6xl">
              <span ref={roleRef} className="font-serif-i text-gradient block pr-2">
                {ROLES[roleIndex]}
              </span>
            </div>
            <p className="hero-fade mt-5 max-w-xl text-base leading-relaxed text-white/55">
              4+ years shipping scalable, user-focused products with Angular, React and React Native, from
              real-time trading dashboards to apps people install on their phones.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-6">
            <div className="hero-fade flex flex-wrap gap-4">
              <Magnetic>
                <button
                  onClick={() => scrollToId('#projects')}
                  className="group relative overflow-hidden rounded-full bg-brand px-8 py-4 font-medium text-ink"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    View my work
                    <ArrowDownRight size={18} className="transition-transform duration-300 group-hover:rotate-[-45deg]" />
                  </span>
                  <span className="absolute inset-0 translate-y-full rounded-full bg-white transition-transform duration-500 ease-out group-hover:translate-y-0" />
                </button>
              </Magnetic>
              <Magnetic>
                <button
                  onClick={() => scrollToId('#contact')}
                  className="rounded-full border border-white/20 bg-white/[0.03] px-8 py-4 text-white backdrop-blur-md transition-colors duration-300 hover:border-brand hover:text-brand"
                >
                  Let's connect
                </button>
              </Magnetic>
              <Magnetic>
                <button
                  onClick={startGame}
                  className="group flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-6 py-4 text-brand backdrop-blur-md transition-colors duration-300 hover:bg-brand hover:text-ink"
                >
                  <Gamepad2 size={18} className="transition-transform duration-300 group-hover:rotate-[-12deg]" />
                  Play as a game
                </button>
              </Magnetic>
            </div>
            <div className="hero-fade flex items-center gap-3">
              {socials.map(({ href, label, icon: Icon }) => (
                <Magnetic key={label} strength={0.5}>
                  <a
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-white/70 backdrop-blur-md transition-colors duration-300 hover:border-brand hover:bg-brand hover:text-ink"
                  >
                    <Icon size={18} />
                  </a>
                </Magnetic>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => scrollToId('#about')}
        className="hero-scroll absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-white/50"
        aria-label="Scroll to about"
      >
        Scroll
        <span className="relative h-12 w-px overflow-hidden bg-white/15">
          <span className="absolute left-0 top-0 h-1/2 w-full animate-scroll-line bg-brand" />
        </span>
      </button>
    </section>
  );
}
