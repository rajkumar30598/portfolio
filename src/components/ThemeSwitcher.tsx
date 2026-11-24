import { THEMES, setTheme, useTheme } from '@/lib/theme';

const rgb = (c: [number, number, number]) => `rgb(${c.join(',')})`;

/** Row of colour swatches; switching plays a circular reveal from the clicked swatch. */
export function ThemeSwitcher({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const active = useTheme();
  const dim = size === 'lg' ? 'h-10 w-10' : 'h-5 w-5';
  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur-md"
    >
      {THEMES.map((t) => {
        const on = t.id === active.id;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={`${t.name} theme`}
            title={t.name}
            onClick={(e) => {
              const b = e.currentTarget.getBoundingClientRect();
              setTheme(t.id, { x: b.left + b.width / 2, y: b.top + b.height / 2 });
            }}
            className={`${dim} relative rounded-full transition-transform duration-300 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white`}
            style={{
              background: `conic-gradient(from 210deg, ${rgb(t.brand)}, ${rgb(t.brand3)}, ${rgb(t.brand2)}, ${rgb(t.brand)})`,
              boxShadow: on ? `0 0 0 2px rgb(${t.ink.join(',')}), 0 0 0 3.5px ${rgb(t.brand)}, 0 0 16px ${rgb(t.brand)}` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
