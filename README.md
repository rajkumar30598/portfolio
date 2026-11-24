# Rajkumar V – Portfolio

Personal portfolio site for a front-end developer, built with React, TypeScript, Vite and Tailwind CSS, with a three.js (React Three Fiber) background scene, GSAP scroll animations and Lenis smooth scrolling.

**Live site:** https://rajkumarv-portfolio.vercel.app

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)

## Features

- **Single-page layout** with sections: Hero, About, Experience, Projects and Contact, plus a Navigation bar and Footer
- **three.js scene** (`src/three/BackgroundScene.tsx`): a noise-displaced shader orb, particle field and floating shapes behind the whole page. It follows the scroll position and pointer, and gets more turbulent when you scroll fast. Loaded lazily in its own chunk.
- **Motion** (`src/components/motion.tsx`): preloader, custom cursor, magnetic buttons, 3D tilt cards, word-by-word heading reveals, scroll-reactive tech marquees, count-up stats and a scroll progress bar
- **Projects**: pinned horizontal scroll on desktop, stacked on mobile; app cards show real screenshots in phone and browser frames
- **Lenis smooth scrolling** synced with GSAP ScrollTrigger (`src/lib/motion.ts`)
- **Reduced-motion support**: animations are skipped when the user prefers reduced motion
- **Responsive navigation** with a mobile menu toggle
- **Skills grid** (JavaScript, TypeScript, Angular, React, RxJS, Redux, Tailwind, WebSocket, Firebase and more)
- **Projects showcase** with seven project cards: three shipped personal apps (Rookwise, AdFree Tube, PDF Toolkit) with live links, plus four earlier projects
- **Contact form** opens the visitor's email app with the message pre-filled (no backend)
- **UI primitives** from shadcn/ui (Radix UI + Tailwind), with an `@/` path alias to `src/`

## Project structure

```
src/
├── App.tsx               # registers ScrollTrigger and composes the sections
├── sections/             # Navigation, Hero, About, Experience, Projects, Contact, Footer
├── components/
│   ├── AnimatedText.tsx  # reusable animated text helpers
│   └── ui/               # shadcn/ui components
├── hooks/                # useScrollProgress, use-mobile
└── lib/utils.ts
public/images/            # profile and project images
```

## Tech stack

| Package | Version |
| --- | --- |
| React / React DOM | ^19.2.0 |
| TypeScript | ~5.9.3 |
| Vite | ^7.2.4 |
| Tailwind CSS | ^3.4.19 |
| GSAP (+ @gsap/react) | ^3.14.2 |
| three / @react-three/fiber / drei | ^0.182 / ^9.5 / ^10.7 |
| Lenis | 1.3.4 |
| Radix UI / shadcn/ui | various |
| lucide-react (icons) | ^0.562.0 |
| Sonner (toasts) | ^2.0.7 |

## Getting started

Requires Node.js 20.19+ (needed by Vite 7).

```bash
git clone https://github.com/rajkumar30598/portfolio.git
cd portfolio
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # type-check (tsc -b) and build to dist/
npm run preview    # serve the production build locally
npm run lint       # ESLint
```

## Deployment

The site is deployed on Vercel. `vite.config.ts` uses `base: './'`, so the build output in `dist/` can also be served from any static host.
