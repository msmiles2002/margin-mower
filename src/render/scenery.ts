// Background, street and lawn, ported from prototype/margin-mower-runner.html.
import { COL, LAWN_BOTTOM, LAWN_TOP, WORLD_HEIGHT as H, WORLD_WIDTH as W } from '../rules/constants';
import type { ColumnKind, Level, Property } from '../rules/levels';
import { OUTLINE as OL, box, context, ellipse, hash, poly, rect, roundRect, shade, text } from './draw';

const BAND = LAWN_BOTTOM - LAWN_TOP;

export function drawSky(): void {
  const g = context().createLinearGradient(0, 0, 0, LAWN_TOP);
  g.addColorStop(0, '#5fb4ea');
  g.addColorStop(1, '#bfe6f7');
  rect(0, 0, W, LAWN_TOP, g);
}

export function drawClouds(cam: number): void {
  for (let i = 0; i < 7; i++) {
    const x = (((i * 131 - cam * 0.1) % 640) + 640) % 640 - 80;
    const y = 16 + ((i * 29) % 50);
    ellipse(x, y, 22, 7, '#ffffff');
    ellipse(x + 14, y - 5, 14, 8, '#ffffff');
    ellipse(x - 12, y - 2, 10, 5, '#ffffff');
  }
}

const HOUSE_BODIES = ['#f2d7a6', '#bcd6ea', '#f3c0ae', '#d3e6b5', '#e8e2f2'];
const HOUSE_ROOFS = ['#9b3d31', '#4d5d7a', '#6b4a3a', '#3f6e4f', '#7a4f7f'];

// White picket fence standing on the back edge of the sidewalk, with a gap for the front walk.
function picketFence(from: number, to: number, base: number, gapFrom: number, gapTo: number): void {
  const top = base - 13;
  const segments: [number, number][] = [[from, gapFrom], [gapTo, to]];
  for (const [a, b] of segments) {
    rect(a, top + 4, b - a, 2, OL);
    rect(a, top + 9, b - a, 2, OL);
    rect(a, top + 4.5, b - a, 1, '#e6e3d8');
    rect(a, top + 9.5, b - a, 1, '#e6e3d8');
    for (let px = a + 1; px + 4 <= b; px += 8) {
      poly([[px, base], [px, top + 2], [px + 2, top], [px + 4, top + 2], [px + 4, base]], '#fbfbf5', OL, 0.8);
    }
  }
}

function house(x: number, base: number, variant: number): void {
  const body = HOUSE_BODIES[variant % 5];
  const roof = HOUSE_ROOFS[variant % 5];
  const w = 96;
  const h = 46;
  const depth = 18;
  const top = base - h;
  // tree behind
  rect(x + 108, base - 58, 6, 58, '#6b4423');
  ellipse(x + 111, base - 66, 22, 18, '#3c7f35', OL);
  ellipse(x + 104, base - 72, 10, 8, '#4f9a44');
  // 3/4 side face, front face, roof
  poly([[x + w, top], [x + w + depth, top - 10], [x + w + depth, base - 10], [x + w, base]], shade(body, -0.22));
  box(x, top, w, h, body);
  for (let i = 1; i < 6; i++) rect(x, top + i * 8, w, 1, shade(body, -0.08));
  poly([[x - 8, top + 1], [x + w / 2, top - 30], [x + w + 8, top + 1]], roof);
  poly([[x + w / 2, top - 30], [x + w / 2 + depth, top - 40], [x + w + 8 + depth, top - 9], [x + w + 8, top + 1]], shade(roof, -0.25));
  rect(x - 8, top, w + 16, 2, shade(roof, -0.35));
  const windowAt = (wx: number, wy: number) => {
    box(wx, wy, 16, 13, '#a8d8f0');
    rect(wx + 7, wy, 2, 13, '#ffffff');
    rect(wx, wy + 6, 16, 1, '#ffffff');
    rect(wx - 2, wy - 1, 3, 15, shade(roof, 0.1));
    rect(wx + 15, wy - 1, 3, 15, shade(roof, 0.1));
  };
  windowAt(x + 10, top + 12);
  windowAt(x + 70, top + 12);
  box(x + 40, top + 18, 16, 28, shade(roof, 0.15));
  rect(x + 52, top + 32, 2, 2, '#f5c542');
  rect(x + 34, base - 3, 28, 3, '#d9d4c7');
  picketFence(x - 37, x + 133, base, x + 32, x + 64);
  // mailbox
  rect(x + 124, base - 4, 2, 14, '#5a4030');
  box(x + 119, base - 10, 12, 7, '#2f5fa8');
  rect(x + 131, base - 12, 1, 5, '#e23b3b');
}

