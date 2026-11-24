import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, ArrowUpRight, Gamepad2 } from 'lucide-react';
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

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.set('.hero-char', { yPercent: 115 });
      gsap.set('.hero-fade', { y: 24, opacity: 0 });
      gsap.set('.hero-rule', { scaleX: 0 });
    }, section);
    if (!ready) return () => ctx.revert();

    ctx.add(() => {
      gsap
        .timeline({ defaults: { ease: 'expo.out' } })
        .to('.hero-char', { yPercent: 0, duration: 1.5, stagger: 0.03 })
        .to('.hero-rule', { scaleX: 1, duration: 1.4 }, '-=1.2')
        .to('.hero-fade', { y: 0, opacity: 1, duration: 1, stagger: 0.07 }, '-=1.1');

      // the two lines drift apart and the hero dims as you scroll away
      const st = { trigger: section, start: 'top top', end: 'bottom top', scrub: true };
      gsap.to('.hero-line-1', { xPercent: -8, ease: 'none', scrollTrigger: st });
      gsap.to('.hero-line-2', { xPercent: 8, ease: 'none', scrollTrigger: { ...st } });
      gsap.to(contentRef.current, {
        opacity: 0.2,
        ease: 'none',
        scrollTrigger: { trigger: section, start: '30% top', end: 'bottom top', scrub: true },
      });
    });
    return () => ctx.revert();
  }, [ready]);

  return (
    <section id="home" ref={sectionRef} className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden">
      <div ref={contentRef} className="relative z-10 mx-auto w-full max-w-[1600px] px-5 pb-8 pt-28 sm:px-8 lg:px-12">
        {/* meta row */}
        <div className="hero-fade mb-6 flex flex-wrap items-center justify-between gap-3 text-sm font-medium text-white/60">
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            SDE 2 at Neutrinos
          </span>
          <span>Bangalore, IN — {time} IST</span>
        </div>

        {/* the name, as big as the screen allows */}
        <h1 className="font-display font-extrabold uppercase leading-[0.86] text-white">
          <SplitChars text="Rajkumar V" className="hero-line-1 block whitespace-nowrap text-[12.5vw] sm:text-[9.4vw] min-[1600px]:text-[9.4rem]" />
          <SplitChars
            text="Frontend Engineer"
            className="hero-line-2 mt-1 block whitespace-nowrap text-[7vw] text-brand sm:text-[5.3vw] min-[1600px]:text-[5.3rem]"
          />
        </h1>

        <div className="hero-rule mt-8 h-px w-full origin-left bg-white/15" />

        {/* intro + actions */}
        <div className="mt-6 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div className="hero-fade max-w-xl">
            <p className="text-lg leading-relaxed text-white/70 sm:text-xl">
              I build design systems, real-time products and apps people actually install, with Angular, React and
              React Native.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium">
              <button
                onClick={startGame}
                className="group flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-white transition-colors duration-300 hover:border-brand hover:bg-brand hover:text-white"
              >
                <Gamepad2 size={17} className="transition-transform duration-300 group-hover:rotate-[-12deg]" />
                Play as a game
              </button>
              <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-1 text-white/60 hover:text-white">
                LinkedIn <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
              <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-1 text-white/60 hover:text-white">
                GitHub <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
          <div className="hero-fade">
            <Magnetic strength={0.4}>
              <button
                onClick={() => scrollToId('#projects')}
                className="group relative flex h-32 w-32 flex-col items-center justify-center gap-1 overflow-hidden rounded-full bg-brand text-sm font-semibold text-white sm:h-40 sm:w-40 sm:text-base"
              >
                <span className="absolute inset-0 translate-y-full rounded-full bg-white transition-transform duration-500 ease-[cubic-bezier(.7,0,.2,1)] group-hover:translate-y-0" />
                <span className="relative z-10 transition-colors duration-300 group-hover:text-ink">View work</span>
                <ArrowDown size={20} className="relative z-10 transition-all duration-300 group-hover:translate-y-1 group-hover:text-ink" />
              </button>
            </Magnetic>
          </div>
        </div>
      </div>
    </section>
  );
}
