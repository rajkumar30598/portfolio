import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Toaster } from '@/components/ui/sonner';
import { Cursor, Preloader, ScrollProgress } from '@/components/motion';
import { useSpotlight } from '@/hooks/useSpotlight';
import { initSmoothScroll, lockScroll } from '@/lib/motion';
import { PLAY_EVENT } from '@/lib/game';
import { Navigation } from './sections/Navigation';
import { Hero } from './sections/Hero';
import { About } from './sections/About';
import { Experience } from './sections/Experience';
import { Projects } from './sections/Projects';
import { Contact } from './sections/Contact';
import { Footer } from './sections/Footer';
import './App.css';

// three.js is heavy: load the scene in its own chunk so text paints first
const BackgroundScene = lazy(() => import('./three/BackgroundScene'));
// the game is only downloaded when someone presses Play
const Game = lazy(() => import('./game/Game'));

function App() {
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(() => typeof window !== 'undefined' && window.location.hash === '#play');
  useSpotlight();

  useEffect(() => {
    const open = () => setPlaying(true);
    window.addEventListener(PLAY_EVENT, open);
    return () => window.removeEventListener(PLAY_EVENT, open);
  }, []);

  useEffect(() => {
    lockScroll(playing);
    if (playing) history.replaceState(null, '', '#play');
    else if (window.location.hash === '#play') history.replaceState(null, '', window.location.pathname);
  }, [playing]);

  const exitGame = useCallback(() => setPlaying(false), []);

  useEffect(() => {
    const cleanup = initSmoothScroll();
    // images and fonts change section heights, which pinned triggers depend on
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    document.fonts?.ready.then(refresh);
    return () => {
      window.removeEventListener('load', refresh);
      cleanup();
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-ink text-white">
      {/* pause the background scene while the game owns the GPU */}
      {!playing && (
        <Suspense fallback={null}>
          <BackgroundScene />
        </Suspense>
      )}
      {playing && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#070a12] font-mono text-sm text-white/60">
              Loading game…
            </div>
          }
        >
          <Game onExit={exitGame} />
        </Suspense>
      )}
      <Preloader onDone={() => setReady(true)} />
      <Cursor />
      <ScrollProgress />
      <Navigation />
      <main className="relative z-10">
        <Hero ready={ready} />
        <About />
        <Experience />
        <Projects />
        <Contact />
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(20,20,24,0.9)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
          },
        }}
      />
    </div>
  );
}

export default App;