function officeBuilding(x: number, base: number, variant: number): void {
  const w = 120 + (variant % 3) * 16;
  const h = 70 + (variant % 4) * 14;
  const depth = 22;
  const top = base - h;
  poly([[x + w, top], [x + w + depth, top - 12], [x + w + depth, base - 12], [x + w, base]], '#5d6f86');
  poly([[x, top], [x + depth, top - 12], [x + w + depth, top - 12], [x + w, top]], '#9fb0c4');
  box(x, top, w, h, '#7f95ad');
  for (let wy = top + 6; wy < base - 18; wy += 12) {
    const g = context().createLinearGradient(0, wy, 0, wy + 8);
    g.addColorStop(0, '#d6ecfa');
    g.addColorStop(1, '#6fa8d0');
    rect(x + 4, wy, w - 8, 8, g);
    for (let wx = x + 4; wx < x + w - 4; wx += 18) rect(wx, wy, 1, 8, '#51677f');
  }
  box(x + w / 2 - 14, base - 16, 28, 16, '#a8d8f0');
  rect(x + w / 2, base - 16, 1, 16, '#51677f');
  if (variant % 2 === 0) {
    box(x + 8, top - 10, 44, 9, '#127DB9');
    text('N.VALLEY', x + 10, top - 5, '6px "Press Start 2P"', '#ffffff', 'left');
  }
  for (let hx = x - 10; hx < x + w + 20; hx += 14) ellipse(hx + 7, base + 3, 8, 6, '#3f8a3a', OL);
}

export function drawBackdrop(kind: Property['backdrop'], cam: number): void {
  const base = LAWN_TOP - 10;
  const span = kind === 'office' ? 190 : 170;
  const parallax = 0.85;
  const start = Math.floor((cam * parallax - 200) / span);
  for (let i = start; i < start + 5; i++) {
    const x = i * span - cam * parallax;
    if (kind === 'office') officeBuilding(x, base, Math.abs(i));
    else house(x, base, Math.abs(i));
  }
}

const CAR_COLORS = ['#d64533', '#2f5fa8', '#f5c542', '#3f8a3a'];

export function drawSidewalkAndStreet(cam: number): void {
  rect(0, LAWN_TOP - 10, W, 10, '#d7d3c9');
  rect(0, LAWN_TOP - 10, W, 1, '#f1eee6');
  rect(0, LAWN_TOP - 1, W, 1, '#b5b0a4');
  for (let x = -(((cam % 40) + 40) % 40); x < W; x += 40) rect(x, LAWN_TOP - 10, 1, 10, '#b5b0a4');
  rect(0, LAWN_BOTTOM, W, 7, '#c9c5bb');
  rect(0, LAWN_BOTTOM, W, 2, '#ecebe4');
  rect(0, LAWN_BOTTOM + 7, W, 1, OL);
  rect(0, LAWN_BOTTOM + 8, W, H - LAWN_BOTTOM - 8, '#4a4b55');
  for (let x = -(((cam % 60) + 60) % 60); x < W; x += 60) rect(x, 248, 30, 3, '#f1c232');
  for (let i = Math.floor((cam - 300) / 420); i < Math.floor((cam + W) / 420) + 1; i++) {
    const x = i * 420 + 260 - cam;
    const color = CAR_COLORS[((i % 4) + 4) % 4];
    ellipse(x + 30, 262, 32, 4, 'rgba(0,0,0,.3)');
    poly([[x, 258], [x + 4, 246], [x + 14, 246], [x + 20, 236], [x + 44, 236], [x + 52, 246], [x + 60, 247], [x + 60, 258]], color);
    poly([[x + 22, 238], [x + 30, 238], [x + 30, 245], [x + 17, 245]], '#bfe3f5', null);
    poly([[x + 33, 238], [x + 43, 238], [x + 49, 245], [x + 33, 245]], '#bfe3f5', null);
    for (const wx of [x + 14, x + 48]) {
      ellipse(wx, 258, 6, 6, '#222222', OL);
      ellipse(wx, 258, 2, 2, '#aaaaaa');
    }
  }
}

