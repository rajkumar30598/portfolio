import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CountUp, Marquee, RevealText, SectionLabel, TiltCard } from '@/components/motion';
import { prefersReducedMotion } from '@/lib/motion';

gsap.registerPlugin(ScrollTrigger);

const stackRowA = ['JavaScript', 'TypeScript', 'Angular', 'React', 'React Native', 'Next.js', 'RxJS', 'Redux'];
const stackRowB = ['Tailwind', 'HTML / SCSS', 'WebSocket', 'REST APIs', 'Firebase', 'Expo', 'Zustand', 'Git'];

const stats = [
  { value: '4+', label: 'Years experience' },
  { value: '10+', label: 'Projects delivered' },
  { value: '3', label: 'Personal apps shipped' },
  { value: '3', label: 'Companies' },
];

export function About() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from('.about-photo', {
        clipPath: 'inset(100% 0 0 0)',
        scale: 1.15,
        duration: 1.6,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.about-photo', start: 'top 80%', once: true },
      });
      gsap.to('.about-photo img', {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
      });
      gsap.from('.about-para', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.about-para', start: 'top 85%', once: true },
      });
      gsap.from('.about-stat', {
        y: 60,
        opacity: 0,
        rotateX: -40,
        duration: 1.1,
        stagger: 0.1,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.about-stats', start: 'top 85%', once: true },
      });
      gsap.from('.about-badge', {
        scale: 0,
        opacity: 0,
        duration: 0.9,
        stagger: 0.15,
        ease: 'back.out(2)',
        scrollTrigger: { trigger: '.about-photo', start: 'top 60%', once: true },
      });
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="relative py-24 sm:py-32 lg:py-40">
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <SectionLabel index="01" label="About me" />

        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="relative mx-auto w-full max-w-sm lg:mx-0">
            <TiltCard className="rounded-[2rem]" max={8}>
              <div className="about-photo relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/10">
                <img
                  src="/images/profile.jpg"
                  alt="Rajkumar V"
                  className="h-[115%] w-full -translate-y-[7%] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d]/80 via-transparent to-transparent" />
                <p className="absolute bottom-5 left-5 font-display text-3xl text-white">Rajkumar V</p>
              </div>
            </TiltCard>
            <div className="about-badge glass absolute -right-4 top-8 rounded-2xl px-4 py-3 sm:-right-10 [animation:float_5s_ease-in-out_infinite]">
              <p className="text-xs text-white/50">Specialized in</p>
              <p className="text-sm font-medium text-[#d3e97a]">Angular · React · RN</p>
            </div>
            <div className="about-badge glass absolute -left-4 bottom-20 rounded-2xl px-4 py-3 sm:-left-10 [animation:float_6s_ease-in-out_infinite_1s]">
              <p className="font-display text-3xl leading-none text-[#d3e97a]">4+</p>
              <p className="text-xs text-white/50">Years building</p>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <RevealText
              text="Passionate about building things that matter."
              className="font-display text-5xl leading-[0.95] text-white sm:text-6xl lg:text-7xl"
            />
            <div className="mt-10 space-y-6">
              <p className="about-para text-lg leading-relaxed text-white/65">
                I'm a frontend developer with 4+ years of experience crafting scalable web applications. My
                journey began with curiosity about how the web works, and grew into building real-time systems
                at <span className="text-[#d3e97a]">Ninjacart</span> and now a platform-wide component library
                and design system at <span className="text-[#d3e97a]">Neutrinos</span>.
              </p>
              <p className="about-para text-lg leading-relaxed text-white/65">
                I specialize in <span className="text-white">Angular</span> and{' '}
                <span className="text-white">React</span>, and outside work I ship my own apps with{' '}
                <span className="text-white">React Native</span> and <span className="text-white">Next.js</span>.
                I care about performance, component-driven architecture and interfaces that feel effortless.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-24 space-y-3">
        <p className="mx-auto mb-6 max-w-7xl px-6 text-sm uppercase tracking-[0.3em] text-white/40 lg:px-10">
          Tech stack
        </p>
        <Marquee items={stackRowA} />
        <Marquee items={stackRowB} reverse />
      </div>

      <div className="about-stats relative z-10 mx-auto mt-24 grid max-w-7xl grid-cols-2 gap-4 px-6 [perspective:900px] md:grid-cols-4 lg:px-10">
        {stats.map((s) => (
          <div
            key={s.label}
            className="about-stat glass group rounded-3xl p-6 transition-colors duration-500 hover:border-[#d3e97a]/40 sm:p-8"
          >
            <CountUp
              value={s.value}
              className="block font-display text-6xl text-[#d3e97a] transition-transform duration-500 group-hover:scale-110 sm:text-7xl"
            />
            <p className="mt-2 text-sm text-white/50">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
