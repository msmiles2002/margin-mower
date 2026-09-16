import { hop, pressDuck, releaseDuck, type Rng, type Run } from '../rules/run';

export const HOP_KEYS: readonly string[] = ['ArrowUp', ' ', 'w', 'W'];
export const DUCK_KEYS: readonly string[] = ['ArrowDown', 's', 'S'];

export type KeyAction = 'hop' | 'duck' | null;

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

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    doHop();
  });
  window.addEventListener('contextmenu', (event) => {
    if (active !== null) event.preventDefault();
  });

  return {
    setRun(run) {
      active = run;
      pressed(hopButton, false);
      pressed(duckButton, false);
    },
  };
}
