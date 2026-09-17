import { WORLD_HEIGHT, WORLD_WIDTH } from '../rules/constants';

export const MAX_SCALE = 2.2;
const SIDE_GUTTER = 22;
const DESKTOP_RESERVED_HEIGHT = 160; // control buttons below the game
const WIDE_ASPECT = WORLD_WIDTH / WORLD_HEIGHT;
const MOBILE_VIEW_WIDTH = 300;

// The part of the world the camera shows, in world units. `top` is the world y at the top edge
// (negative = extra sky above the classic view); `mowerX` is where the crew sits from the left.
export interface View {
  width: number;
  height: number;
  top: number;
  mowerX: number;
}

export const DESKTOP_VIEW: View = { width: WORLD_WIDTH, height: WORLD_HEIGHT, top: 0, mowerX: 130 };

export interface CanvasFit {
  cssWidth: number;
  cssHeight: number;
  pixelWidth: number;
  pixelHeight: number;
  scale: number;
}

// Desktop: the classic 480 × 270 view, letterboxed and capped at MAX_SCALE.
export function canvasFit(availableWidth: number, availableHeight: number, devicePixelRatio: number): CanvasFit {
  const fit = Math.max(0.1, Math.min(availableWidth / WORLD_WIDTH, availableHeight / WORLD_HEIGHT, MAX_SCALE));
  const pixelWidth = Math.round(WORLD_WIDTH * fit * devicePixelRatio);
  return {
    cssWidth: WORLD_WIDTH * fit,
    cssHeight: WORLD_HEIGHT * fit,
    pixelWidth,
    pixelHeight: Math.round(WORLD_HEIGHT * fit * devicePixelRatio),
    scale: pixelWidth / WORLD_WIDTH,
  };
}

// Mobile screens fill the available area: a zoomed-in view (bigger sprites) that grows taller with
// extra sky above and a little extra street below. Very wide screens keep the classic view.
export function viewFor(cssWidth: number, cssHeight: number, mobile: boolean): View {
  const aspect = cssWidth / cssHeight;
  if (!mobile || aspect >= WIDE_ASPECT) return DESKTOP_VIEW;
  const width = Math.max(MOBILE_VIEW_WIDTH, Math.min(WORLD_WIDTH, Math.round(WORLD_HEIGHT * aspect)));
  const height = Math.round(width / aspect);
  const extraBelow = Math.min(90, Math.round((height - WORLD_HEIGHT) * 0.3));
  return { width, height, top: WORLD_HEIGHT + extraBelow - height, mowerX: Math.max(60, Math.round(width * 0.23)) };
}

// Phones and tablets held upright get the phone layout; a tall desktop browser window does not.
export const isMobileLayout = (windowWidth: number, windowHeight: number, touchScreen: boolean): boolean =>
  windowWidth < 700 || (touchScreen && windowHeight > windowWidth);

export const hasTouchScreen = (): boolean => window.matchMedia('(pointer: coarse)').matches;

export interface CanvasLayout extends CanvasFit {
  mobile: boolean;
  view: View;
}

// `controlsHeight` is the space the control pad takes below the game (0 when it's hidden).
export function canvasLayout(
  windowWidth: number,
  windowHeight: number,
  controlsHeight: number,
  devicePixelRatio: number,
  touchScreen: boolean,
): CanvasLayout {
  const mobile = isMobileLayout(windowWidth, windowHeight, touchScreen);
  if (!mobile) {
    return { mobile, view: DESKTOP_VIEW, ...canvasFit(windowWidth - SIDE_GUTTER, windowHeight - DESKTOP_RESERVED_HEIGHT, devicePixelRatio) };
  }
  const availableHeight = Math.max(100, windowHeight - controlsHeight);
  const view = viewFor(windowWidth, availableHeight, true);
  const cssWidth = view === DESKTOP_VIEW ? Math.min(windowWidth, availableHeight * WIDE_ASPECT) : windowWidth;
  const cssHeight = view === DESKTOP_VIEW ? cssWidth / WIDE_ASPECT : availableHeight;
  const pixelWidth = Math.round(cssWidth * devicePixelRatio);
  return {
    mobile,
    view,
    cssWidth,
    cssHeight,
    pixelWidth,
    pixelHeight: Math.round(cssHeight * devicePixelRatio),
    scale: pixelWidth / view.width,
  };
}

function desktopBelowGame(): number {
  const pad = document.getElementById('controls');
  if (pad === null) return 0;
  return pad.getBoundingClientRect().height + parseFloat(getComputedStyle(pad).marginTop || '0');
}

export interface GameCanvas {
  ctx: CanvasRenderingContext2D;
  view(): View;
  refit(): void;
}

// Sizes the canvas to the screen at device resolution and maps world units onto it.
// `controlsHeight()` reports the control pad's current height; call refit() when it changes.
export function setupCanvas(canvas: HTMLCanvasElement, controlsHeight: () => number, onResize: () => void): GameCanvas {
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error('Canvas 2D is not supported');
  let current: View = DESKTOP_VIEW;
  const refit = () => {
    const layout = canvasLayout(window.innerWidth, window.innerHeight, controlsHeight(), window.devicePixelRatio || 1, hasTouchScreen());
    document.body.classList.toggle('mobile', layout.mobile);
    canvas.style.width = `${layout.cssWidth}px`;
    canvas.style.height = `${layout.cssHeight}px`;
    canvas.width = layout.pixelWidth;
    canvas.height = layout.pixelHeight;
    ctx.setTransform(layout.scale, 0, 0, layout.scale, 0, -layout.view.top * layout.scale);
    current = layout.view;
    // Space the control pad takes under the game on desktop, so panels can center on the game itself.
    document.documentElement.style.setProperty('--below-game', layout.mobile ? '0px' : `${desktopBelowGame()}px`);
    onResize();
  };
  refit();
  window.addEventListener('resize', refit);
  return { ctx, view: () => current, refit };
}
