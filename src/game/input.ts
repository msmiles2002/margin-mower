import { hop, pressDuck, releaseDuck, type Rng, type Run } from '../rules/run';

export const HOP_KEYS: readonly string[] = ['ArrowUp', ' ', 'w', 'W'];
export const DUCK_KEYS: readonly string[] = ['ArrowDown', 's', 'S'];

export type KeyAction = 'hop' | 'duck' | null;

// Touch gestures, in CSS pixels and milliseconds.
export const FLICK_DISTANCE = 18;
export const TAP_MAX_MS = 250;

// A mostly-vertical swipe past FLICK_DISTANCE is a flick (down = duck, up = hop).
// A short touch that barely moved and has ended is a tap (hop). Anything else: keep waiting.
export function classifyGesture(dx: number, dy: number, ms: number, ended = false): KeyAction {
  if (Math.abs(dy) >= FLICK_DISTANCE && Math.abs(dy) > Math.abs(dx)) return dy > 0 ? 'duck' : 'hop';
  const still = Math.abs(dx) < FLICK_DISTANCE && Math.abs(dy) < FLICK_DISTANCE;
  if (ended && still && ms <= TAP_MAX_MS) return 'hop';
  return null;
}

interface Gesture {
  pointerId: number;
  x: number;
  y: number;
  time: number;
  action: KeyAction;
}

export function keyAction(key: string): KeyAction {
  if (HOP_KEYS.includes(key)) return 'hop';
  if (DUCK_KEYS.includes(key)) return 'duck';
  return null;
}

export interface ControlElements {
  canvas: HTMLCanvasElement;
  hopButton: HTMLButtonElement;
  duckButton: HTMLButtonElement;
}

export interface Controls {
  // The run that receives input, or null between properties (keys then do nothing).
  setRun(run: Run | null): void;
}

export function setupControls({ canvas, hopButton, duckButton }: ControlElements, rng: Rng): Controls {
  let active: Run | null = null;
  const pressed = (button: HTMLButtonElement, on: boolean) => button.classList.toggle('active', on);
  const doHop = () => {
    if (active !== null) hop(active);
  };
  const duckOn = () => {
    if (active !== null) pressDuck(active, rng);
  };
  const duckOff = () => {
    if (active !== null) releaseDuck(active);
  };

  window.addEventListener('keydown', (event) => {
    if (active === null) return;
    const action = keyAction(event.key);
    if (action === null) return;
    event.preventDefault();
    if (event.repeat) return;
    if (action === 'hop') {
      doHop();
      pressed(hopButton, true);
    } else {
      duckOn();
      pressed(duckButton, true);
    }
  });
  window.addEventListener('keyup', (event) => {
    const action = keyAction(event.key);
    if (action === 'hop') pressed(hopButton, false);
    if (action === 'duck') {
      duckOff();
      pressed(duckButton, false);
    }
  });

  hopButton.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    doHop();
    pressed(hopButton, true);
  });
  for (const type of ['pointerup', 'pointerleave', 'pointercancel']) {
    hopButton.addEventListener(type, () => pressed(hopButton, false));
  }

  duckButton.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    duckButton.setPointerCapture(event.pointerId);
    duckOn();
    pressed(duckButton, true);
  });
  for (const type of ['pointerup', 'pointercancel']) {
    duckButton.addEventListener(type, () => {
      duckOff();
      pressed(duckButton, false);
    });
  }

  // Mouse: clicking the game hops right away.
  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (event.pointerType === 'mouse') doHop();
  });

  // Touch: flick down to duck and pull, flick up or tap to hop, anywhere outside the control buttons.
  let gesture: Gesture | null = null;
  const onControls = (target: EventTarget | null) => target instanceof Element && target.closest('#controls') !== null;
  window.addEventListener('pointerdown', (event) => {
    if (active === null || event.pointerType === 'mouse' || onControls(event.target)) return;
    event.preventDefault();
    gesture = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp, action: null };
  });
  window.addEventListener('pointermove', (event) => {
    if (gesture === null || event.pointerId !== gesture.pointerId || gesture.action !== null) return;
    const action = classifyGesture(event.clientX - gesture.x, event.clientY - gesture.y, event.timeStamp - gesture.time);
    if (action === 'hop') doHop();
    if (action === 'duck') duckOn();
    gesture.action = action;
  });
  const endGesture = (event: PointerEvent) => {
    if (gesture === null || event.pointerId !== gesture.pointerId) return;
    if (gesture.action === null && event.type === 'pointerup') {
      const action = classifyGesture(event.clientX - gesture.x, event.clientY - gesture.y, event.timeStamp - gesture.time, true);
      if (action === 'hop') doHop();
      if (action === 'duck') {
        duckOn();
        duckOff();
      }
    }
    if (gesture.action === 'duck') duckOff();
    gesture = null;
  };
  window.addEventListener('pointerup', endGesture);
  window.addEventListener('pointercancel', endGesture);
  window.addEventListener('contextmenu', (event) => {
    if (active !== null) event.preventDefault();
  });

  return {
    setRun(run) {
      active = run;
      gesture = null;
      document.body.classList.toggle('playing', run !== null);
      pressed(hopButton, false);
      pressed(duckButton, false);
    },
  };
}
