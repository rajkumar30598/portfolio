import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Calendar, MapPin, Briefcase, GraduationCap, Trophy } from 'lucide-react';
import { RevealText, SectionLabel, TiltCard } from '@/components/motion';
import { prefersReducedMotion } from '@/lib/motion';
import { experiences } from '@/data/portfolio';

gsap.registerPlugin(ScrollTrigger);

export function Experience() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      // the timeline line draws itself as you scroll
      gsap.fromTo(
        '.xp-line-fill',
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: '.xp-list', start: 'top 65%', end: 'bottom 65%', scrub: 0.6 },
        }
      );
      gsap.utils.toArray<HTMLElement>('.xp-item').forEach((item, i) => {
        const fromLeft = i % 2 === 0;
        gsap.from(item.querySelector('.xp-card'), {
          x: fromLeft ? -120 : 120,
          rotateY: fromLeft ? 25 : -25,
          opacity: 0,
          duration: 1.2,
          ease: 'expo.out',
          scrollTrigger: { trigger: item, start: 'top 80%', once: true },
        });
        gsap.from(item.querySelector('.xp-dot'), {
          scale: 0,
          duration: 0.8,
          ease: 'back.out(3)',
          scrollTrigger: { trigger: item, start: 'top 65%', once: true },
        });
      });
      gsap.from('.xp-extra', {
        y: 60,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.xp-extras', start: 'top 85%', once: true },
      });
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section id="experience" ref={sectionRef} className="relative py-24 sm:py-32 lg:py-40">
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <SectionLabel index="02" label="Experience" />
        <RevealText
          text="My professional *journey*"
          className="mb-16 font-display text-5xl leading-[0.95] text-white sm:text-6xl lg:mb-24 lg:text-8xl"
        />

        <div className="xp-list relative">
          <div className="absolute bottom-0 left-4 top-0 w-px bg-white/10 md:left-1/2 md:-translate-x-1/2">
            <div className="xp-line-fill h-full w-full origin-top bg-gradient-to-b from-brand via-brand-3 to-brand-2 shadow-[0_0_12px_rgb(var(--brand)/0.6)]" />
          </div>

          <div className="space-y-16 lg:space-y-24">
            {experiences.map((exp, index) => (
              <div
                key={exp.id}
                className={`xp-item relative flex flex-col gap-8 md:items-center ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                <div className="xp-dot absolute left-4 top-8 z-10 h-5 w-5 -translate-x-1/2 rounded-full border-4 border-ink bg-brand shadow-[0_0_25px_rgb(var(--brand)/0.9)] md:left-1/2 md:top-1/2 md:-translate-y-1/2" />
                <div className="hidden md:block md:w-1/2" />
                <div
                  className={`xp-card ml-12 md:ml-0 md:w-1/2 ${index % 2 === 0 ? 'md:pr-16' : 'md:pl-16'}`}
                  style={{ perspective: '1000px' }}
                >
                  <TiltCard className="rounded-3xl" max={6}>
                    <div className="glass spotlight group rounded-3xl p-6 transition-colors duration-500 hover:border-brand/40 sm:p-8">
                      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
                        <span className="flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-brand">
                          <Briefcase size={14} />
                          {exp.role}
                        </span>
                        <span className="flex items-center gap-2 text-white/55">
                          <Calendar size={14} />
                          {exp.period}
                        </span>
                      </div>
                      <h3 className="mb-1 font-display text-4xl text-white transition-colors group-hover:text-brand sm:text-5xl">
                        {exp.company}
                      </h3>
                      <p className="mb-4 flex items-center gap-2 text-sm text-white/45">
                        <MapPin size={14} />
                        {exp.location}
                      </p>
                      <p className="mb-6 leading-relaxed text-white/65">{exp.description}</p>
                      <ul className="space-y-2.5">
                        {exp.achievements.map((a, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                            <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rotate-45 bg-brand" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </TiltCard>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="xp-extras mt-24 grid gap-6 md:grid-cols-2">
          <div className="xp-extra glass spotlight rounded-3xl p-6 transition-colors duration-500 hover:border-brand/40 sm:p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <GraduationCap size={22} />
            </div>
            <p className="mb-2 text-sm text-brand">2015 – 2019 · Karur, Tamil Nadu</p>
            <h4 className="mb-1 font-display text-3xl text-white">B.E. in Computer Science</h4>
            <p className="text-white/60">Chettinad College of Engineering and Technology</p>
          </div>
          <div className="xp-extra relative overflow-hidden rounded-3xl border border-brand/25 bg-gradient-to-br from-brand/15 via-brand/5 to-transparent p-6 backdrop-blur-md sm:p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/20 text-brand">
              <Trophy size={22} />
            </div>
            <h4 className="mb-2 font-display text-3xl text-white">Finalist, Smart India Hackathon 2019</h4>
            <p className="text-sm leading-relaxed text-white/65">
              Built a digital platform with a team to connect farmers directly with buyers, cutting out
              middlemen and improving profits for the agricultural community.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
