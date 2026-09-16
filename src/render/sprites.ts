// Style B ("bold cartoon") sprites, ported from prototype/sprites.js.
// Every sprite is drawn with its ground contact at (x, base).
import { COL } from '../rules/constants';
import type { CrewId } from '../rules/crews';
import type { HopKind } from '../rules/levels';
import {
  OUTLINE as OL,
  arcStroke,
  bob,
  cap,
  context,
  ellipse,
  line,
  poly,
  rect,
  roundRect,
  text,
  withAlpha,
  type Point,
} from './draw';

const LW = 2;
const SKIN = '#f1c27d';
const DENIM = '#35507a';
const BOOT = '#5a3a20';
const TIRE = '#262626';
const HUB = '#cfcfcf';
const BARK = '#6b4423';
// BomData logo colors for the crew's shirts and caps
const BRAND_GREEN = '#6FC062';
const BRAND_YELLOW = '#FFCC49';

const shadow = (x: number, base: number, w: number) => ellipse(x, base + 1, w, 3.5, 'rgba(0,0,0,.28)');

export interface CrewPose {
  air?: number;
  duck?: boolean;
}

// ---------------------------------------------------------------- crews

function head(hx: number, hy: number, capColor: string): void {
  ellipse(hx, hy, 6.5, 6.5, SKIN, OL, LW);
  cap(hx, hy - 1, 6.8, capColor);
  poly([[hx + 2, hy - 1.5], [hx + 11, hy - 0.5], [hx + 11, hy + 1], [hx + 2, hy + 0.5]], capColor, OL, 1.5);
  rect(hx - 3, hy - 6, 3, 2, 'rgba(255,255,255,.45)');
  ellipse(hx + 3, hy + 2, 1.1, 1.3, OL);
  arcStroke(hx + 2.5, hy + 3.5, 2, 0.2, 1.3);
  ellipse(hx - 2.5, hy + 2, 1.5, 2, '#e3a86b');
}

function rideOn(x: number, base: number, { air = 0, duck = false }: CrewPose): void {
  const y = base - air;
  ellipse(x + 1, base + 1, 17 - Math.min(7, air / 7), 4, 'rgba(0,0,0,.3)');
  roundRect(x - 15, y - 9, 34, 6, 2, '#6d1e16', OL, LW);
  poly([[x - 14, y - 9], [x - 14, y - 18], [x - 2, y - 18], [x + 3, y - 23], [x + 17, y - 21], [x + 19, y - 13], [x + 18, y - 9]], '#e0402d', OL, LW);
  poly([[x + 4, y - 21], [x + 15, y - 19.5], [x + 16, y - 17], [x + 5, y - 18.5]], '#ff8a78', null);
  roundRect(x + 13, y - 16, 5, 3, 1, '#fff3b0', OL, 1);
  rect(x - 12, y - 16, 10, 2, '#ff8a78');
  roundRect(x - 14, y - 27, 11, 10, 3, '#2b2b2b', OL, LW);
  line(x + 1, y - 18, x + 4, y - 30, OL, 2);
  ellipse(x + 4, y - 30, 4, 1.5, '#444', OL, 1.5);
  const d = duck ? 6 : 0;
  roundRect(x - 12, y - 36 + d, 11, 14, 3, BRAND_GREEN, OL, LW);
  rect(x - 11, y - 34 + d, 3, 10, 'rgba(255,255,255,.25)');
  line(x - 4, y - 31 + d, x + 3, y - 30, BRAND_GREEN, 3.5);
  ellipse(x + 3.5, y - 30, 2, 2, SKIN, OL, 1);
  roundRect(x - 10, y - 24, 9, 6, 2, DENIM, OL, LW);
  head(x - 6, y - 43 + d, BRAND_YELLOW);
  ellipse(x - 9, y - 5, 7.5, 7.5, TIRE, OL, LW);
  ellipse(x - 9, y - 5, 3, 3, HUB, OL, 1);
  ellipse(x + 13, y - 3, 4.5, 4.5, TIRE, OL, LW);
  ellipse(x + 13, y - 3, 1.8, 1.8, HUB);
}

