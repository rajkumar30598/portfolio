import { ArrowUp } from 'lucide-react';
import { scrollToId } from '@/lib/motion';

export function Footer() {
  return (
    <footer className="relative z-10 bg-ink text-white">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 border-t border-white/10 px-5 py-8 text-sm font-medium text-white/60 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <span>© {new Date().getFullYear()} Rajkumar V</span>
        <span>Designed & built in Bangalore</span>
        <button onClick={() => scrollToId('#home')} className="group flex items-center gap-2 self-start transition-colors hover:text-white sm:self-auto">
          Back to top
          <ArrowUp size={16} className="transition-transform group-hover:-translate-y-1" />
        </button>
      </div>
    </footer>
  );
}
