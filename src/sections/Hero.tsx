import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, Linkedin, Github, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReducedMotion } from '@/hooks/useScrollProgress';

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const decorRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const section = sectionRef.current;
    const headline = headlineRef.current;
    const content = contentRef.current;
    const image = imageRef.current;
    const decor = decorRef.current;

    if (!section || !headline || !content || !image || !decor) return;

    const triggers: ScrollTrigger[] = [];

    const ctx = gsap.context(() => {
      // Split headline into characters
      const text = headline.textContent || '';
      headline.innerHTML = text
        .split('')
        .map((char) =>
          char === ' '
            ? '<span class="inline-block">&nbsp;</span>'
            : `<span class="inline-block char">${char}</span>`
        )
        .join('');

      const chars = headline.querySelectorAll('.char');

      // Initial states
      gsap.set(chars, { opacity: 0, rotateX: -90, y: 50 });
      gsap.set(content.children, { opacity: 0, y: 30 });
      gsap.set(image, { opacity: 0, x: 100, rotateY: 30 });
      gsap.set(decor.children, { opacity: 0, scale: 0 });

      // Entrance timeline
      const entranceTl = gsap.timeline({ delay: 0.3 });

      // Character animation
      entranceTl.to(chars, {
        opacity: 1,
        rotateX: 0,
        y: 0,
        duration: 0.8,
        stagger: 0.06,
        ease: 'expo.out',
      });

      // Content fade in
      entranceTl.to(
        content.children,
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'expo.out',
        },
        '-=0.4'
      );

      // Image slide in
      entranceTl.to(
        image,
        {
          opacity: 1,
          x: 0,
          rotateY: 0,
          duration: 1,
          ease: 'expo.out',
        },
        '-=0.6'
      );

      // Decorative elements
      entranceTl.to(
        decor.children,
        {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'back.out(1.7)',
        },
        '-=0.5'
      );

      // Scroll parallax effects
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });

      scrollTl.to(headline, {
        y: -80,
        opacity: 0.3,
        ease: 'none',
      });

      scrollTl.to(
        image,
        {
          y: -40,
          scale: 1.05,
          ease: 'none',
        },
        0
      );

      scrollTl.to(
        decor.children,
        {
          y: -100,
          opacity: 0,
          ease: 'none',
        },
        0
      );

      if (scrollTl.scrollTrigger) {
        triggers.push(scrollTl.scrollTrigger);
      }
    }, section);

    return () => {
      triggers.forEach((st) => st.kill());
      ctx.revert();
    };
  }, [prefersReducedMotion]);

  const scrollToProjects = () => {
    const element = document.querySelector('#projects');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToContact = () => {
    const element = document.querySelector('#contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative min-h-screen flex items-center overflow-hidden bg-[#161616]"
    >
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(211, 233, 122, 0.15) 0%, transparent 70%)',
            animation: 'float-slow 15s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(211, 233, 122, 0.1) 0%, transparent 70%)',
            animation: 'float 12s ease-in-out infinite reverse',
          }}
        />
      </div>

      {/* Decorative Elements */}
      <div ref={decorRef} className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-[10%] w-4 h-4 rounded-full bg-[#d3e97a]/30"
          style={{ animation: 'float 5s ease-in-out infinite' }}
        />
        <div
          className="absolute top-1/3 right-[15%] w-6 h-6 rounded-full border-2 border-[#d3e97a]/20"
          style={{ animation: 'float-slow 7s ease-in-out infinite' }}
        />
        <div
          className="absolute bottom-1/4 left-[20%] w-3 h-3 rounded-sm bg-[#d3e97a]/20 rotate-45"
          style={{ animation: 'float 6s ease-in-out infinite 1s' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 py-16 sm:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="order-2 lg:order-1">
            <div ref={contentRef}>
              {/* Eyebrow */}
              <p className="text-[#d3e97a] text-sm font-medium tracking-widest uppercase mb-4">
                Frontend Developer
              </p>

              {/* Headline */}
              <h1
                ref={headlineRef}
                className="font-display text-6xl sm:text-7xl lg:text-8xl xl:text-9xl text-white leading-none mb-6"
                style={{ perspective: '1000px' }}
              >
                RAJKUMAR V
              </h1>

              {/* Subheadline */}
              <p className="text-xl sm:text-2xl text-white/80 font-light mb-4">
                Crafting Digital Experiences with Code & Creativity
              </p>

              {/* Description */}
              <p className="text-base text-white/60 max-w-lg mb-8 leading-relaxed">
                4+ years building scalable, user-focused web applications with Angular, React, and modern technologies. Specializing in real-time systems and performance optimization.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4 mb-10">
                <Button
                  onClick={scrollToProjects}
                  className="bg-[#d3e97a] text-[#161616] hover:bg-[#e8f5a8] hover:scale-105 transition-all duration-300 font-medium px-8 py-6 text-base group"
                >
                  View My Work
                  <ArrowDown className="ml-2 w-4 h-4 group-hover:translate-y-1 transition-transform" />
                </Button>
                <Button
                  onClick={scrollToContact}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/5 hover:border-[#d3e97a]/50 transition-all duration-300 px-8 py-6 text-base"
                >
                  Let's Connect
                </Button>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-4">
                <a
                  href="https://www.linkedin.com/in/rajkumar-v-b11282225/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-[#d3e97a] hover:border-[#d3e97a] hover:scale-110 transition-all duration-300"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={18} />
                </a>
                <a
                  href="https://github.com/rajkumar30598"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-[#d3e97a] hover:border-[#d3e97a] hover:scale-110 transition-all duration-300"
                  aria-label="GitHub"
                >
                  <Github size={18} />
                </a>
                <a
                  href="mailto:rajkumar30598@gmail.com"
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-[#d3e97a] hover:border-[#d3e97a] hover:scale-110 transition-all duration-300"
                  aria-label="Email"
                >
                  <Mail size={18} />
                </a>
              </div>
            </div>
          </div>

          {/* Right Content - Profile Image */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div
              ref={imageRef}
              className="relative"
              style={{ perspective: '1000px' }}
            >
              {/* Image Container */}
              <div className="relative group">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-[#d3e97a]/20 rounded-3xl blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Image */}
                <div className="relative w-64 h-80 sm:w-80 sm:h-96 lg:w-96 lg:h-[480px] rounded-3xl overflow-hidden border border-white/10 transition-all duration-500 group-hover:border-[#d3e97a]/30 group-hover:shadow-[0_0_40px_rgba(211,233,122,0.2)]">
                  <img
                    src="/images/profile.jpg"
                    alt="Rajkumar V"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                {/* Floating Badge */}
                <div
                  className="absolute -bottom-4 -left-4 bg-[#2a2a2a] border border-white/10 rounded-xl px-4 py-3 shadow-xl"
                  style={{ animation: 'float 4s ease-in-out infinite' }}
                >
                  <p className="text-[#d3e97a] font-display text-2xl">4+</p>
                  <p className="text-white/60 text-xs">Years Experience</p>
                </div>

                {/* Tech Stack Badge */}
                <div
                  className="absolute -top-4 -right-4 bg-[#2a2a2a] border border-white/10 rounded-xl px-4 py-3 shadow-xl"
                  style={{ animation: 'float 5s ease-in-out infinite 0.5s' }}
                >
                  <p className="text-white/60 text-xs mb-1">Specialized in</p>
                  <p className="text-[#d3e97a] font-medium text-sm">Angular & React</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#161616] to-transparent pointer-events-none" />
    </section>
  );
}