function pushCrew(x: number, base: number, { air = 0, duck = false }: CrewPose): void {
  const y = base - air;
  const vest = '#c6e63a';
  ellipse(x + 2, base + 1, 17 - Math.min(7, air / 7), 4, 'rgba(0,0,0,.3)');
  roundRect(x + 4, y - 10, 18, 8, 3, '#e0402d', OL, LW);
  rect(x + 6, y - 9, 14, 2, '#ff8a78');
  roundRect(x - 2, y - 14, 8, 11, 2, '#3a3a3a', OL, LW);
  ellipse(x + 7, y - 2, 3, 3, TIRE, OL, 1.5);
  ellipse(x + 19, y - 2, 3, 3, TIRE, OL, 1.5);
  const [hx, hy] = duck ? [x - 1, y - 18] : [x - 3, y - 30];
  line(x + 6, y - 9, hx, hy, OL, 2.5);
  line(x + 6, y - 9, hx, hy, '#9a9a9a', 1);
  if (duck) {
    roundRect(x - 17, y - 9, 13, 8, 3, DENIM, OL, LW);
    roundRect(x - 17, y - 3, 6, 3, 1, BOOT, OL, 1);
    roundRect(x - 16, y - 21, 12, 13, 3, vest, OL, LW);
    rect(x - 16, y - 16, 12, 2, '#e8e8e8');
    line(x - 7, y - 17, hx, hy, vest, 3.5);
    ellipse(hx, hy, 2, 2, SKIN, OL, 1);
    head(x - 9, y - 27, BRAND_GREEN);
  } else {
    roundRect(x - 15, y - 15, 5, 15, 2, DENIM, OL, LW);
    roundRect(x - 9, y - 15, 5, 15, 2, DENIM, OL, LW);
    roundRect(x - 16, y - 3, 7, 3, 1, BOOT, OL, 1);
    roundRect(x - 10, y - 3, 7, 3, 1, BOOT, OL, 1);
    roundRect(x - 17, y - 30, 14, 17, 3, vest, OL, LW);
    rect(x - 17, y - 24, 14, 2, '#e8e8e8');
    rect(x - 17, y - 19, 14, 2, '#e8e8e8');
    line(x - 7, y - 26, hx, hy, vest, 3.5);
    ellipse(hx, hy, 2, 2, SKIN, OL, 1);
    head(x - 10, y - 36, BRAND_GREEN);
  }
}

export function drawCrew(id: CrewId, x: number, base: number, pose: CrewPose = {}): void {
  if (id === 'rideOn') rideOn(x, base, pose);
  else pushCrew(x, base, pose);
}

// ---------------------------------------------------------------- hop obstacles

function rock(x: number, base: number): void {
  shadow(x, base, 10);
  poly([[x - 9, base], [x - 8, base - 8], [x - 3, base - 13], [x + 5, base - 12], [x + 9, base - 5], [x + 9, base]], '#a3a3ab', OL, LW);
  poly([[x - 4, base - 11], [x + 2, base - 11.5], [x - 1, base - 8]], '#d4d4da', null);
  poly([[x + 3, base], [x + 8, base - 5], [x + 9, base]], '#7d7d86', null);
}

function sprinkler(x: number, base: number): void {
  shadow(x, base, 6);
  roundRect(x - 3.5, base - 10, 7, 10, 1.5, '#2b2b2b', OL, LW);
  roundRect(x - 5, base - 13, 10, 4, 1.5, '#4a4a4a', OL, 1.5);
  const c = context();
  c.strokeStyle = '#6cc4f5';
  c.lineWidth = 1.5;
  c.lineCap = 'round';
  for (const dir of [-1, 1]) {
    c.beginPath();
    c.moveTo(x, base - 13);
    c.quadraticCurveTo(x + dir * 7, base - 26, x + dir * 13, base - 12);
    c.stroke();
  }
  for (const [dx, dy] of [[-13, -10], [13, -10], [-10, -18], [10, -18]]) ellipse(x + dx, base + dy, 1.3, 1.3, '#a8defa');
}

function picnicTable(x: number, base: number): void {
  const wood = '#b0703a';
  const dark = '#8a5428';
  shadow(x, base, 11);
  line(x - 9, base, x + 1, base - 13, OL, 4.5);
  line(x - 9, base, x + 1, base - 13, dark, 2.5);
  line(x + 9, base, x - 1, base - 13, OL, 4.5);
  line(x + 9, base, x - 1, base - 13, dark, 2.5);
  roundRect(x - 14, base - 7, 28, 3, 1, wood, OL, 1.5);
  roundRect(x - 13, base - 16, 26, 4, 1, wood, OL, LW);
  rect(x - 12, base - 15.5, 24, 1, 'rgba(255,255,255,.3)');
  for (const gx of [-6, 1, 7]) rect(x + gx, base - 15, 0.8, 2.5, dark);
  roundRect(x - 8, base - 19, 6, 3, 0.8, '#e23b3b', OL, 1);
}

