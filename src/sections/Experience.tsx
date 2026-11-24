import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RevealText, SectionLabel } from '@/components/motion';
import { prefersReducedMotion } from '@/lib/motion';
import { experiences } from '@/data/portfolio';

gsap.registerPlugin(ScrollTrigger);

const extras = [
  { period: '2015 — 2019', title: 'B.E. Computer Science', sub: 'Chettinad College of Engineering and Technology, Karur' },
  {
    period: '2019',
    title: 'Finalist, Smart India Hackathon',
    sub: 'Built a platform connecting farmers directly with buyers, cutting out middlemen.',
  },
];

export function Experience() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.xp-row').forEach((row) => {
        gsap.from(row, {
          y: 60,
          opacity: 0,
          duration: 1.1,
          ease: 'expo.out',
          scrollTrigger: { trigger: row, start: 'top 88%', once: true },
        });
        gsap.from(row.querySelector('.xp-rule'), {
          scaleX: 0,
          duration: 1.4,
          ease: 'expo.out',
          scrollTrigger: { trigger: row, start: 'top 88%', once: true },
        });
      });
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section id="experience" ref={sectionRef} className="relative z-20 rounded-[2.5rem] bg-paper text-white sm:rounded-[3.5rem]">
      <div className="mx-auto max-w-[1600px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <SectionLabel index="03" label="Experience" />
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6 lg:mb-20">
          <RevealText
            text="Where I've *worked*"
            className="font-display text-5xl font-bold leading-[0.95] sm:text-7xl lg:text-[7.5rem]"
          />
          <p className="max-w-sm text-white/60">4+ years of production frontends across fintech, agritech and platform teams.</p>
        </div>

        <div>
          {experiences.map((e, i) => (
            <div key={e.id} className="xp-row relative grid gap-6 py-10 lg:grid-cols-[180px_1fr_1.2fr] lg:gap-12 lg:py-14">
              <div className="xp-rule absolute inset-x-0 top-0 h-px origin-left bg-white/10" />
              <div className="text-sm font-medium text-white/55">
                {e.period}
                {i === 0 && (
                  <span className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-white">
                    Now
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-display text-4xl font-bold leading-none sm:text-5xl">{e.company}</h3>
                <p className="mt-3 text-lg font-medium text-white/80">{e.role}</p>
                <p className="text-sm text-white/50">{e.location}</p>
                <p className="mt-4 max-w-md leading-relaxed text-white/65">{e.description}</p>
              </div>
              <ul className="space-y-3">
                {e.achievements.map((a) => (
                  <li key={a} className="flex gap-3 leading-relaxed text-white/75">
                    <span className="mt-[0.6rem] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {extras.map((x) => (
            <div key={x.title} className="xp-row relative grid gap-3 py-8 lg:grid-cols-[180px_1fr_1.2fr] lg:gap-12">
              <div className="xp-rule absolute inset-x-0 top-0 h-px origin-left bg-white/10" />
              <div className="text-sm font-medium text-white/55">{x.period}</div>
              <h3 className="font-display text-2xl font-bold sm:text-3xl">{x.title}</h3>
              <p className="leading-relaxed text-white/65">{x.sub}</p>
            </div>
          ))}
          <div className="h-px bg-white/10" />
        </div>
      </div>
    </section>
  );
}
