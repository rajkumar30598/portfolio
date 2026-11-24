import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/hooks/useScrollProgress';
import { ExternalLink, Github, ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

type Project = {
  id: number;
  title: string;
  company: string;
  description: string;
  image: string;
  tech: string[];
  features: string[];
  liveUrl?: string;
  liveLabel?: string;
  codeUrl?: string;
};

const projects: Project[] = [
  {
    id: 1,
    title: 'Rookwise – Chess Coach',
    company: 'Personal App · Android',
    description:
      'A free, ad-free pocket chess coach: on-device Stockfish game review, puzzles built from your own mistakes, 44 interactive lessons and board scanning.',
    image: '/images/rookwise.jpg',
    tech: ['React Native', 'Expo', 'TypeScript', 'Zustand', 'Stockfish', 'TFLite'],
    features: [
      'Every move rated Brilliant to Blunder, with accuracy and key moments',
      'Your mistakes become spaced-repetition puzzles',
      'Native engine module and on-device board recognition',
      'Imports Lichess and Chess.com games, works offline',
    ],
    liveUrl: 'https://rajkumar30598.github.io/rookwise-site/',
    liveLabel: 'Visit Site',
  },
  {
    id: 2,
    title: 'AdFree Tube',
    company: 'Personal App · Android',
    description:
      'An ad-free YouTube client with a native player, offline downloads, background play, PiP, SponsorBlock and a full music mode with synced lyrics.',
    image: '/images/adfree-tube.jpg',
    tech: ['React Native', 'Expo', 'TypeScript', 'Firebase', 'YouTube Data API'],
    features: [
      'Native player with HD/4K, captions, chapters and most-replayed graph',
      'Offline video/audio downloads, queue and background play',
      'Optional Google sign-in to sync subscriptions and playlists',
      'Remote config for hotfixes without an app update',
    ],
    liveUrl: 'https://rajkumar30598.github.io/Adfree-tube-landing/',
    liveLabel: 'Download APK',
  },
  {
    id: 3,
    title: 'PDF Toolkit',
    company: 'Personal Web App',
    description:
      '45+ PDF tools – edit, merge, split, convert, OCR – running 100% in the browser, plus AI chat with your PDF using your own Claude, ChatGPT or Gemini key.',
    image: '/images/pdf-toolkit.jpg',
    tech: ['Next.js', 'TypeScript', 'pdf-lib', 'PDF.js', 'AI SDKs'],
    features: [
      'Files never leave the device: processing is fully client-side',
      'Bring-your-own-key AI chat, summaries, flashcards and translation',
      'Single tool registry drives the homepage, menus and SEO pages',
      'Installable PWA with share-target support',
    ],
    liveUrl: 'https://pdfeditdesk.com',
    liveLabel: 'Visit Site',
  },
  {
    id: 4,
    title: 'Internal Admin Dashboard',
    company: 'Ninjacart',
    description:
      'Real-time order management system that improved processing speed by 25% through WebSocket implementation.',
    image: '/images/project-1.jpg',
    tech: ['Angular', 'WebSocket', 'RxJS', 'TypeScript'],
    features: [
      'User management with permission-based views',
      'Real-time metrics visualization',
      'Logs and reports generation',
      'Advanced filtering and export functionality',
    ],
  },
  {
    id: 5,
    title: 'Snippets - Global Trade News',
    company: 'Ninjacart',
    description:
      'Responsive frontend visualizing real-time trade insights from multiple API feeds with AI-powered summaries.',
    image: '/images/project-2.jpg',
    tech: ['Angular', 'REST APIs', 'OpenAI', 'TypeScript'],
    features: [
      'Modular card-based architecture',
      'Infinite scroll for dynamic content',
      'OpenAI integration for summary generation',
      'Multi-source API feed aggregation',
    ],
  },
  {
    id: 6,
    title: 'Ecommerce Platform',
    company: 'Personal Project',
    description:
      'Modern shopping experience with optimized performance through lazy loading and component reusability.',
    image: '/images/project-3.jpg',
    tech: ['Angular', 'TypeScript', 'SCSS', 'RxJS'],
    features: [
      'Product filtering and search',
      'Cart management system',
      'Optimized checkout flow',
      'Lazy loading for better performance',
    ],
  },
  {
    id: 7,
    title: 'Theatre Management System',
    company: 'Personal Project',
    description:
      'Real-time ticket booking application with admin dashboard and seat availability monitoring.',
    image: '/images/project-4.jpg',
    tech: ['Angular', 'Firebase', 'Firestore', 'TypeScript'],
    features: [
      'Real-time seat availability monitoring',
      'User authentication and booking history',
      'Admin dashboard for management',
      'Custom notifications system',
    ],
  },
];

export function Projects() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const section = sectionRef.current;
    const header = headerRef.current;
    const cardsContainer = cardsContainerRef.current;
    const progress = progressRef.current;

    if (!section || !header || !cardsContainer || !progress) return;

    const triggers: ScrollTrigger[] = [];

    const ctx = gsap.context(() => {
      // Header animation
      gsap.set(header.children, { y: 50, opacity: 0 });

      const headerTrigger = ScrollTrigger.create({
        trigger: header,
        start: 'top 80%',
        once: true,
        onEnter: () => {
          gsap.to(header.children, {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: 'expo.out',
          });
        },
      });
      triggers.push(headerTrigger);

      // Card animations
      const cards = cardsContainer.querySelectorAll('.project-card');
      gsap.set(cards, { y: 80, opacity: 0 });

      cards.forEach((card, index) => {
        const cardTrigger = ScrollTrigger.create({
          trigger: card,
          start: 'top 80%',
          once: true,
          onEnter: () => {
            gsap.to(card, {
              y: 0,
              opacity: 1,
              duration: 0.8,
              ease: 'expo.out',
              delay: index * 0.15,
            });
          },
        });
        triggers.push(cardTrigger);
      });

      // Progress bar animation
      const progressTrigger = ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          gsap.to(progress, {
            width: `${self.progress * 100}%`,
            duration: 0.1,
            ease: 'none',
          });
        },
      });
      triggers.push(progressTrigger);
    }, section);

    return () => {
      triggers.forEach((st) => st.kill());
      ctx.revert();
    };
  }, [prefersReducedMotion]);

  return (
    <section
      id="projects"
      ref={sectionRef}
      className="relative py-16 sm:py-24 lg:py-32 bg-[#161616] overflow-hidden"
    >
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/5 z-50">
        <div
          ref={progressRef}
          className="h-full bg-[#d3e97a] transition-none"
          style={{ width: '0%' }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
        {/* Section Header */}
        <div ref={headerRef} className="mb-10 sm:mb-12 lg:mb-16">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-[#d3e97a] text-sm font-medium tracking-widest uppercase">
              Projects
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-[#d3e97a]/50 to-transparent" />
          </div>
          <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl text-white">
            Featured Work
          </h2>
        </div>

        {/* Projects Grid */}
        <div
          ref={cardsContainerRef}
          className="grid md:grid-cols-2 gap-8"
        >
          {projects.map((project) => (
            <div
              key={project.id}
              className="project-card group relative bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden hover:border-[#d3e97a]/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
            >
              {/* Image */}
              <div className="relative h-56 sm:h-64 overflow-hidden">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-[#d3e97a]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8">
                {/* Company Tag */}
                <span className="text-[#d3e97a] text-xs font-medium tracking-wider uppercase mb-3 block">
                  {project.company}
                </span>

                {/* Title */}
                <h3 className="font-display text-2xl sm:text-3xl text-white mb-3 group-hover:text-[#d3e97a] transition-colors">
                  {project.title}
                </h3>

                {/* Description */}
                <p className="text-white/60 mb-6 leading-relaxed">
                  {project.description}
                </p>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tech.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/70 text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {project.features.slice(0, 2).map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-white/50 text-sm"
                    >
                      <ArrowRight size={14} className="text-[#d3e97a] mt-1 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Actions */}
                {(project.liveUrl || project.codeUrl) && (
                <div className="flex items-center gap-4">
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#d3e97a] text-sm font-medium hover:underline underline-offset-4"
                    >
                      {project.liveLabel ?? 'View Project'}
                      <ExternalLink size={14} />
                    </a>
                  )}
                  {project.codeUrl && (
                    <a
                      href={project.codeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-white/60 text-sm hover:text-white transition-colors"
                    >
                      <Github size={14} />
                      Code
                    </a>
                  )}
                </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* View All CTA */}
        <div className="text-center mt-10 sm:mt-12 lg:mt-16">
          <a
            href="https://github.com/rajkumar30598"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 border border-white/20 rounded-full text-white hover:bg-white/5 hover:border-[#d3e97a]/50 transition-all duration-300 group"
          >
            <Github size={20} />
            <span>View More on GitHub</span>
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
