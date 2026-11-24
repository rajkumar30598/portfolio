/** Tiny synthesized sound effects (Web Audio), so the game ships no audio files. */
let ctx: AudioContext | null = null;
let muted = false;

export const isMuted = () => muted;
export const setMuted = (m: boolean) => {
  muted = m;
};

function tone(freqs: number[], step: number, type: OscillatorType, gain = 0.06) {
  if (muted) return;
  try {
    ctx ??= new AudioContext();
    const now = ctx.currentTime;
    freqs.forEach((f, i) => {
      const osc = ctx!.createOscillator();
      const g = ctx!.createGain();
      osc.type = type;
      osc.frequency.value = f;
      const t = now + i * step;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + step * 1.8);
      osc.connect(g).connect(ctx!.destination);
      osc.start(t);
      osc.stop(t + step * 2);
    });
  } catch {
    /* audio unavailable: play silently */
  }
}

export const sfx = {
  coin: () => tone([988, 1319], 0.07, 'square', 0.045),
  open: () => tone([523, 659, 784], 0.05, 'triangle'),
  close: () => tone([659, 523], 0.05, 'triangle', 0.04),
  win: () => tone([523, 659, 784, 1047, 784, 1047], 0.09, 'square', 0.05),
};
