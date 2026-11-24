import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight } from 'lucide-react';
import { RevealText, SectionLabel } from '@/components/motion';
import { prefersReducedMotion } from '@/lib/motion';
import { GITHUB, projects, type Project } from '@/data/portfolio';

gsap.registerPlugin(ScrollTrigger);

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
          className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
      </>
    );
  }
  return (
    <div
      role="img"
      aria-label={`${project.title} screenshots`}
      className="absolute inset-0 overflow-hidden"
      style={{ background: `radial-gradient(120% 90% at 50% 110%, ${v.to} 0%, ${v.from} 60%, rgb(var(--ink)) 100%)` }}
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
      <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-ink/70 to-transparent" />
    </div>
  );
}

const featured = projects.slice(0, 3);
const archive = projects.slice(3);

function FeaturedCard({ project, index }: { project: Project; index: number }) {
  return (
    <article className="stack-card group relative grid overflow-hidden rounded-[2rem] border border-white/10 bg-[#141416] text-white shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.8)] sm:rounded-[2.5rem] lg:min-h-[76vh] lg:grid-cols-[0.9fr_1.1fr]">
      <div className="flex flex-col justify-between gap-10 p-7 sm:p-10 lg:p-14">
        <div>
          <div className="mb-8 flex items-center justify-between text-sm font-medium text-white/50">
            <span>
              ({String(index + 1).padStart(2, '0')}) — {project.company}
            </span>
          </div>
          <h3 className="font-display text-5xl font-bold leading-[0.95] sm:text-6xl lg:text-7xl">{project.title.split(' – ')[0]}</h3>
          {project.title.includes(' – ') && <p className="mt-3 text-xl text-white/60">{project.title.split(' – ')[1]}</p>}
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/70">{project.description}</p>
        </div>
        <div>
          <div className="mb-8 flex flex-wrap gap-2">
            {project.tech.map((t) => (
              <span key={t} className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/75">
                {t}
              </span>
            ))}
          </div>
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group/btn relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-white px-7 py-4 font-semibold text-ink"
            >
              <span className="absolute inset-0 translate-y-full rounded-full bg-brand transition-transform duration-500 ease-[cubic-bezier(.7,0,.2,1)] group-hover/btn:translate-y-0" />
              <span className="relative z-10 transition-colors duration-300 group-hover/btn:text-white">{project.liveLabel ?? 'Visit'}</span>
              <ArrowUpRight size={18} className="relative z-10 transition-all duration-300 group-hover/btn:rotate-45 group-hover/btn:text-white" />
            </a>
          )}
        </div>
      </div>
      <div className="relative m-3 min-h-[320px] overflow-hidden rounded-[1.6rem] sm:m-4 sm:min-h-[420px] sm:rounded-[2rem]">
        <ProjectVisual project={project} />
      </div>
    </article>
  );
}

/** Earlier work as big rows; on desktop the row's image floats next to the cursor. */
function ArchiveList() {
  const listRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const list = listRef.current;
    const preview = previewRef.current;
    if (!list || !preview || !window.matchMedia('(pointer: fine)').matches) return;
    const xTo = gsap.quickTo(preview, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(preview, 'y', { duration: 0.6, ease: 'power3' });
    const move = (e: PointerEvent) => {
      const b = list.getBoundingClientRect();
      xTo(e.clientX - b.left);
      yTo(e.clientY - b.top);
    };
    list.addEventListener('pointermove', move);
    return () => list.removeEventListener('pointermove', move);
  }, []);

  return (
    <div ref={listRef} className="relative" onPointerLeave={() => setActive(null)}>
      <div
        ref={previewRef}
        className="pointer-events-none absolute left-0 top-0 z-20 hidden h-56 w-80 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl transition-[opacity,transform] duration-300 lg:block"
        style={{ opacity: active === null ? 0 : 1, scale: active === null ? '0.8' : '1' }}
      >
        {archive.map((p, i) => (
          <img
            key={p.id}
            src={p.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
            style={{ opacity: active === i ? 1 : 0 }}
          />
        ))}
      </div>
      <div className="border-t border-white/10">
        {archive.map((p, i) => (
          <div
            key={p.id}
            onPointerEnter={() => setActive(i)}
            className="group flex flex-col gap-2 border-b border-white/10 py-7 transition-colors sm:flex-row sm:items-center sm:gap-8"
          >
            <span className="text-sm text-white/45 sm:w-16">0{i + 4}</span>
            <h4 className="flex-1 font-display text-3xl font-semibold text-white/85 transition-all duration-500 group-hover:translate-x-3 group-hover:text-white sm:text-4xl">
              {p.title}
            </h4>
            <span className="text-sm text-white/55">{p.company}</span>
            <span className="text-sm text-white/45 sm:w-56 sm:text-right">{p.tech.slice(0, 3).join(' · ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Projects() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      // each card shrinks and dims as the next one slides over it
      const cards = gsap.utils.toArray<HTMLElement>('.stack-wrap');
      cards.forEach((wrap, i) => {
        const next = cards[i + 1];
        if (!next) return;
        gsap.to(wrap.querySelector('.stack-card'), {
          scale: 0.92,
          opacity: 0.45,
          ease: 'none',
          scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 12%', scrub: true },
        });
      });
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section id="projects" ref={sectionRef} className="relative z-10 bg-ink text-white">
      <div className="mx-auto max-w-[1600px] px-5 pb-24 pt-24 sm:px-8 lg:px-12 lg:pb-32 lg:pt-32">
        <SectionLabel index="02" label="Selected work" />
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6 lg:mb-20">
          <RevealText
            text="Things I've *shipped*"
            className="font-display text-5xl font-bold leading-[0.95] sm:text-7xl lg:text-[7.5rem]"
          />
          <p className="max-w-sm text-white/60">
            Three apps I designed, built and launched on my own, from idea to store listing.
          </p>
        </div>

        <div className="space-y-6 lg:space-y-0">
          {featured.map((p, i) => (
            <div key={p.id} className="stack-wrap lg:sticky lg:pb-[6vh]" style={{ top: `calc(10vh + ${i * 28}px)` }}>
              <FeaturedCard project={p} index={i} />
            </div>
          ))}
        </div>

        <div className="mt-28 lg:mt-40">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h3 className="font-display text-4xl font-bold sm:text-5xl">Earlier work</h3>
            <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white">
              More on GitHub <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>
          <ArchiveList />
        </div>
      </div>
    </section>
  );
}