function shrub(x: number, base: number): void {
  shadow(x, base, 12);
  line(x - 3, base, x - 5, base - 5, BARK, 2);
  line(x + 3, base, x + 5, base - 5, BARK, 2);
  line(x, base, x, base - 6, BARK, 2);
  const c = context();
  c.beginPath();
  c.moveTo(x - 11, base - 3);
  const bumps: readonly Point[] = [[-12, -9], [-9, -15], [-4, -18], [2, -18.5], [7, -16], [11, -11], [11.5, -5]];
  for (const [bx, by] of bumps) c.quadraticCurveTo(x + bx - 3, base + by - 2, x + bx, base + by);
  c.lineTo(x + 10, base - 3);
  c.closePath();
  c.fillStyle = '#2f7a2f';
  c.fill();
  c.lineWidth = LW;
  c.strokeStyle = OL;
  c.stroke();
  for (let i = 0; i < 16; i++) {
    ellipse(x - 8 + ((i * 7) % 17), base - 5 - ((i * 5) % 12), 2.2, 1.4, i % 2 ? '#3f9a3c' : '#276a28');
  }
  ellipse(x - 3, base - 15, 3.5, 1.8, '#6cc25e');
  for (const [bx, by] of [[-6, -10], [-1, -7], [4, -12], [7, -7], [1, -14], [-8, -5]]) {
    ellipse(x + bx, base + by, 1.6, 1.6, '#d62828', OL, 0.6);
    ellipse(x + bx - 0.5, base + by - 0.6, 0.5, 0.5, '#ffb3b3');
  }
}

function neighbor(x: number, base: number): void {
  const b = bob(260, 1);
  shadow(x, base, 9);
  roundRect(x - 5, base - 5, 4, 5, 1, '#6b4a3a', OL, 1.5);
  roundRect(x + 1, base - 5, 4, 5, 1, '#6b4a3a', OL, 1.5);
  poly([[x - 8, base - 4], [x - 5, base - 19 + b], [x + 5, base - 19 + b], [x + 8, base - 4]], '#9b7fc4', OL, LW);
  roundRect(x - 6, base - 23 + b, 12, 7, 2, '#f0c8dc', OL, LW);
  for (let i = -3; i <= 3; i += 2) ellipse(x + i, base - 17 + b, 0.9, 0.9, '#ffffff');
  ellipse(x, base - 30 + b, 6, 6, '#f1c9a0', OL, LW);
  ellipse(x - 1, base - 35 + b, 6, 3.5, '#e4e4ec', OL, 1.5);
  ellipse(x - 6, base - 34 + b, 3, 3, '#e4e4ec', OL, 1.5);
  ellipse(x - 2, base - 30 + b, 2, 2, null, OL, 1);
  ellipse(x + 3, base - 30 + b, 2, 2, null, OL, 1);
  arcStroke(x + 1, base - 27 + b, 1.5, 0.2, 2.9);
  roundRect(x + 5, base - 16 + b, 6, 5, 1.5, '#c0392b', OL, 1.5);
  line(x + 11, base, x + 10, base - 18 + b, BARK, 2);
  line(x + 10, base - 18 + b, x + 7, base - 19 + b, BARK, 2);
}

