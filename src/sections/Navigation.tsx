import { useEffect, useState } from 'react';
import { ArrowUpRight, Gamepad2 } from 'lucide-react';
import { startGame } from '@/lib/game';
import { lockScroll, scrollToId } from '@/lib/motion';
import { EMAIL } from '@/data/portfolio';

const navLinks = [
  { label: 'Work', href: '#projects' },
  { label: 'About', href: '#about' },
  { label: 'Experience', href: '#experience' },
  { label: 'Contact', href: '#contact' },
];

/** Label rolls up and a copy rolls in from below on hover. */
function NavLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group relative overflow-hidden py-1 text-[15px] font-medium">
      <span className="block transition-transform duration-500 ease-[cubic-bezier(.7,0,.2,1)] group-hover:-translate-y-full">{label}</span>
      <span className="absolute inset-0 block translate-y-full transition-transform duration-500 ease-[cubic-bezier(.7,0,.2,1)] group-hover:translate-y-0">
        {label}
      </span>
    </button>
  );
}

export function Navigation() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    lockScroll(open);
  }, [open]);

  const go = (href: string) => {
    scrollToId(href);
    setOpen(false);
  };

  return (
    <>
      <nav
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-500 ${
          scrolled && !open ? 'bg-ink/70 shadow-[0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl' : 'bg-transparent'
        }`}
      >
        <div className={`mx-auto flex h-[72px] max-w-[1600px] items-center justify-between px-5 sm:px-8 lg:px-12 text-white`}>
          <button onClick={() => go('#home')} className="font-display text-2xl font-bold tracking-tight">
            RV<sup className="ml-0.5 text-xs font-medium">©</sup>
          </button>
          <div className="hidden items-center gap-10 md:flex">
            {navLinks.map((l) => (
              <NavLink key={l.label} label={l.label} onClick={() => go(l.href)} />
            ))}
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="text-[15px] font-medium md:hidden"
            aria-expanded={open}
            aria-label="Toggle menu"
          >
            {open ? 'Close' : 'Menu'}
          </button>
          <button
            onClick={startGame}
            className="group hidden items-center gap-2 rounded-full bg-brand py-2.5 pl-4 pr-5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-white hover:text-ink md:flex"
          >
            <Gamepad2 size={17} className="transition-transform duration-300 group-hover:rotate-[-12deg]" />
            Play
          </button>
        </div>
      </nav>

      {/* mobile menu: full-screen blue panel */}
      <div
        className="fixed inset-0 z-40 bg-brand text-white transition-[clip-path] duration-700 ease-[cubic-bezier(.7,0,.2,1)] md:hidden"
        style={{ clipPath: open ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)' }}
        aria-hidden={!open}
      >
        <div className="flex h-full flex-col justify-between px-5 pb-10 pt-28">
          <div className="space-y-1">
            {[{ label: 'Home', href: '#home' }, ...navLinks].map((l, i) => (
              <button
                key={l.label}
                tabIndex={open ? 0 : -1}
                onClick={() => go(l.href)}
                className="block font-display text-6xl font-bold transition-all duration-500"
                style={{
                  transitionDelay: open ? `${150 + i * 60}ms` : '0ms',
                  opacity: open ? 1 : 0,
                  transform: open ? 'none' : 'translateY(30px)',
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className="space-y-5">
            <button
              tabIndex={open ? 0 : -1}
              onClick={() => {
                setOpen(false);
                startGame();
              }}
              className="flex items-center gap-3 rounded-full bg-white px-6 py-4 font-semibold text-ink"
            >
              <Gamepad2 size={20} /> Play as a game
            </button>
            <a href={`mailto:${EMAIL}`} tabIndex={open ? 0 : -1} className="flex items-center gap-2 text-lg font-medium">
              {EMAIL} <ArrowUpRight size={18} />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
