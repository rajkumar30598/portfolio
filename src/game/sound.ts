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
  bonk: () => tone([180, 120], 0.05, 'sine', 0.09),
  crash: () => tone([90, 60], 0.08, 'sawtooth', 0.05),
  land: () => tone([110], 0.09, 'sine', 0.08),
};

/* ---------- engine hum: two detuned oscillators through a low-pass filter ---------- */
let engine: { a: OscillatorNode; b: OscillatorNode; gain: GainNode; filter: BiquadFilterNode } | null = null;

export function startEngine() {
  if (engine) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const a = ctx.createOscillator();
    const b = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    a.type = 'sawtooth';
    b.type = 'square';
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    gain.gain.value = 0;
    a.connect(filter);
    b.connect(filter);
    filter.connect(gain).connect(ctx.destination);
    a.start();
    b.start();
    engine = { a, b, gain, filter };
  } catch {
    /* audio unavailable */
  }
}

/** speed01: 0..1 of top speed; throttle: is the player accelerating */
export function setEngine(speed01: number, throttle: boolean) {
  if (!engine || !ctx) return;
  const t = ctx.currentTime;
  const f = 48 + speed01 * 110 + (throttle ? 12 : 0);
  engine.a.frequency.setTargetAtTime(f, t, 0.08);
  engine.b.frequency.setTargetAtTime(f * 0.501, t, 0.08);
  engine.filter.frequency.setTargetAtTime(300 + speed01 * 900, t, 0.1);
  engine.gain.gain.setTargetAtTime(muted ? 0 : 0.018 + speed01 * 0.03 + (throttle ? 0.012 : 0), t, 0.1);
}

export function stopEngine() {
  if (!engine) return;
  try {
    engine.a.stop();
    engine.b.stop();
    engine.gain.disconnect();
  } catch {
    /* already stopped */
  }
  engine = null;
}
