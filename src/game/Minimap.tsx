import { useEffect, useRef } from 'react';
import { COINS, ISLAND_RADIUS, PLACES, RING_ROAD, STATIONS } from './layout';
import { playerPos, playerYaw } from './runtime';
import { gameStore } from './store';

const SIZE = 168;
const WORLD = ISLAND_RADIUS + 4; // world units from centre to the map edge
const k = SIZE / 2 / WORLD;
const toMap = (x: number, z: number): [number, number] => [SIZE / 2 + x * k, SIZE / 2 + z * k];

const LABELS: Record<string, string> = {
  about: 'About',
  experience: 'Exp',
  'project-1': 'Apps',
  archive: 'Archive',
  contact: 'Contact',
};

/** Live island map: buildings, uncollected coins and the car (north is up). */
export function Minimap() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvas.current!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = c.height = SIZE * dpr;
    const g = c.getContext('2d')!;
    g.scale(dpr, dpr);
    let raf = 0;
    const draw = () => {
      g.clearRect(0, 0, SIZE, SIZE);
      // sea + beach + grass
      g.fillStyle = '#f1d8c0';
      g.beginPath();
      g.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#c85a3a';
      g.beginPath();
      g.arc(SIZE / 2, SIZE / 2, (ISLAND_RADIUS + 0.6) * k, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#f4e7d4';
      g.beginPath();
      g.arc(SIZE / 2, SIZE / 2, ISLAND_RADIUS * k, 0, Math.PI * 2);
      g.fill();
      // ring road + plaza
      g.strokeStyle = '#d4693f';
      g.lineWidth = (RING_ROAD.outer - RING_ROAD.inner) * k;
      g.beginPath();
      g.arc(SIZE / 2, SIZE / 2, ((RING_ROAD.inner + RING_ROAD.outer) / 2) * k, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = '#ead6bc';
      g.beginPath();
      g.arc(SIZE / 2, SIZE / 2, RING_ROAD.inner * k, 0, Math.PI * 2);
      g.fill();
      // buildings
      g.fillStyle = '#241c17';
      for (const [x, z] of [PLACES.house, PLACES.tower, PLACES.kiosk, PLACES.mailbox]) {
        const [mx, my] = toMap(x, z);
        g.fillRect(mx - 3.5, my - 3.5, 7, 7);
      }
      PLACES.boardsZ.forEach((z) => {
        const [mx, my] = toMap(PLACES.boardsX, z);
        g.fillRect(mx - 1.5, my - 3.5, 3, 7);
      });
      // station pads + labels
      g.font = '600 8px Inter, sans-serif';
      g.textAlign = 'center';
      for (const s of STATIONS) {
        const [mx, my] = toMap(s.at[0], s.at[1]);
        g.fillStyle = 'rgba(226,104,66,0.95)';
        g.beginPath();
        g.arc(mx, my, 3, 0, Math.PI * 2);
        g.fill();
        const label = LABELS[s.id];
        if (label) {
          g.fillStyle = 'rgba(36,28,23,0.9)';
          g.fillText(label, mx, my - 6);
        }
      }
      // coins left to collect
      const got = gameStore.get().collected;
      COINS.forEach((c, i) => {
        if (got.includes(i)) return;
        const [mx, my] = toMap(c.at[0], c.at[1]);
        g.fillStyle = '#ffcf4a';
        g.strokeStyle = 'rgba(0,0,0,0.35)';
        g.lineWidth = 1;
        g.beginPath();
        g.arc(mx, my, 2.6, 0, Math.PI * 2);
        g.fill();
        g.stroke();
      });
      // the car: arrow pointing where it's heading
      const [px, py] = toMap(playerPos.x, playerPos.z);
      const yaw = playerYaw.value;
      g.save();
      g.translate(px, py);
      g.rotate(-yaw + Math.PI);
      g.fillStyle = '#fbf3e6';
      g.strokeStyle = '#b8472a';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(0, -7);
      g.lineTo(5, 5);
      g.lineTo(0, 2.5);
      g.lineTo(-5, 5);
      g.closePath();
      g.stroke();
      g.fill();
      g.restore();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="pointer-events-none absolute bottom-6 left-6 z-30 hidden rounded-full bg-[#fbf3e6] p-1.5 shadow-[0_6px_0_rgba(168,71,44,0.3)] sm:block">
      <canvas ref={canvas} style={{ width: SIZE, height: SIZE }} className="rounded-full" aria-label="Island map" />
      <span className="absolute left-1/2 top-1 -translate-x-1/2 font-mono text-[9px] font-bold text-[#241c17]">N</span>
    </div>
  );
}