function dogWalker(x: number, base: number): void {
  const b = Math.round(Math.sin(performance.now() / 120));
  const fur = '#c98a3c';
  shadow(x - 1, base, 17);
  // dog (leading, facing left)
  roundRect(x - 17, base - 11, 14, 7, 3, fur, OL, LW);
  roundRect(x - 16 + b, base - 5, 2.5, 5, 1, fur, OL, 1);
  roundRect(x - 7 - b, base - 5, 2.5, 5, 1, fur, OL, 1);
  ellipse(x - 18, base - 14, 4.5, 4, fur, OL, LW);
  ellipse(x - 22, base - 13, 2.5, 1.8, fur, OL, 1);
  ellipse(x - 23.5, base - 13.5, 1, 1, OL);
  ellipse(x - 17, base - 13, 2, 3, '#8a5a24', OL, 1);
  ellipse(x - 19, base - 15, 0.9, 0.9, OL);
  line(x - 3, base - 10, x + 1, base - 14 - b, fur, 2.5);
  roundRect(x - 16, base - 12, 2, 3, 0.5, '#e23b3b');
  // boy
  roundRect(x + 3, base - 9, 3.5, 9, 1, '#2f4f7f', OL, 1.5);
  roundRect(x + 8, base - 9, 3.5, 9, 1, '#2f4f7f', OL, 1.5);
  roundRect(x + 2, base - 3, 5, 3, 1, '#ffffff', OL, 1);
  roundRect(x + 7, base - 3, 5, 3, 1, '#ffffff', OL, 1);
  roundRect(x + 1, base - 20, 12, 12, 3, '#e23b3b', OL, LW);
  rect(x + 2, base - 15, 10, 2, '#ffffff');
  line(x + 3, base - 16, x - 2, base - 13, SKIN, 2.5);
  ellipse(x + 7, base - 26, 6, 6, SKIN, OL, LW);
  cap(x + 7, base - 27, 6.2, '#2d6cdf');
  poly([[x + 7, base - 28], [x + 15, base - 27.5], [x + 15, base - 26], [x + 7, base - 26]], '#2d6cdf', OL, 1.5);
  ellipse(x + 4, base - 25, 1.1, 1.3, OL);
  arcStroke(x + 4.5, base - 23.5, 1.8, 1.8, 2.9);
  // leash
  line(x - 1, base - 13, x - 15, base - 11, '#e23b3b', 0.8);
}

const HOP_SPRITES: Record<HopKind, (x: number, base: number) => void> = {
  rock,
  sprinkler,
  picnicTable,
  shrub,
  neighbor,
  dogWalker,
};

export function drawObstacle(kind: HopKind, x: number, base: number, hit: boolean): void {
  withAlpha(hit ? 0.35 : 1, () => HOP_SPRITES[kind](x, base));
}

// ---------------------------------------------------------------- weeds

export function drawWeed(x: number, base: number, missed: boolean): void {
  ellipse(x, base, 8, 3, '#4a2d18');
  const blade = (pts: readonly Point[]) => poly(pts, '#6d8f2a', '#3e5a14', 1.5);
  blade([[x, base], [x - 14, base - 6], [x - 10, base - 8], [x - 12, base - 11], [x - 6, base - 9], [x - 2, base - 4]]);
  blade([[x, base], [x + 14, base - 7], [x + 10, base - 9], [x + 13, base - 13], [x + 6, base - 10], [x + 2, base - 4]]);
  blade([[x - 1, base], [x - 6, base - 16], [x - 3, base - 14], [x - 3, base - 20], [x + 1, base - 13], [x + 1, base]]);
  blade([[x, base], [x + 4, base - 18], [x + 5, base - 13], [x + 9, base - 17], [x + 3, base - 4]]);
  // dandelion seed head
  const c = context();
  c.beginPath();
  c.moveTo(x + 1, base - 3);
  c.quadraticCurveTo(x + 3, base - 16, x + 1, base - 27);
  c.lineWidth = 1.2;
  c.strokeStyle = '#7fa33a';
  c.stroke();
  const hx = x + 1;
  const hy = base - 32;
  ellipse(hx, hy, 6.5, 6.5, 'rgba(255,255,255,.55)', 'rgba(27,27,36,.35)', 0.8);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    line(hx, hy, hx + Math.cos(a) * 6, hy + Math.sin(a) * 6, '#ffffff', 0.6);
    ellipse(hx + Math.cos(a) * 6.3, hy + Math.sin(a) * 6.3, 0.7, 0.7, '#ffffff');
  }
  ellipse(hx, hy, 1.4, 1.4, '#c9b27a');
  if (missed) {
    ellipse(x + 12, base - 38, 5, 5, '#e23b3b', OL);
    text('!', x + 12, base - 37, '6px "Press Start 2P"', '#ffffff');
  }
}

// ---------------------------------------------------------------- low branch

// A branch group covers `span` columns starting at the column centered on x.
const branchEdges = (x: number, span: number) => ({ left: x - 24, right: x + (span - 1) * COL + 22 });

function leaf(lx: number, ly: number, len: number, angle: number, fill: string): void {
  const c = context();
  c.save();
  c.translate(lx, ly);
  c.rotate(angle);
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(len * 0.5, -len * 0.38, len, 0);
  c.quadraticCurveTo(len * 0.5, len * 0.38, 0, 0);
  c.fillStyle = fill;
  c.fill();
  c.lineWidth = 0.8;
  c.strokeStyle = OL;
  c.stroke();
  c.beginPath();
  c.moveTo(len * 0.1, 0);
  c.lineTo(len * 0.8, 0);
  c.lineWidth = 0.5;
  c.strokeStyle = 'rgba(0,0,0,.25)';
  c.stroke();
  c.restore();
}

