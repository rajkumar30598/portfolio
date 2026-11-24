import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight } from 'lucide-react';
import { BandMarquee, CountUp, ScrubText, SectionLabel } from '@/components/motion';
import { prefersReducedMotion } from '@/lib/motion';

gsap.registerPlugin(ScrollTrigger);

const stack = ['Angular', 'React', 'TypeScript', 'React Native', 'Next.js', 'RxJS', 'Design Systems', 'WebSocket'];

const stats = [
  { value: '4+', label: 'Years building products' },
  { value: '10+', label: 'Projects delivered' },
  { value: '3', label: 'Apps shipped on my own' },
  { value: '3', label: 'Companies' },
];

const services = [
  { title: 'Frontend architecture', tags: ['Angular', 'React', 'TypeScript', 'RxJS'] },
  { title: 'Design systems', tags: ['Component libraries', 'Theming', 'Docs', 'A11y'] },
  { title: 'Real-time products', tags: ['WebSocket', 'Trading dashboards', 'Chat'] },
  { title: 'Mobile & web apps', tags: ['React Native', 'Expo', 'Next.js', 'Firebase'] },
];

export function About() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from('.about-photo', {
        clipPath: 'inset(100% 0 0 0)',
        duration: 1.6,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.about-photo', start: 'top 85%', once: true },
      });
      gsap.to('.about-photo img', {
        yPercent: 10,
        ease: 'none',
        scrollTrigger: { trigger: '.about-photo', start: 'top bottom', end: 'bottom top', scrub: true },
      });
      gsap.from('.about-stat', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.about-stats', start: 'top 85%', once: true },
      });
      gsap.from('.service-row', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.services', start: 'top 80%', once: true },
      });
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="relative">
      <div className="py-16 sm:py-24">
        <BandMarquee items={stack} />
      </div>

      <div className="relative z-10 rounded-[2.5rem] bg-paper text-white sm:rounded-[3.5rem]">
        <div className="mx-auto max-w-[1600px] px-5 pb-24 pt-20 sm:px-8 lg:px-12 lg:pb-32 lg:pt-28">
          <SectionLabel index="01" label="About" />

          <ScrubText
            text="I'm Rajkumar, a frontend engineer in Bangalore. For 4+ years I've built *real-time* trading systems, *design systems* used across products, and *apps* people install on their phones."
            className="max-w-5xl font-display text-[1.75rem] font-semibold leading-[1.15] sm:text-4xl sm:leading-[1.15] lg:text-[3.4rem] lg:leading-[1.12]"
          />

          <div className="mt-16 grid gap-10 lg:mt-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div className="about-photo relative aspect-[4/5] max-w-md overflow-hidden rounded-[2rem]">
              <img src="/images/profile.jpg" alt="Rajkumar V" className="h-[112%] w-full -translate-y-[6%] object-cover" />
              <span className="absolute bottom-4 left-4 rounded-full bg-paper/90 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
                Rajkumar V — Bangalore
              </span>
            </div>

            <div className="flex flex-col justify-between gap-12">
              <div className="space-y-5 text-lg leading-relaxed text-white/70">
                <p>
                  I started out curious about how the web works and turned it into a career: high-volume, real-time
                  order management at <strong className="font-semibold text-white">Ninjacart</strong>, and now a
                  platform-wide component library and design system at{' '}
                  <strong className="font-semibold text-white">Neutrinos</strong>.
                </p>
                <p>
                  Outside work I ship my own products end to end: a chess coach, an ad-free video app and a privacy-first
                  PDF toolkit. I care about performance, clean component architecture and interfaces that feel
                  effortless.
                </p>
              </div>

              <div className="about-stats grid grid-cols-2 border-t border-white/10 sm:grid-cols-4">
                {stats.map((s, i) => (
                  <div
                    key={s.label}
                    className={`about-stat border-b border-white/10 py-6 sm:border-b-0 ${i % 2 === 1 ? 'pl-5' : ''} ${
                      i > 0 ? 'sm:border-l sm:pl-5' : ''
                    }`}
                  >
                    <CountUp value={s.value} className="block font-display text-5xl font-bold tracking-tight lg:text-6xl" />
                    <p className="mt-2 text-sm text-white/60">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* What I do */}
          <div className="services mt-24 lg:mt-32">
            <div className="mb-6 flex items-end justify-between gap-6">
              <h2 className="font-display text-4xl font-bold sm:text-5xl">What I do</h2>
              <span className="hidden text-sm text-white/50 sm:block">Hover a row</span>
            </div>
            <div className="border-t border-white/10">
              {services.map((s, i) => (
                <div
                  key={s.title}
                  data-cursor=""
                  className="service-row group relative overflow-hidden border-b border-white/10"
                >
                  {/* blue fill rising from the bottom on hover */}
                  <span className="absolute inset-0 translate-y-full bg-brand transition-transform duration-500 ease-[cubic-bezier(.7,0,.2,1)] group-hover:translate-y-0" />
                  <div className="relative flex flex-col gap-3 px-1 py-7 transition-colors duration-300 group-hover:text-white sm:flex-row sm:items-center sm:gap-8 sm:px-4 lg:py-9">
                    <span className="text-sm font-medium text-white/50 transition-colors group-hover:text-white/70 sm:w-16">
                      0{i + 1}
                    </span>
                    <h3 className="flex-1 font-display text-3xl font-semibold transition-transform duration-500 group-hover:translate-x-2 sm:text-4xl lg:text-5xl">
                      {s.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 sm:max-w-sm sm:justify-end">
                      {s.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium transition-colors group-hover:border-white/40"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <ArrowUpRight className="hidden h-7 w-7 -rotate-45 opacity-0 transition-all duration-500 group-hover:rotate-0 group-hover:opacity-100 sm:block" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
