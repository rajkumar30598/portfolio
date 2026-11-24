import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { ArrowUpRight, Coins, Github, Linkedin, Mail, Phone, Volume2, VolumeX, X } from 'lucide-react';
import { EMAIL, GITHUB, LINKEDIN, PHONE, experiences, projects } from '@/data/portfolio';
import { bindKeyboard, input, setStick } from './input';
import { COINS, STATIONS, type StationId } from './layout';
import { Player } from './Player';
import { World } from './World';
import { gameStore, useGame } from './store';
import { isMuted, setMuted, sfx } from './sound';

const isTouch = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

/* ------------------------------------------------------------------ */
/* Panels                                                             */
/* ------------------------------------------------------------------ */
function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/75">{children}</span>;
}

function PanelBody({ id }: { id: StationId }) {
  if (id === 'about') {
    return (
      <div className="grid gap-6 sm:grid-cols-[180px_1fr]">
        <img src="/images/profile.jpg" alt="Rajkumar V" className="aspect-[4/5] w-full rounded-2xl object-cover" />
        <div>
          <p className="mb-1 text-xs uppercase tracking-[0.25em] text-brand">About me</p>
          <h2 className="mb-4 font-display text-5xl leading-none text-white">Hi, I'm Rajkumar</h2>
          <p className="mb-3 leading-relaxed text-white/70">
            Frontend engineer with 4+ years building scalable web apps: real-time trading systems at Ninjacart, and now a
            platform-wide component library and design system at Neutrinos.
          </p>
          <p className="leading-relaxed text-white/70">
            I specialise in Angular and React, and outside work I ship my own apps with React Native and Next.js.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            {[
              ['4+', 'years'],
              ['10+', 'projects'],
              ['3', 'own apps'],
            ].map(([v, l]) => (
              <div key={l} className="rounded-xl border border-white/10 bg-white/[0.04] py-3">
                <p className="font-display text-3xl text-brand">{v}</p>
                <p className="text-xs text-white/50">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (id === 'experience') {
    return (
      <div>
        <p className="mb-1 text-xs uppercase tracking-[0.25em] text-brand">Experience tower</p>
        <h2 className="mb-6 font-display text-5xl leading-none text-white">Floors I've worked on</h2>
        <div className="space-y-4">
          {experiences.map((e) => (
            <div key={e.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-3xl text-white">{e.company}</h3>
                <span className="text-sm text-white/50">{e.period}</span>
              </div>
              <p className="mb-3 text-sm text-brand">{e.role} · {e.location}</p>
              <ul className="space-y-1.5">
                {e.achievements.map((a) => (
                  <li key={a} className="flex gap-2 text-sm text-white/70">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rotate-45 bg-brand" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (id.startsWith('project-')) {
    const p = projects[Number(id.split('-')[1])];
    const shots = p.visual ? p.visual.shots : [p.image];
    return (
      <div>
        <p className="mb-1 text-xs uppercase tracking-[0.25em] text-brand">{p.company}</p>
        <h2 className="mb-4 font-display text-5xl leading-none text-white">{p.title}</h2>
        <div className="mb-5 flex gap-3 overflow-x-auto pb-1">
          {shots.map((s) => (
            <img
              key={s}
              src={s}
              alt=""
              className={`flex-shrink-0 rounded-xl border border-white/10 object-cover ${
                p.visual?.kind === 'phones' ? 'h-64 w-auto' : 'h-48 w-auto'
              }`}
            />
          ))}
        </div>
        <p className="mb-4 leading-relaxed text-white/70">{p.description}</p>
        <ul className="mb-5 space-y-1.5">
          {p.features.map((f) => (
            <li key={f} className="flex gap-2 text-sm text-white/65">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rotate-45 bg-brand" />
              {f}
            </li>
          ))}
        </ul>
        <div className="mb-6 flex flex-wrap gap-2">
          {p.tech.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
        {p.liveUrl && (
          <a
            href={p.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-medium text-ink transition-transform hover:scale-105"
          >
            {p.liveLabel ?? 'Visit'} <ArrowUpRight size={18} />
          </a>
        )}
      </div>
    );
  }
  if (id === 'archive') {
    return (
      <div>
        <p className="mb-1 text-xs uppercase tracking-[0.25em] text-brand">Archive</p>
        <h2 className="mb-6 font-display text-5xl leading-none text-white">Earlier work</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.slice(3).map((p) => (
            <div key={p.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              <img src={p.image} alt="" className="h-28 w-full object-cover" />
              <div className="p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-brand">{p.company}</p>
                <h3 className="mb-2 font-display text-2xl text-white">{p.title}</h3>
                <p className="mb-3 text-sm text-white/60">{p.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.tech.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  // contact
  const links = [
    { icon: Mail, label: EMAIL, href: `mailto:${EMAIL}` },
    { icon: Phone, label: PHONE.label, href: PHONE.href },
    { icon: Linkedin, label: 'LinkedIn', href: LINKEDIN },
    { icon: Github, label: 'GitHub', href: GITHUB },
  ];
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-[0.25em] text-brand">Mailbox</p>
      <h2 className="mb-3 font-display text-5xl leading-none text-white">Let's work together</h2>
      <p className="mb-6 text-white/65">Have a project in mind or just want to chat? Pick a channel.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {links.map(({ icon: Icon, label, href }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-brand/50"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 text-brand transition-colors group-hover:bg-brand group-hover:text-ink">
              <Icon size={20} />
            </span>
            <span className="truncate text-white">{label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function Panel() {
  const open = useGame((s) => s.open);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    input.frozen = !!open;
    if (open) closeRef.current?.focus();
  }, [open]);
  if (!open) return null;
  const close = () => {
    gameStore.open(null);
    sfx.close();
  };
  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/40 p-3 backdrop-blur-[2px] sm:items-center sm:p-6" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        className="glass relative max-h-[85vh] w-full max-w-2xl !bg-ink/90 animate-[panel-in_0.35s_cubic-bezier(.2,.9,.3,1.2)] overflow-y-auto rounded-3xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 hover:bg-white/15"
        >
          <X size={18} />
        </button>
        <PanelBody id={open} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HUD                                                                */
/* ------------------------------------------------------------------ */
function Prompt() {
  const near = useGame((s) => s.near);
  const open = useGame((s) => s.open);
  if (!near || open) return null;
  const st = STATIONS.find((s) => s.id === near)!;
  return (
    <button
      onClick={() => {
        input.interact = true;
      }}
      className="absolute bottom-32 left-1/2 z-30 flex -translate-x-1/2 animate-bounce items-center gap-3 rounded-full border border-brand/40 bg-black/60 px-5 py-3 text-white backdrop-blur-md sm:bottom-16"
    >
      <kbd className="hidden h-7 w-7 items-center justify-center rounded-md bg-brand font-mono text-sm font-semibold text-ink sm:flex">E</kbd>
      {st.prompt}
    </button>
  );
}

function CoinToast() {
  const last = useGame((s) => s.lastCoin);
  const won = useGame((s) => s.won);
  const [visible, setVisible] = useState<string | null>(null);
  useEffect(() => {
    if (!last) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- show a transient toast per collected coin
    setVisible(last.label);
    const id = setTimeout(() => setVisible(null), 1600);
    return () => clearTimeout(id);
  }, [last]);
  if (won) {
    return (
      <div className="pointer-events-none absolute left-1/2 top-24 z-30 -translate-x-1/2 animate-[panel-in_0.5s_ease] rounded-2xl border border-[#ffd166]/50 bg-black/70 px-6 py-4 text-center backdrop-blur-md">
        <p className="font-display text-3xl text-[#ffd166]">Full stack collected!</p>
        <p className="text-sm text-white/70">You found all {COINS.length} skills. Now visit the mailbox 📬</p>
      </div>
    );
  }
  if (!visible) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-24 z-30 -translate-x-1/2 animate-[panel-in_0.3s_ease] rounded-full bg-black/60 px-4 py-2 font-mono text-sm text-[#ffd166] backdrop-blur-md">
      + {visible}
    </div>
  );
}

function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const active = useRef<number | null>(null);
  const R = 50;
  const update = (cx: number, cy: number) => {
    const b = base.current!.getBoundingClientRect();
    let dx = cx - (b.left + b.width / 2);
    let dy = cy - (b.top + b.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > R) {
      dx = (dx / d) * R;
      dy = (dy / d) * R;
    }
    knob.current!.style.transform = `translate(${dx}px, ${dy}px)`;
    setStick(dx / R, dy / R);
  };
  const end = () => {
    active.current = null;
    knob.current!.style.transform = 'translate(0px, 0px)';
    setStick(0, 0);
  };
  return (
    <div
      ref={base}
      className="absolute bottom-8 left-8 z-30 flex h-32 w-32 touch-none items-center justify-center rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-md"
      onPointerDown={(e) => {
        active.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (active.current === e.pointerId) update(e.clientX, e.clientY);
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div ref={knob} className="h-14 w-14 rounded-full bg-brand/80 shadow-[0_0_20px_rgb(var(--brand)/0.6)] transition-transform duration-75" />
    </div>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  const touch = isTouch();
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/55 p-6 backdrop-blur-sm">
      <div className="glass w-full max-w-md animate-[panel-in_0.5s_cubic-bezier(.2,.9,.3,1.2)] rounded-3xl p-8 text-center">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-brand">Play mode</p>
        <h2 className="mb-3 font-display text-6xl leading-none text-white">Rajkumar's Island</h2>
        <p className="mb-6 text-white/65">
          Explore the island to discover my work. Walk up to buildings to open them, and collect all {COINS.length} skill coins.
        </p>
        <div className="mb-7 grid grid-cols-2 gap-3 text-left text-sm">
          {(touch
            ? [
                ['Joystick', 'move (push far to run)'],
                ['Tap prompt', 'open'],
              ]
            : [
                ['WASD / ← ↑ → ↓', 'move'],
                ['Shift', 'run'],
                ['E / Enter', 'open'],
                ['Esc', 'close / exit'],
              ]
          ).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <p className="font-mono text-xs text-brand">{k}</p>
              <p className="text-white/70">{v}</p>
            </div>
          ))}
        </div>
        <button
          autoFocus
          onClick={onStart}
          className="w-full rounded-2xl bg-brand py-4 font-medium text-ink transition-transform hover:scale-[1.02]"
        >
          Start exploring
        </button>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <Html center>
      <p className="animate-pulse whitespace-nowrap font-mono text-sm text-white/60">Building the island…</p>
    </Html>
  );
}

/* ------------------------------------------------------------------ */
export default function Game({ onExit }: { onExit: () => void }) {
  const [started, setStarted] = useState(false);
  const [muted, setMutedState] = useState(isMuted());
  const collected = useGame((s) => s.collected.length);
  const touch = isTouch();

  useEffect(() => {
    gameStore.reset();
    const unbind = bindKeyboard(() => {
      if (gameStore.get().open) {
        gameStore.open(null);
        sfx.close();
      } else onExit();
    });
    document.body.style.overflow = 'hidden';
    return () => {
      unbind();
      input.frozen = false;
      document.body.style.overflow = '';
    };
  }, [onExit]);

  useEffect(() => {
    input.frozen = !started;
  }, [started]);

  return (
    <div className="fixed inset-0 z-[150] bg-[#070a12] text-white" role="application" aria-label="Portfolio game">
      <Canvas shadows camera={{ position: [0, 26, 34], fov: 50 }} dpr={[1, 1.75]} gl={{ antialias: true }}>
        <Suspense fallback={<Loading />}>
          <World />
          <Player />
        </Suspense>
      </Canvas>

      {/* top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between p-4 sm:p-6">
        <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/45 px-4 py-2 backdrop-blur-md">
          <p className="font-display text-2xl leading-none">Rajkumar's Island</p>
          <p className="mt-1 flex items-center gap-1.5 font-mono text-xs text-[#ffd166]">
            <Coins size={14} /> {collected} / {COINS.length} skills
          </p>
        </div>
        <div className="pointer-events-auto flex gap-2">
          <button
            onClick={() => {
              setMuted(!muted);
              setMutedState(!muted);
            }}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/45 backdrop-blur-md hover:bg-white/10"
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button
            onClick={onExit}
            className="flex h-11 items-center gap-2 rounded-full border border-white/15 bg-black/45 px-4 text-sm backdrop-blur-md hover:bg-white/10"
          >
            <X size={16} /> Exit game
          </button>
        </div>
      </div>

      {!started && <Intro onStart={() => setStarted(true)} />}
      {started && (
        <>
          <Prompt />
          <CoinToast />
          {touch && <Joystick />}
          {!touch && (
            <p className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 font-mono text-xs text-white/40">
              WASD to move · Shift to run · E to open · Esc to exit
            </p>
          )}
        </>
      )}
      <Panel />
    </div>
  );
}
