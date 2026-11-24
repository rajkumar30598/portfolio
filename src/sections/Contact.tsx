import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight } from 'lucide-react';
import { Magnetic, SectionLabel } from '@/components/motion';
import { prefersReducedMotion } from '@/lib/motion';
import { EMAIL, GITHUB, LINKEDIN, PHONE } from '@/data/portfolio';

gsap.registerPlugin(ScrollTrigger);

export function Contact() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from('.cta-line', {
        yPercent: 110,
        duration: 1.3,
        stagger: 0.1,
        ease: 'expo.out',
        scrollTrigger: { trigger: section, start: 'top 70%', once: true },
      });
      gsap.from('.cta-fade', {
        y: 30,
        opacity: 0,
        duration: 1,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: section, start: 'top 55%', once: true },
      });
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section id="contact" ref={sectionRef} className="relative z-10 bg-ink text-white">
      <div className="mx-auto max-w-[1600px] px-5 pb-16 pt-24 sm:px-8 lg:px-12 lg:pt-32">
        <SectionLabel index="04" label="Contact" />

        <h2 className="font-display font-bold leading-[0.95] tracking-tight">
          <span className="block overflow-hidden">
            <span className="cta-line block text-[13vw] sm:text-[8vw] min-[1600px]:text-[8rem]">Let's work</span>
          </span>
          <span className="block overflow-hidden">
            <span className="cta-line block text-[13vw] text-brand sm:text-[8vw] min-[1600px]:text-[8rem]">together.</span>
          </span>
        </h2>

        <div className="mt-14 grid gap-12 border-t border-white/10 pt-10 md:grid-cols-[1fr_auto] md:items-center">
          <div className="cta-fade space-y-6">
            <a href={`mailto:${EMAIL}`} className="group inline-flex items-center gap-3 font-display text-2xl font-semibold text-white/90 hover:text-white sm:text-4xl">
              <span className="relative">
                {EMAIL}
                <span className="absolute -bottom-1 left-0 h-[2px] w-full origin-right scale-x-0 bg-brand transition-transform duration-500 group-hover:origin-left group-hover:scale-x-100" />
              </span>
              <ArrowUpRight className="h-7 w-7 text-brand transition-transform duration-500 group-hover:rotate-45" />
            </a>
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-base font-medium text-white/60">
              <a href={PHONE.href} className="transition-colors hover:text-white">
                {PHONE.label}
              </a>
              <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-1 hover:text-white">
                LinkedIn <ArrowUpRight size={18} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
              <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-1 hover:text-white">
                GitHub <ArrowUpRight size={18} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
              <span className="text-white/40">Bangalore, India</span>
            </div>
          </div>
          <div className="cta-fade">
            <Magnetic strength={0.4}>
              <a
                href={`mailto:${EMAIL}?subject=${encodeURIComponent('Hello Rajkumar')}`}
                className="group relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-full bg-brand text-lg font-semibold text-white sm:h-44 sm:w-44"
              >
                <span className="absolute inset-0 translate-y-full rounded-full bg-white transition-transform duration-500 ease-[cubic-bezier(.7,0,.2,1)] group-hover:translate-y-0" />
                <span className="relative z-10 transition-colors duration-300 group-hover:text-ink">Get in touch</span>
              </a>
            </Magnetic>
          </div>
        </div>
      </div>
    </section>
  );
}
