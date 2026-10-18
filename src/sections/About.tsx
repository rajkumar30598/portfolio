import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/hooks/useScrollProgress';

gsap.registerPlugin(ScrollTrigger);

const skills = [
  { name: 'JavaScript', category: 'Language' },
  { name: 'TypeScript', category: 'Language' },
  { name: 'Angular', category: 'Framework' },
  { name: 'React', category: 'Framework' },
  { name: 'RxJS', category: 'Library' },
  { name: 'Redux', category: 'Library' },
  { name: 'HTML/SCSS', category: 'Frontend' },
  { name: 'Tailwind', category: 'Frontend' },
  { name: 'WebSocket', category: 'Realtime' },
  { name: 'REST APIs', category: 'API' },
  { name: 'Firebase', category: 'Backend' },
  { name: 'Git', category: 'DevOps' },
];

export function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const skillsRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const section = sectionRef.current;
    const headline = headlineRef.current;
    const content = contentRef.current;
    const skills = skillsRef.current;

    if (!section || !headline || !content || !skills) return;

    const triggers: ScrollTrigger[] = [];

    const ctx = gsap.context(() => {
      // Split headline into words
      const text = headline.textContent || '';
      headline.innerHTML = text
        .split(' ')
        .map((word) => `<span class="inline-block overflow-hidden mr-[0.3em]"><span class="word-inner inline-block">${word}</span></span>`)
        .join('');

      const words = headline.querySelectorAll('.word-inner');

      // Initial states
      gsap.set(words, { y: '100%', opacity: 0 });
      gsap.set(content.children, { y: 30, opacity: 0 });
      gsap.set(skills.children, { scale: 0.9, opacity: 0 });

      // Scroll-triggered animations
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 70%',
          once: true,
        },
      });

      // Headline words reveal
      tl.to(words, {
        y: '0%',
        opacity: 1,
        duration: 0.6,
        stagger: 0.08,
        ease: 'expo.out',
      });

      // Content paragraphs
      tl.to(
        content.children,
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.15,
          ease: 'expo.out',
        },
        '-=0.3'
      );

      // Skills cards with elastic effect
      tl.to(
        skills.children,
        {
          scale: 1,
          opacity: 1,
          duration: 0.4,
          stagger: 0.06,
          ease: 'back.out(1.7)',
        },
        '-=0.4'
      );

      if (tl.scrollTrigger) {
        triggers.push(tl.scrollTrigger);
      }

      // Parallax effect on scroll
      const parallaxTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      });

      parallaxTl.to(headline, {
        y: -30,
        ease: 'none',
      });

      parallaxTl.to(
        content,
        {
          y: -50,
          ease: 'none',
        },
        0
      );

      if (parallaxTl.scrollTrigger) {
        triggers.push(parallaxTl.scrollTrigger);
      }
    }, section);

    return () => {
      triggers.forEach((st) => st.kill());
      ctx.revert();
    };
  }, [prefersReducedMotion]);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative py-16 sm:py-24 lg:py-32 bg-[#161616] overflow-hidden"
    >
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-full opacity-5">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full border border-[#d3e97a]" />
        <div className="absolute top-1/3 right-1/3 w-48 h-48 rounded-full border border-[#d3e97a]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        {/* Section Header */}
        <div className="flex items-center gap-4 mb-8 sm:mb-10 lg:mb-12">
          <span className="text-[#d3e97a] text-sm font-medium tracking-widest uppercase">
            About Me
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-[#d3e97a]/50 to-transparent" />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 mb-12 sm:mb-16 lg:mb-20 min-w-0">
          {/* Left - Headline */}
          <div className="min-w-0 overflow-hidden">
            <h2
              ref={headlineRef}
              className="font-display mt-1 text-4xl text-white leading-tight break-words"
            >
              Passionate About Building Things That Matter
            </h2>
          </div>

          {/* Right - Body Text */}
          <div ref={contentRef} className="space-y-6 min-w-0">
            <p className="text-lg text-white/70 leading-relaxed">
              I'm a Frontend Developer with 4+ years of experience crafting scalable web applications. My journey began with a curiosity for how things work on the web, which evolved into a career building real-time systems at{' '}
              <span className="text-[#d3e97a]">Ninjacart</span> and now reusable component libraries and design systems at{' '}
              <span className="text-[#d3e97a]">Neutrinos</span>.
            </p>
            <p className="text-lg text-white/70 leading-relaxed">
              I specialize in <span className="text-white">Angular</span> and{' '}
              <span className="text-white">React</span>, with a strong focus on performance optimization, component-driven architecture, and creating seamless user experiences. From real-time order management systems to interactive dashboards, I love solving complex problems with clean code.
            </p>
          </div>
        </div>

        {/* Skills Section */}
        <div>
          <h3 className="font-display text-2xl text-white mb-8">Tech Stack</h3>
          <div
            ref={skillsRef}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
          >
            {skills.map((skill) => (
              <div
                key={skill.name}
                className="group relative bg-[#1a1a1a] border border-white/10 rounded-xl p-4 hover:border-[#d3e97a]/50 hover:bg-[#d3e97a]/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(211,233,122,0.1)]"
              >
                <p className="text-white font-medium text-sm group-hover:text-[#d3e97a] transition-colors">
                  {skill.name}
                </p>
                <p className="text-white/40 text-xs mt-1">{skill.category}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12 pt-8 sm:mt-16 sm:pt-10 lg:mt-20 lg:pt-12 border-t border-white/10">
          {[
            { value: '4+', label: 'Years Experience' },
            { value: '10+', label: 'Projects Delivered' },
            { value: '2', label: 'Companies' },
            { value: '∞', label: 'Lines of Code' },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <p className="font-display text-4xl sm:text-5xl text-[#d3e97a] mb-2">
                {stat.value}
              </p>
              <p className="text-white/50 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
