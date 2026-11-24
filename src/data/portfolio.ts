/** Portfolio content shared by the scrolling site and the game. */

export type Project = {
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

export type Visual =
  | { kind: 'phones'; shots: [string, string, string]; from: string; to: string; glow: string }
  | { kind: 'browser'; shots: [string, string]; from: string; to: string; glow: string; url: string };

export const projects: Project[] = [
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

export const experiences = [
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

export const stackRowA = ['JavaScript', 'TypeScript', 'Angular', 'React', 'React Native', 'Next.js', 'RxJS', 'Redux'];
export const stackRowB = ['Tailwind', 'HTML / SCSS', 'WebSocket', 'REST APIs', 'Firebase', 'Expo', 'Zustand', 'Git'];


export const EMAIL = 'rajkumar30598@gmail.com';
export const PHONE = { label: '+91-97894-54245', href: 'tel:+919789454245' };
export const LINKEDIN = 'https://www.linkedin.com/in/rajkumar-v-b11282225/';
export const GITHUB = 'https://github.com/rajkumar30598';
