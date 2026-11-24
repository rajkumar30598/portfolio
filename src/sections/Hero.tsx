import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, ArrowRight, ArrowUpRight, Gamepad2 } from 'lucide-react';
import { Magnetic } from '@/components/motion';
import { prefersReducedMotion, scrollToId } from '@/lib/motion';
import { startGame } from '@/lib/game';
import { GITHUB, LINKEDIN } from '@/data/portfolio';

gsap.registerPlugin(ScrollTrigger);

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

const bangaloreTime = () =>
  new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });

/** Live local time in Bangalore: a small "real person, real place" touch. */
function useBangaloreTime() {
  const [time, setTime] = useState(bangaloreTime);
  useEffect(() => {
    const id = setInterval(() => setTime(bangaloreTime()), 15000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function Hero({ ready }: { ready: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const time = useBangaloreTime();

  const facts = [
    { value: '4+ years', label: 'building production frontends' },
    { value: '3 apps', label: 'designed & shipped solo' },
    { value: '10+', label: 'projects delivered' },
    { value: `${time} IST`, label: 'Bangalore, India' },
  ];

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.set('.hero-char', { yPercent: 115 });
      gsap.set('.hero-fade', { y: 24, opacity: 0 });
      gsap.set('.hero-fact', { y: 20, opacity: 0 });
    }, section);
    if (!ready) return () => ctx.revert();

    ctx.add(() => {
      gsap
        .timeline({ defaults: { ease: 'expo.out' } })
        .to('.hero-char', { yPercent: 0, duration: 1.4, stagger: 0.035 })
        .to('.hero-fade', { y: 0, opacity: 1, duration: 1, stagger: 0.08 }, '-=1.1')
        .to('.hero-fact', { y: 0, opacity: 1, duration: 0.9, stagger: 0.06 }, '-=0.8');

      gsap.to(contentRef.current, {
        yPercent: -12,
        opacity: 0.15,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true },
      });
    });
    return () => ctx.revert();
  }, [ready]);

  return (
    <section id="home" ref={sectionRef} className="relative flex min-h-[100svh] flex-col overflow-hidden">
      {/* main block, vertically centred; the right side is left open for the 3D sphere */}
      <div ref={contentRef} className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-1 items-center px-5 pb-10 pt-28 sm:px-8 lg:px-12">
        <div className="max-w-3xl lg:max-w-[52rem]">
          <div className="hero-fade mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/80 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            SDE 2 at Neutrinos
          </div>

          <h1 className="font-display font-extrabold uppercase leading-[0.9] tracking-tight text-white">
            <SplitChars text="Rajkumar V" className="block whitespace-nowrap text-[15vw] sm:text-[10vw] lg:text-[7.4rem] xl:text-[8.4rem]" />
          </h1>
          <p className="hero-fade mt-3 font-display text-3xl font-semibold tracking-tight text-brand sm:text-5xl lg:text-[3.4rem]">
            Frontend Engineer
          </p>

          <p className="hero-fade mt-7 max-w-xl text-lg leading-relaxed text-white/65 sm:text-xl">
            I build design systems, real-time products and apps people actually install, with Angular, React and React
            Native.
          </p>

          <div className="hero-fade mt-10 flex flex-wrap items-center gap-4">
            <Magnetic strength={0.3}>
              <button
                onClick={() => scrollToId('#projects')}
                className="group relative flex items-center gap-2 overflow-hidden rounded-full bg-brand px-7 py-4 font-semibold text-white"
              >
                <span className="absolute inset-0 translate-y-full rounded-full bg-white transition-transform duration-500 ease-[cubic-bezier(.7,0,.2,1)] group-hover:translate-y-0" />
                <span className="relative z-10 transition-colors duration-300 group-hover:text-ink">View my work</span>
                <ArrowRight size={18} className="relative z-10 transition-all duration-300 group-hover:translate-x-1 group-hover:text-ink" />
              </button>
            </Magnetic>
            <button
              onClick={startGame}
              className="group flex items-center gap-2 rounded-full border border-white/20 px-6 py-4 font-semibold text-white transition-colors duration-300 hover:border-white hover:bg-white hover:text-ink"
            >
              <Gamepad2 size={18} className="transition-transform duration-300 group-hover:rotate-[-12deg]" />
              Play as a game
            </button>
            <div className="ml-1 flex items-center gap-5 text-sm font-medium">
              <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-1 text-white/60 hover:text-white">
                LinkedIn <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
              <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-1 text-white/60 hover:text-white">
                GitHub <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* info strip along the bottom */}
      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-5 pb-8 sm:px-8 lg:px-12">
        <div className="grid grid-cols-2 gap-y-5 border-t border-white/10 pt-6 md:grid-cols-[repeat(4,1fr)_auto] md:items-end">
          {facts.map((f) => (
            <div key={f.label} className="hero-fact">
              <p className="font-display text-xl font-semibold text-white sm:text-2xl">{f.value}</p>
              <p className="text-sm text-white/45">{f.label}</p>
            </div>
          ))}
          <button
            onClick={() => scrollToId('#about')}
            className="hero-fact col-span-2 flex items-center gap-2 justify-self-start text-sm font-medium text-white/50 transition-colors hover:text-white md:col-span-1 md:justify-self-end"
          >
            Scroll
            <ArrowDown size={16} className="animate-bounce" />
          </button>
        </div>
      </div>
    </section>
  );
}
