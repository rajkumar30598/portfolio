import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, ArrowUpRight, Github } from 'lucide-react';
import { Magnetic, RevealText, SectionLabel, TiltCard } from '@/components/motion';
import { prefersReducedMotion } from '@/lib/motion';

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
  /** Real screenshots shown in device frames instead of a flat cover image */
  visual?: Visual;
};

type Visual =
  | { kind: 'phones'; shots: [string, string, string]; from: string; to: string; glow: string }
  | { kind: 'browser'; shots: [string, string]; from: string; to: string; glow: string; url: string };

const projects: Project[] = [
  {
    id: 1,
    title: 'Rookwise – Chess Coach',
    company: 'Personal App · Android',
    description:
      'A free, ad-free pocket chess coach: on-device Stockfish game review, puzzles built from your own mistakes, 44 interactive lessons and board scanning.',
    image: '/images/rookwise.jpg',
    visual: {
      kind: 'phones',
      shots: [
        '/images/apps/rookwise-1-home.jpg',
        '/images/apps/rookwise-2-game-review.jpg',
        '/images/apps/rookwise-6-puzzles.jpg',
      ],
      from: '#1f3a14',
      to: '#5f8f3a',
      glow: 'rgba(155,211,106,0.55)',
    },
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
    visual: {
      kind: 'phones',
      shots: [
        '/images/apps/adfree-home.webp',
        '/images/apps/adfree-watch.webp',
        '/images/apps/adfree-music-player.webp',
      ],
      from: '#2a0a0e',
      to: '#b3202c',
      glow: 'rgba(255,72,72,0.5)',
    },
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
    visual: {
      kind: 'browser',
      shots: ['/images/apps/pdf-home.jpg', '/images/apps/pdf-chat.jpg'],
      from: '#0f1640',
      to: '#3b5bff',
      glow: 'rgba(91,120,255,0.55)',
      url: 'pdfeditdesk.com',
    },
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

function Phone({ src, className = '' }: { src: string; className?: string }) {
  return (
    <div
      className={`absolute bottom-[-18%] aspect-[9/19] w-[30%] overflow-hidden rounded-[1.4rem] border-[5px] border-[#111] bg-black shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] ring-1 ring-white/15 transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)] ${className}`}
    >
      <img src={src} alt="" loading="lazy" className="h-full w-full object-cover object-top" />
      <span className="absolute left-1/2 top-1.5 h-1.5 w-10 -translate-x-1/2 rounded-full bg-black/80" />
    </div>
  );
}

function BrowserWindow({ src, url, className = '' }: { src: string; url: string; className?: string }) {
  return (
    <div
      className={`absolute overflow-hidden rounded-xl bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] ring-1 ring-white/20 transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)] ${className}`}
    >
      <div className="flex items-center gap-1.5 bg-[#ececf1] px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
        <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
        <span className="h-2 w-2 rounded-full bg-[#28c840]" />
        <span className="ml-3 flex-1 truncate rounded-md bg-white px-2 py-0.5 text-center text-[9px] text-black/50">{url}</span>
      </div>
      <img src={src} alt="" loading="lazy" className="block w-full" />
    </div>
  );
}

function ProjectVisual({ project }: { project: Project }) {
  const v = project.visual;
  if (!v) {
    return (
      <>
        <img
          src={project.image}
          alt={project.title}
          loading="lazy"
          className="project-img h-full w-full scale-110 object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-125"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0d] via-[#0b0b0d]/10 to-transparent" />
      </>
    );
  }
  return (
    <div
      role="img"
      aria-label={`${project.title} screenshots`}
      className="absolute inset-0 overflow-hidden"
      style={{ background: `radial-gradient(120% 90% at 50% 110%, ${v.to} 0%, ${v.from} 60%, #0b0b0d 100%)` }}
    >
      {/* dotted grid + glow */}
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_75%)]" />
      <div
        className="absolute left-1/2 top-[65%] h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-opacity duration-700 group-hover:opacity-100"
        style={{ background: v.glow, opacity: 0.6 }}
      />
      {v.kind === 'phones' ? (
        <>
          <Phone src={v.shots[0]} className="left-[12%] origin-bottom rotate-[-9deg] scale-[0.88] group-hover:-translate-x-3 group-hover:-translate-y-2 group-hover:rotate-[-14deg]" />
          <Phone src={v.shots[2]} className="right-[12%] origin-bottom rotate-[9deg] scale-[0.88] group-hover:-translate-y-2 group-hover:translate-x-3 group-hover:rotate-[14deg]" />
          <Phone src={v.shots[1]} className="left-1/2 z-10 -translate-x-1/2 group-hover:-translate-y-5 group-hover:scale-[1.04]" />
        </>
      ) : (
        <>
          <BrowserWindow src={v.shots[1]} url={`${v.url}/chat`} className="right-[5%] top-[10%] w-[64%] rotate-[3deg] opacity-90 group-hover:translate-x-3 group-hover:rotate-[5deg]" />
          <BrowserWindow src={v.shots[0]} url={v.url} className="left-[6%] top-[24%] z-10 w-[70%] rotate-[-2deg] group-hover:-translate-x-2 group-hover:-translate-y-3 group-hover:rotate-[-3deg]" />
        </>
      )}
      <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#0b0b0d]/70 to-transparent" />
    </div>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <TiltCard className="h-full rounded-[2rem]" max={7} cursor={project.liveUrl ? 'Open' : undefined}>
      <article className="project-card glass group flex h-full flex-col overflow-hidden rounded-[2rem] transition-colors duration-500 hover:border-[#d3e97a]/40">
        <div className="relative aspect-[16/10] flex-shrink-0 overflow-hidden lg:aspect-auto lg:h-[46%]">
          <ProjectVisual project={project} />
          <span className="absolute left-5 top-5 z-20 rounded-full border border-white/15 bg-black/40 px-3 py-1 font-mono text-xs text-white/80 backdrop-blur-md">
            {String(index + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}
          </span>
          {project.liveUrl && (
            <span className="absolute right-5 top-5 z-20 flex h-11 w-11 -translate-y-2 items-center justify-center rounded-full bg-[#d3e97a] text-[#0b0b0d] opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:rotate-45 group-hover:opacity-100">
              <ArrowUpRight size={20} />
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-6 sm:p-8 lg:min-h-0 lg:p-7">
          <span className="mb-2 text-xs font-medium uppercase tracking-[0.25em] text-[#d3e97a]">
            {project.company}
          </span>
          <h3 className="mb-3 font-display text-4xl leading-none text-white sm:text-5xl lg:text-[2.6rem]">{project.title}</h3>
          <p className="mb-5 text-[15px] leading-relaxed text-white/60 lg:line-clamp-3">{project.description}</p>

          <ul className="mb-6 space-y-2 lg:hidden">
            {project.features.slice(0, 2).map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/50">
                <ArrowRight size={14} className="mt-1 flex-shrink-0 text-[#d3e97a]" />
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-wrap gap-2">
            {project.tech.map((t) => (
              <span key={t} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70">
                {t}
              </span>
            ))}
          </div>

          {(project.liveUrl || project.codeUrl) && (
            <div className="mt-6 flex items-center gap-5 border-t border-white/10 pt-5 lg:mt-5 lg:pt-4">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/link flex items-center gap-2 text-sm font-medium text-[#d3e97a]"
                >
                  <span className="relative">
                    {project.liveLabel ?? 'View project'}
                    <span className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 bg-[#d3e97a] transition-transform duration-300 group-hover/link:origin-left group-hover/link:scale-x-100" />
                  </span>
                  <ArrowUpRight size={16} className="transition-transform duration-300 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
                </a>
              )}
              {project.codeUrl && (
                <a
                  href={project.codeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
                >
                  <Github size={16} />
                  Code
                </a>
              )}
            </div>
          )}
        </div>
      </article>
    </TiltCard>
  );
}

export function Projects() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    const track = trackRef.current;
    if (!section || !pin || !track || prefersReducedMotion()) return;

    const mm = gsap.matchMedia();

    // Desktop: pin the section and scroll the cards horizontally
    mm.add('(min-width: 1024px)', () => {
      const distance = () => track.scrollWidth - window.innerWidth;
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: pin,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // skew cards with scroll speed for a sense of momentum
            const skew = gsap.utils.clamp(-8, 8, self.getVelocity() / -300);
            gsap.to('.h-card', { skewX: skew, duration: 0.4, ease: 'power3.out', overwrite: true });
            gsap.to('.h-card', { skewX: 0, duration: 0.8, delay: 0.25, ease: 'power3.out' });
          },
        },
      });
      // parallax the image inside each card as it crosses the screen
      gsap.utils.toArray<HTMLElement>('.h-card').forEach((card) => {
        const img = card.querySelector('.project-img');
        if (!img) return;
        gsap.fromTo(
          img,
          { xPercent: -6 },
          {
            xPercent: 6,
            ease: 'none',
            scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
          }
        );
      });
      gsap.to('.projects-progress', {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: pin, start: 'top top', end: () => `+=${distance()}`, scrub: true },
      });
    });

    // Mobile / tablet: stacked cards that rise in
    mm.add('(max-width: 1023px)', () => {
      gsap.utils.toArray<HTMLElement>('.h-card').forEach((card) => {
        gsap.from(card, {
          y: 80,
          opacity: 0,
          rotateX: -15,
          duration: 1,
          ease: 'expo.out',
          scrollTrigger: { trigger: card, start: 'top 85%', once: true },
        });
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section id="projects" ref={sectionRef} className="relative">
      <div ref={pinRef} className="relative lg:flex lg:h-screen lg:items-center lg:overflow-hidden lg:pt-16">
        <div
          ref={trackRef}
          className="grid gap-8 px-6 py-24 [perspective:1200px] md:grid-cols-2 lg:flex lg:w-max lg:items-center lg:gap-10 lg:py-0 lg:pl-[max(2.5rem,calc((100vw-80rem)/2+2.5rem))] lg:pr-[10vw]"
        >
          <div className="md:col-span-2 lg:w-[min(38vw,560px)] lg:flex-shrink-0 lg:pr-10">
            <SectionLabel index="03" label="Projects" />
            <RevealText
              text="Featured work"
              className="font-display text-6xl leading-[0.9] text-white sm:text-7xl lg:text-[9rem]"
            />
            <p className="mt-6 max-w-sm text-white/50">
              Three apps I designed, built and shipped end to end, plus earlier work from my career.
            </p>
            <p className="mt-10 hidden items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/40 lg:flex">
              Keep scrolling <ArrowRight size={14} className="animate-nudge text-[#d3e97a]" />
            </p>
          </div>

          {projects.map((project, index) => (
            <div key={project.id} className="h-card lg:h-[min(76vh,660px)] lg:w-[min(34vw,480px)] lg:flex-shrink-0">
              <ProjectCard project={project} index={index} />
            </div>
          ))}
          <div className="h-card flex items-center justify-center md:col-span-2 lg:w-[320px] lg:flex-shrink-0">
            <Magnetic>
              <a
                href="https://github.com/rajkumar30598"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-56 w-56 flex-col items-center justify-center gap-3 rounded-full border border-white/15 bg-white/[0.03] text-white backdrop-blur-md transition-all duration-500 hover:scale-105 hover:border-[#d3e97a] hover:bg-[#d3e97a] hover:text-[#0b0b0d]"
              >
                <Github size={30} />
                <span className="font-display text-2xl">More on GitHub</span>
                <ArrowUpRight size={22} className="transition-transform duration-500 group-hover:rotate-45" />
              </a>
            </Magnetic>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 hidden w-[min(80rem,100vw)] -translate-x-1/2 px-10 lg:block">
          <div className="h-px w-full bg-white/10">
            <div className="projects-progress h-full origin-left scale-x-0 bg-[#d3e97a]" />
          </div>
        </div>
      </div>
    </section>
  );
}
