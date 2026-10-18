import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/hooks/useScrollProgress';
import { Calendar, MapPin, Briefcase } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const experiences = [
  {
    id: 1,
    role: 'SDE 2',
    company: 'Neutrinos',
    location: 'Bangalore, India',
    period: 'Mar 2026 - Present',
    description:
      'Building a platform-level UI component library and design system used across multiple products.',
    achievements: [
      'Architected a reusable UI component library adopted across multiple products',
      'Built a theme-aware, accessible component system with well-documented APIs',
      'Reduced bundle size and improved render performance with lazy-loading, tree-shaking and OnPush',
      'Set up component docs, usage guidelines and semantic versioning to speed up onboarding',
    ],
  },
  {
    id: 2,
    role: 'SDE 2',
    company: 'Ninjacart',
    location: 'Bangalore, India',
    period: 'Jul 2022 - Mar 2026',
    description:
      'Led frontend development for real-time order management systems and internal tools.',
    achievements: [
      'Built a real-time order management system in Angular and WebSockets for high-volume trade',
      'Improved order processing speed by 25% by optimizing real-time data sync',
      'Built a Jira-inspired task board with drag-and-drop and live status syncing',
      'Integrated in-platform chat using matrix-js-sdk',
      'Delivered KYC and payment modules using Digio and Ninja-Pay',
    ],
  },
  {
    id: 3,
    role: 'Angular Developer',
    company: 'Gloify',
    location: 'Bangalore, India',
    period: 'Feb 2022 - Jul 2022',
    description:
      'Built interactive dashboards and reusable component libraries for fintech applications.',
    achievements: [
      'Built live stock-analytics dashboards with Angular, WebSocket and Highcharts',
      'Developed reusable UI components improving delivery speed',
      'Translated UI/UX designs into pixel-accurate, responsive interfaces',
      'Collaborated with QA and backend teams for smooth releases',
    ],
  },
];

export function Experience() {
  const sectionRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const section = sectionRef.current;
    const timeline = timelineRef.current;
    const cards = cardsRef.current.filter(Boolean);

    if (!section || !timeline || cards.length === 0) return;

    const triggers: ScrollTrigger[] = [];

    const ctx = gsap.context(() => {
      // Timeline line animation
      gsap.set(timeline, { scaleY: 0, transformOrigin: 'top' });

      const timelineTrigger = ScrollTrigger.create({
        trigger: section,
        start: 'top 60%',
        once: true,
        onEnter: () => {
          gsap.to(timeline, {
            scaleY: 1,
            duration: 1.2,
            ease: 'expo.out',
          });
        },
      });
      triggers.push(timelineTrigger);

      // Card animations
      cards.forEach((card, index) => {
        if (!card) return;

        const isLeft = index % 2 === 0;
        const xOffset = isLeft ? -100 : 100;
        const rotateY = isLeft ? 15 : -15;

        gsap.set(card, {
          x: xOffset,
          rotateY,
          opacity: 0,
        });

        const cardTrigger = ScrollTrigger.create({
          trigger: card,
          start: 'top 75%',
          once: true,
          onEnter: () => {
            gsap.to(card, {
              x: 0,
              rotateY: 0,
              opacity: 1,
              duration: 0.8,
              ease: 'expo.out',
              delay: index * 0.2,
            });
          },
        });
        triggers.push(cardTrigger);
      });
    }, section);

    return () => {
      triggers.forEach((st) => st.kill());
      ctx.revert();
    };
  }, [prefersReducedMotion]);

  return (
    <section
      id="experience"
      ref={sectionRef}
      className="relative py-16 sm:py-24 lg:py-32 bg-[#1a1a1a] overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #d3e97a 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <span className="text-[#d3e97a] text-sm font-medium tracking-widest uppercase mb-4 block">
            Experience
          </span>
          <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl text-white">
            My Professional Journey
          </h2>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div
            ref={timelineRef}
            className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#d3e97a] via-[#d3e97a]/50 to-transparent md:-translate-x-1/2"
          />

          {/* Experience Cards */}
          <div className="space-y-16">
            {experiences.map((exp, index) => (
              <div
                key={exp.id}
                className={`relative flex flex-col md:flex-row items-start md:items-center gap-8 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Timeline Dot */}
                <div className="absolute left-4 md:left-1/2 w-4 h-4 bg-[#d3e97a] rounded-full border-4 border-[#1a1a1a] md:-translate-x-1/2 z-10 shadow-[0_0_20px_rgba(211,233,122,0.5)]" />

                {/* Card */}
                <div
                  ref={(el) => { cardsRef.current[index] = el; }}
                  className={`ml-12 md:ml-0 md:w-[45%] ${
                    index % 2 === 0 ? 'md:mr-auto' : 'md:ml-auto'
                  }`}
                  style={{ perspective: '1000px' }}
                >
                  <div className="group bg-[#2a2a2a] border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-[#d3e97a]/30 hover:bg-[#333333] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="flex items-center gap-2 text-[#d3e97a] text-sm">
                        <Briefcase size={14} />
                        {exp.role}
                      </span>
                      <span className="text-white/30">•</span>
                      <span className="flex items-center gap-2 text-white/60 text-sm">
                        <Calendar size={14} />
                        {exp.period}
                      </span>
                    </div>

                    {/* Company */}
                    <h3 className="font-display text-2xl sm:text-3xl text-white mb-2 group-hover:text-[#d3e97a] transition-colors">
                      {exp.company}
                    </h3>

                    {/* Location */}
                    <p className="flex items-center gap-2 text-white/50 text-sm mb-4">
                      <MapPin size={14} />
                      {exp.location}
                    </p>

                    {/* Description */}
                    <p className="text-white/60 mb-6 leading-relaxed">
                      {exp.description}
                    </p>

                    {/* Achievements */}
                    <ul className="space-y-2">
                      {exp.achievements.map((achievement, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-white/70 text-sm"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#d3e97a] mt-2 flex-shrink-0" />
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="mt-12 pt-8 sm:mt-16 sm:pt-10 lg:mt-24 lg:pt-12 border-t border-white/10">
          <h3 className="font-display text-2xl text-white mb-8">Education</h3>
          <div className="bg-[#2a2a2a] border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-[#d3e97a]/30 transition-all duration-300">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="text-[#d3e97a] text-sm font-medium">
                2015 - 2019
              </span>
              <span className="text-white/30">•</span>
              <span className="text-white/60 text-sm">Karur, Tamil Nadu</span>
            </div>
            <h4 className="font-display text-xl sm:text-2xl text-white mb-1">
              B.E. in Computer Science
            </h4>
            <p className="text-white/60">
              Chettinad College of Engineering and Technology
            </p>
          </div>
        </div>

        {/* Achievement */}
        <div className="mt-8 bg-gradient-to-r from-[#d3e97a]/10 to-transparent border border-[#d3e97a]/20 rounded-2xl p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#d3e97a]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[#d3e97a] text-lg">🏆</span>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">
                Finalist at Smart India Hackathon 2019
              </h4>
              <p className="text-white/60 text-sm leading-relaxed">
                Collaborated with a team to build a digital platform aimed at
                connecting farmers directly with buyers, helping eliminate
                middlemen and improve profits for the agricultural community.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
