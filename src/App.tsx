import { lazy, Suspense, useEffect, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Toaster } from '@/components/ui/sonner';
import { Cursor, Preloader, ScrollProgress } from '@/components/motion';
import { initSmoothScroll } from '@/lib/motion';
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

function App() {
  const [ready, setReady] = useState(false);

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
    <div className="relative min-h-screen overflow-x-clip bg-[#0b0b0d] text-white">
      <Suspense fallback={null}>
        <BackgroundScene />
      </Suspense>
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
