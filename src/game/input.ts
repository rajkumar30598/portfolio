/**
 * Mutable input state read every frame by the car. Keyboard and the on-screen
 * joystick both write here, so the car code doesn't care which.
 */
export const input = {
  /** steering, -1 (left) .. 1 (right) */
  x: 0,
  /** -1 = accelerate (up / W), 1 = brake / reverse (down / S) */
  z: 0,
  /** Shift: boost */
  run: false,
  /** Space: handbrake for drifting */
  handbrake: false,
  /** set true for one frame when the player presses interact */
  interact: false,
  /** set true for one frame when the player asks to reset the car */
  reset: false,
  /** true while a UI panel is open: the car ignores input */
  frozen: false,
};

const keys = new Set<string>();

function recompute() {
  const left = keys.has('arrowleft') || keys.has('a');
  const right = keys.has('arrowright') || keys.has('d');
  const up = keys.has('arrowup') || keys.has('w');
  const down = keys.has('arrowdown') || keys.has('s');
  input.x = (right ? 1 : 0) - (left ? 1 : 0);
  input.z = (down ? 1 : 0) - (up ? 1 : 0);
  input.run = keys.has('shift');
  input.handbrake = keys.has(' ');
}

export function bindKeyboard(onEscape: () => void) {
  const down = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (k === 'escape') {
      onEscape();
      return;
    }
    if ((e.target as HTMLElement).closest('input, textarea')) return;
    if (k === 'e' || k === 'enter') {
      e.preventDefault();
      if (!e.repeat) input.interact = true;
      return;
    }
    if (k === 'r') {
      if (!e.repeat) input.reset = true;
      return;
    }
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    keys.add(k);
    recompute();
  };
  const up = (e: KeyboardEvent) => {
    keys.delete(e.key.toLowerCase());
    recompute();
  };
  const blur = () => {
    keys.clear();
    recompute();
  };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', blur);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
    window.removeEventListener('blur', blur);
    keys.clear();
    recompute();
  };
}

/** Joystick writes a vector directly (already clamped to the unit circle). */
export function setStick(x: number, z: number) {
  input.x = x;
  input.z = z;
  input.run = z < -0.92;
}
