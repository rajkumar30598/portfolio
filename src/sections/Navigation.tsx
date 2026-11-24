import { useEffect, useRef, useState } from 'react';
import { Gamepad2, Menu, X } from 'lucide-react';
import { startGame } from '@/lib/game';
import { ScrambleText } from '@/components/motion';
import { lockScroll, scrollToId } from '@/lib/motion';

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Experience', href: '#experience' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
];

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [active, setActive] = useState('#home');
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [pill, setPill] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // highlight whichever section is in the middle of the screen
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(`#${e.target.id}`);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    navLinks.forEach((l) => {
      const el = document.querySelector(l.href);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = linkRefs.current[active];
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
  }, [active]);

  useEffect(() => {
    lockScroll(isMobileMenuOpen);
  }, [isMobileMenuOpen]);

  const scrollToSection = (href: string) => {
    scrollToId(href);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="fixed left-0 right-0 top-0 z-50">
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between px-6 transition-all duration-500 lg:px-10 ${
            isScrolled ? 'h-16' : 'h-24'
          }`}
        >
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('#home');
            }}
            className="group flex items-center gap-2 font-display text-2xl text-white"
          >
            <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-brand font-display text-xl text-ink transition-transform duration-500 group-hover:rotate-[-8deg]">
              RV
            </span>
            <span className="hidden sm:inline">
              Rajkumar<span className="text-brand">.</span>V
            </span>
          </a>

          {/* Desktop: floating glass pill with a sliding active indicator */}
          <div
            className={`relative hidden items-center rounded-full border p-1.5 backdrop-blur-xl transition-colors duration-500 md:flex ${
              isScrolled ? 'border-white/10 bg-ink/60' : 'border-white/5 bg-white/[0.03]'
            }`}
          >
            <span
              aria-hidden="true"
              className="absolute bottom-1.5 top-1.5 rounded-full bg-brand transition-all duration-500 ease-[cubic-bezier(.7,0,.2,1)]"
              style={{ left: pill.left, width: pill.width }}
            />
            {navLinks.map((link) => (
              <a
                key={link.label}
                ref={(el) => {
                  linkRefs.current[link.href] = el;
                }}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(link.href);
                }}
                aria-current={active === link.href ? 'true' : undefined}
                className={`relative z-10 rounded-full px-4 py-2 text-sm transition-colors duration-300 ${
                  active === link.href ? 'text-ink' : 'text-white/75 hover:text-white'
                }`}
              >
                <ScrambleText text={link.label} />
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={startGame}
              className="group flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-medium text-ink transition-transform duration-300 hover:scale-105"
            >
              <Gamepad2 size={17} className="transition-transform duration-300 group-hover:rotate-[-12deg]" />
              Play
            </button>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="relative z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white backdrop-blur-md md:hidden"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu: full-screen panel that wipes down */}
      <div
        className={`fixed inset-0 z-40 bg-ink/95 backdrop-blur-xl transition-[clip-path] duration-700 ease-[cubic-bezier(.7,0,.2,1)] md:hidden`}
        style={{ clipPath: isMobileMenuOpen ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)' }}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="flex h-full flex-col justify-center gap-2 px-8">
          {navLinks.map((link, index) => (
            <a
              key={link.label}
              href={link.href}
              tabIndex={isMobileMenuOpen ? 0 : -1}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(link.href);
              }}
              className="flex items-baseline gap-4 font-display text-6xl text-white transition-all duration-500 hover:text-brand"
              style={{
                transitionDelay: isMobileMenuOpen ? `${150 + index * 70}ms` : '0ms',
                opacity: isMobileMenuOpen ? 1 : 0,
                transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(30px)',
              }}
            >
              <span className="font-mono text-xs text-brand">0{index + 1}</span>
              {link.label}
            </a>
          ))}
          <button
            tabIndex={isMobileMenuOpen ? 0 : -1}
            onClick={() => {
              setIsMobileMenuOpen(false);
              startGame();
            }}
            className="mt-10 flex w-fit items-center gap-3 rounded-full bg-brand px-6 py-4 font-medium text-ink transition-all duration-500"
            style={{ transitionDelay: isMobileMenuOpen ? '600ms' : '0ms', opacity: isMobileMenuOpen ? 1 : 0 }}
          >
            <Gamepad2 size={20} /> Play as a game
          </button>
        </div>
      </div>
    </>
  );
}
