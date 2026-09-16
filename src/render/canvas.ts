import { WORLD_HEIGHT, WORLD_WIDTH } from '../rules/constants';

export const MAX_SCALE = 2.2;
const SIDE_GUTTER = 22;
const RESERVED_HEIGHT = 56 + 150; // HUD bar + control buttons

export interface CanvasFit {
  cssWidth: number;
  cssHeight: number;
  pixelWidth: number;
  pixelHeight: number;
  scale: number;
}

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

// Sizes the canvas to the window at device resolution and keeps drawing in world units.
export function setupCanvas(canvas: HTMLCanvasElement, onResize: () => void): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error('Canvas 2D is not supported');
  const apply = () => {
    const fit = canvasFit(window.innerWidth - SIDE_GUTTER, window.innerHeight - RESERVED_HEIGHT, window.devicePixelRatio || 1);
    canvas.style.width = `${fit.cssWidth}px`;
    canvas.style.height = `${fit.cssHeight}px`;
    canvas.width = fit.pixelWidth;
    canvas.height = fit.pixelHeight;
    ctx.setTransform(fit.scale, 0, 0, fit.scale, 0, 0);
    onResize();
  };
  apply();
  window.addEventListener('resize', apply);
  return ctx;
}