function drawGrassColumn(x: number, col: number, mowed: boolean): void {
  if (mowed) {
    rect(x, LAWN_TOP, COL, BAND, col % 2 ? '#7cc85a' : '#93d872');
    rect(x, LAWN_TOP, 1, BAND, 'rgba(0,0,0,.05)');
    return;
  }
  rect(x, LAWN_TOP, COL, BAND, '#4b9a37');
  const h = hash(col);
  for (let k = 0; k < 10; k++) {
    const tx = x + ((h >>> (k * 3)) % COL);
    const ty = LAWN_TOP + 4 + ((h >>> (k * 2 + 5)) % (BAND - 6));
    rect(tx, ty - 4, 1, 4, '#357a27');
    rect(tx + 2, ty - 3, 1, 3, '#5fb046');
    rect(tx - 2, ty - 2, 1, 2, '#357a27');
  }
}

export function drawLawn(level: Level, mowed: ReadonlySet<number>, cam: number): void {
  const kindAt = (col: number): ColumnKind => (col >= 0 && col < level.columns.length ? level.columns[col] : 'walkway');
  const weedCols = new Set(level.weeds.map((w) => w.col));
  const first = Math.floor(cam / COL) - 1;
  const last = Math.floor((cam + W) / COL) + 1;

  for (let col = first; col <= last; col++) {
    const x = col * COL - cam;
    const kind = kindAt(col);
    if (kind === 'pad') rect(x, LAWN_TOP, COL, BAND, '#b08a5a');
    else if (kind === 'grass') drawGrassColumn(x, col, mowed.has(col));
    else if (kind === 'bed') drawGrassColumn(x, col, false);
    else rect(x, LAWN_TOP, COL, BAND, '#4b9a37');
    if (kind === 'walkway') {
      poly([[x + 2, LAWN_TOP], [x + 22, LAWN_TOP], [x + 24, LAWN_BOTTOM], [x, LAWN_BOTTOM]], '#dcd8ce', null);
      rect(x, LAWN_TOP + 26, COL, 1, '#bdb8ad');
    }
  }

  // Beds and dirt pads are drawn once per run of adjacent columns.
  let col = first;
  while (col <= last) {
    const kind = kindAt(col);
    if (kind !== 'bed' && kind !== 'pad') {
      col++;
      continue;
    }
    let end = col;
    while (end + 1 < level.columns.length && kindAt(end + 1) === kind) end++;
    const x0 = col * COL - cam;
    const x1 = (end + 1) * COL - cam;
    const count = end - col + 1;
    if (kind === 'bed') {
      roundRect(x0 + 1, LAWN_TOP + 8, x1 - x0 - 2, BAND - 12, 10, '#7a4b2a', '#c8c0b0', 2);
      for (let k = 0; k < count * 8; k++) {
        const hh = hash(col * 31 + k);
        rect(x0 + 4 + (hh % Math.max(1, x1 - x0 - 8)), LAWN_TOP + 12 + ((hh >>> 8) % (BAND - 20)), 2, 1, '#5c3620');
      }
      for (let k = col; k <= end; k++) {
        if (!weedCols.has(k) && hash(k) & 1) {
          const bx = k * COL - cam + 12;
          ellipse(bx, LAWN_TOP + 20, 8, 6, '#3f8a3a', OL);
          ellipse(bx - 2, LAWN_TOP + 18, 3, 2, '#5fb046');
        }
      }
    } else {
      rect(x0, LAWN_TOP, x1 - x0, BAND, '#b08a5a');
      rect(x0, LAWN_TOP, 2, BAND, '#8f6a3e');
      rect(x1 - 2, LAWN_TOP, 2, BAND, '#8f6a3e');
      roundRect(x0 + 6, LAWN_TOP + 6, x1 - x0 - 12, BAND - 12, 8, '#c29c6a');
      for (let k = 0; k < count * 6; k++) {
        const hh = hash(col * 17 + k);
        rect(x0 + 4 + (hh % Math.max(1, x1 - x0 - 8)), LAWN_TOP + 4 + ((hh >>> 8) % (BAND - 8)), 2, 2, '#9a7648');
      }
    }
    col = end + 1;
  }
}
