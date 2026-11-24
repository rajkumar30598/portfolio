import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Layers, LayoutTemplate, Smartphone, Zap } from 'lucide-react';
import { BandMarquee, RevealText, SectionLabel } from '@/components/motion';
import { prefersReducedMotion } from '@/lib/motion';

gsap.registerPlugin(ScrollTrigger);

const stack = ['Angular', 'React', 'TypeScript', 'React Native', 'Next.js', 'RxJS', 'Design Systems', 'WebSocket'];

const facts = [
  { label: 'Currently', value: 'SDE 2, Neutrinos' },
  { label: 'Previously', value: 'Ninjacart · Gloify' },
  { label: 'Focus', value: 'Design systems · Real-time UI' },
  { label: 'Stack', value: 'Angular · React · React Native' },
];

const services = [
  {
    icon: Layers,
    title: 'Frontend architecture',
    text: 'Scalable Angular and React apps with clean state management, lazy loading and real performance budgets.',
    tags: ['Angular', 'React', 'TypeScript', 'RxJS'],
  },
  {
    icon: LayoutTemplate,
    title: 'Design systems',
    text: 'Themeable, accessible component libraries with docs and versioning that teams actually adopt.',
    tags: ['Component libraries', 'Theming', 'Docs', 'A11y'],
  },
  {
    icon: Zap,
    title: 'Real-time products',
    text: 'Live dashboards, trading flows and in-app chat on WebSockets that stay fast under heavy load.',
    tags: ['WebSocket', 'Trading dashboards', 'Chat'],
  },
  {
    icon: Smartphone,
    title: 'Mobile & web apps',
    text: 'My own products shipped end to end with React Native, Expo and Next.js, from idea to store listing.',
    tags: ['React Native', 'Expo', 'Next.js', 'Firebase'],
  },
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
      gsap.from('.about-copy p', {
        y: 30,
        opacity: 0,
        duration: 1,
        stagger: 0.12,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.about-copy', start: 'top 85%', once: true },
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

          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
            <div>
              <RevealText
                text="Building interfaces that *feel* *effortless.*"
                className="max-w-2xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.6rem]"
              />
              <div className="about-copy mt-8 max-w-xl space-y-5 text-lg leading-relaxed text-white/65">
                <p>
                  I'm a frontend engineer in Bangalore with 4+ years of building production web apps. I started at{' '}
                  <strong className="font-semibold text-white">Gloify</strong> on live fintech dashboards, spent nearly
                  four years at <strong className="font-semibold text-white">Ninjacart</strong> on high-volume, real-time
                  order management, and now build a platform-wide component library and design system at{' '}
                  <strong className="font-semibold text-white">Neutrinos</strong>.
                </p>
                <p>
                  Outside work I ship my own products end to end: a chess coach, an ad-free video app and a privacy-first
                  PDF toolkit. I care about performance, clean component architecture and details people can feel.
                </p>
              </div>

              <dl className="about-stats mt-12 grid max-w-xl grid-cols-2 gap-x-8 border-t border-white/10">
                {facts.map((f) => (
                  <div key={f.label} className="about-stat border-b border-white/10 py-5">
                    <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">{f.label}</dt>
                    <dd className="mt-1.5 font-medium text-white">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="about-photo relative aspect-[4/5] w-full max-w-md self-start overflow-hidden rounded-[2rem] lg:justify-self-end">
              <img src="/images/rajkumar.jpg" alt="Rajkumar V" className="h-[112%] w-full -translate-y-[6%] object-cover" />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-sm font-medium text-white backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                Bangalore, India
              </span>
            </div>
          </div>

          {/* What I do */}
          <div className="services mt-24 lg:mt-32">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">What I do</h2>
              <p className="max-w-sm text-white/55">The kind of work I'm best at, at my day job and on my own products.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {services.map((s, i) => (
                <div
                  key={s.title}
                  className="service-row group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] p-7 transition-[border-color,background-color] duration-500 hover:border-brand/50 hover:bg-white/[0.04] sm:p-8"
                >
                  {/* soft terracotta glow in the corner on hover */}
                  <span className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand/0 blur-3xl transition-colors duration-500 group-hover:bg-brand/25" />
                  <div className="relative mb-10 flex items-start justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/80 transition-colors duration-500 group-hover:border-brand group-hover:bg-brand group-hover:text-white">
                      <s.icon size={22} />
                    </span>
                    <span className="text-sm font-medium text-white/35">0{i + 1}</span>
                  </div>
                  <h3 className="relative font-display text-2xl font-semibold tracking-tight sm:text-3xl">{s.title}</h3>
                  <p className="relative mt-3 max-w-md leading-relaxed text-white/60">{s.text}</p>
                  <div className="relative mt-6 flex flex-wrap gap-2">
                    {s.tags.map((t) => (
                      <span key={t} className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-white/65">
                        {t}
                      </span>
                    ))}
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
