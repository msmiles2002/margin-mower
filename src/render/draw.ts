// Small drawing helpers shared by sprites and scenery. Call useContext() once before drawing.
export const OUTLINE = '#1b1b24';

export type Point = readonly [number, number];
type Fill = string | CanvasGradient;

let current: CanvasRenderingContext2D | null = null;

export function useContext(ctx: CanvasRenderingContext2D): void {
  current = ctx;
}

export function context(): CanvasRenderingContext2D {
  if (current === null) throw new Error('Drawing context has not been set');
  return current;
}

export function rect(x: number, y: number, w: number, h: number, fill: Fill): void {
  const c = context();
  c.fillStyle = fill;
  c.fillRect(x, y, w, h);
}

export function box(x: number, y: number, w: number, h: number, fill: Fill, outline = OUTLINE): void {
  rect(x - 1, y - 1, w + 2, h + 2, outline);
  rect(x, y, w, h, fill);
}

function finish(fill: Fill | null, stroke: string | null, lineWidth: number): void {
  const c = context();
  if (fill !== null) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke !== null) {
    c.lineWidth = lineWidth;
    c.lineJoin = 'round';
    c.strokeStyle = stroke;
    c.stroke();
  }
}

export function poly(points: readonly Point[], fill: Fill | null, stroke: string | null = OUTLINE, lineWidth = 1): void {
  const c = context();
  c.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? c.moveTo(x, y) : c.lineTo(x, y)));
  c.closePath();
  finish(fill, stroke, lineWidth);
}

export function ellipse(x: number, y: number, rx: number, ry: number, fill: Fill | null, stroke: string | null = null, lineWidth = 1): void {
  const c = context();
  c.beginPath();
  c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
  finish(fill, stroke, lineWidth);
}

export function roundRect(x: number, y: number, w: number, h: number, r: number, fill: Fill | null, stroke: string | null = null, lineWidth = 1): void {
  const c = context();
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  finish(fill, stroke, lineWidth);
}

export function line(x1: number, y1: number, x2: number, y2: number, color: string, lineWidth = 1): void {
  const c = context();
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.lineCap = 'round';
  c.lineWidth = lineWidth;
  c.strokeStyle = color;
  c.stroke();
}

// Top half-disc (a cap) centered at (x, y).
export function cap(x: number, y: number, r: number, fill: string, stroke: string | null = OUTLINE, lineWidth = 2): void {
  const c = context();
  c.beginPath();
  c.arc(x, y, r, Math.PI, 0);
  c.closePath();
  finish(fill, stroke, lineWidth);
}

export function arcStroke(x: number, y: number, r: number, start: number, end: number, color = OUTLINE, lineWidth = 1): void {
  const c = context();
  c.beginPath();
  c.arc(x, y, r, start, end);
  c.lineWidth = lineWidth;
  c.strokeStyle = color;
  c.stroke();
}

export function withAlpha(alpha: number, draw: () => void): void {
  const c = context();
  c.globalAlpha = alpha;
  draw();
  c.globalAlpha = 1;
}

export function text(value: string, x: number, y: number, font: string, fill: string, align: CanvasTextAlign = 'center'): void {
  const c = context();
  c.font = font;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillStyle = fill;
  c.fillText(value, x, y);
}

// Lighten (amount > 0) or darken (amount < 0) a #rrggbb color.
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + (amount < 0 ? v * amount : (255 - v) * amount))));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

// Deterministic pseudo-random bits for scenery details.
export function hash(n: number): number {
  const h = Math.imul(n + 7, 374761393) >>> 0;
  return Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
}

// Small idle animation offset.
export const bob = (period: number, amount: number): number => Math.round(Math.sin(performance.now() / period) * amount);