function leafCluster(lx: number, ly: number, dir: number, count: number, len: number): void {
  for (let i = 0; i < count; i++) {
    leaf(lx, ly, len, dir + (i - (count - 1) / 2) * 0.55, i % 2 ? '#3f9a3c' : '#2f7a2f');
  }
}

// Trunk and crown stand behind the fence: draw before the crew.
export function drawBranchTrunk(x: number, span: number): void {
  const { right } = branchEdges(x, span);
  roundRect(right + 16, 62, 12, 96, 3, BARK, OL, LW);
  rect(right + 19, 72, 2, 78, 'rgba(255,255,255,.15)');
  const cx = right + 22;
  const cy = 52;
  line(cx, 72, cx - 14, 50, BARK, 3);
  line(cx, 70, cx + 12, 46, BARK, 3);
  line(cx, 72, cx + 1, 36, BARK, 3);
  ellipse(cx, cy, 30, 22, '#2f7a2f');
  ellipse(cx - 4, cy - 6, 18, 11, '#3a8a37');
  const ring = 15;
  for (let i = 0; i < ring; i++) {
    const a = (i / ring) * Math.PI * 2 + 0.2;
    const wobble = 1 + ((i * 5) % 3) * 0.06;
    leafCluster(cx + Math.cos(a) * 26 * wobble, cy + Math.sin(a) * 18 * wobble, a, 3, 11);
  }
  for (const [dx, dy, a] of [[-12, -4, -2.2], [10, -8, -0.8], [-2, 6, 1.9], [14, 6, 0.4], [-16, 8, 2.6]]) {
    leafCluster(cx + dx, cy + dy, a, 3, 10);
  }
}

// The limb reaches over the lawn: draw after the crew. leafBottom is the branch hit box bottom.
export function drawBranch(x: number, leafBottom: number, span: number): void {
  const { left, right } = branchEdges(x, span);
  const tipY = leafBottom - 12;
  const pts: readonly Point[] = [
    [right + 20, tipY - 26], [right + 4, tipY - 15], [right - 18, tipY - 7],
    [(left + right) / 2, tipY - 1], [left + 4, tipY + 1], [left - 16, tipY - 2],
  ];
  const widths = [9, 8, 6.5, 5, 3.5, 2];
  const segments = (color: string, extra: number) => {
    for (let i = 0; i < pts.length - 1; i++) line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], color, widths[i] + extra);
  };
  const along = (t: number): Point => {
    const f = t * (pts.length - 1);
    const i = Math.min(pts.length - 2, Math.floor(f));
    const r = f - i;
    return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * r, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * r];
  };
  const twigs = [[0.45, -16, -13], [0.62, -13, 4], [0.8, -12, -10]].map(([t, dx, dy]) => {
    const [tx, ty] = along(t);
    return { x1: tx, y1: ty, x2: tx + dx, y2: ty + dy };
  });
  for (const t of twigs) line(t.x1, t.y1, t.x2, t.y2, OL, 4.5);
  segments(OL, 2.5);
  for (const t of twigs) line(t.x1, t.y1, t.x2, t.y2, BARK, 2.5);
  segments(BARK, 0);
  for (let i = 0; i < 3; i++) {
    line(pts[i][0], pts[i][1] - widths[i] / 4, pts[i + 1][0], pts[i + 1][1] - widths[i + 1] / 4, 'rgba(255,255,255,.18)', 1.2);
  }
  const [kx, ky] = along(0.3);
  ellipse(kx, ky, 1.6, 1.1, '#4a2e16');
  for (const t of [0.35, 0.55, 0.72, 0.9]) {
    const [lx, ly] = along(t);
    leafCluster(lx, ly - 1, -Math.PI / 2 - 0.5, 3, 7);
  }
  for (const t of [0.5, 0.85]) {
    const [lx, ly] = along(t);
    leafCluster(lx, ly + 1, Math.PI / 2 + 0.4, 2, 7);
  }
  for (const t of twigs) leafCluster(t.x2, t.y2, Math.atan2(t.y2 - t.y1, t.x2 - t.x1), 5, 8);
  const tip = pts[pts.length - 1];
  leafCluster(tip[0], tip[1], Math.PI, 5, 9);
}
