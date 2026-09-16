import { BUDGET_HOURS, GROUND, MOWER_SCREEN_X, WORLD_WIDTH as W } from '../rules/constants';
import type { Obstacle } from '../rules/levels';
import { hoursUsed, type Run } from '../rules/run';
import { budgetGauge, type GaugeTone } from './budgetGauge';
import { OUTLINE as OL, context, poly, rect, roundRect, text } from './draw';
import { drawBackdrop, drawClouds, drawLawn, drawSidewalkAndStreet, drawSky } from './scenery';
import { drawBranch, drawBranchTrunk, drawCrew, drawObstacle, drawWeed } from './sprites';

export type HintKey = 'hop' | 'duck' | 'weed';

// Hints already passed in this session, keyed by property id + hint.
export type SeenHints = Set<string>;

const hintId = (run: Run, key: HintKey) => `${run.property.id}:${key}`;

interface HintTarget {
  key: HintKey;
  x: number;
  y: number;
  label: string;
  active: boolean;
}

function hintTargets(run: Run): HintTarget[] {
  const targets: HintTarget[] = [];
  const firstHop = run.level.obstacles.find((o) => o.kind !== 'branch');
  const firstBranch = run.level.obstacles.find((o) => o.kind === 'branch');
  const firstWeed = run.level.weeds[0];
  if (firstHop !== undefined) targets.push({ key: 'hop', x: firstHop.x, y: GROUND - 22, label: '⬆ HOP', active: true });
  if (firstBranch !== undefined) targets.push({ key: 'duck', x: firstBranch.x, y: 88, label: '⬇ DUCK', active: true });
  if (firstWeed !== undefined) targets.push({ key: 'weed', x: firstWeed.x, y: GROUND - 44, label: '⬇ PULL', active: !firstWeed.pulled });
  return targets;
}

// Marks hints as seen once the crew has passed them.
export function updateHints(run: Run, seen: SeenHints): void {
  for (const t of hintTargets(run)) if (run.dist > t.x + 10) seen.add(hintId(run, t.key));
}

function bubble(x: number, y: number, label: string): void {
  const c = context();
  c.font = '8px "Press Start 2P"';
  const w = Math.ceil(c.measureText(label).width) + 12;
  const b = Math.round(Math.sin(performance.now() / 150) * 2);
  roundRect(x - w / 2, y - 16 + b, w, 15, 4, '#fffdf5', OL, 1.5);
  poly([[x - 4, y - 1 + b], [x + 4, y - 1 + b], [x, y + 4 + b]], '#fffdf5');
  c.fillStyle = OL;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(label, x, y - 8 + b);
}

function finishFlag(x: number): void {
  rect(x, GROUND - 46, 2, 46, OL);
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 4; j++) rect(x + 2 + i * 4, GROUND - 46 + j * 4, 4, 4, (i + j) % 2 ? '#ffffff' : OL);
  }
}

const GAUGE_COLORS: Record<GaugeTone, string> = { ok: '#6FC062', low: '#FFCC49', over: '#F47D6D' };

function drawBudgetGauge(run: Run): void {
  const gauge = budgetGauge(hoursUsed(run), BUDGET_HOURS);
  const color = GAUGE_COLORS[gauge.tone];
  const left = 16;
  const width = W - 32;
  roundRect(8, 5, W - 16, 27, 5, 'rgba(15, 18, 24, 0.78)');
  text(gauge.label, left, 13, '7px "Press Start 2P"', '#ffffff', 'left');
  text(gauge.value, left + width, 13, '8px "Press Start 2P"', color, 'right');
  roundRect(left, 20, width, 7, 3, 'rgba(255, 255, 255, 0.18)');
  if (gauge.fraction > 0) roundRect(left, 20, Math.max(6, width * gauge.fraction), 7, 3, color);
}

export interface SceneOptions {
  hints: boolean;
  gauge: boolean;
}

const visible = (x: number, margin = 60) => x > -margin && x < W + margin;
const isBranch = (o: Obstacle) => o.kind === 'branch';

// Draws one full frame. Previews behind the title and intro panels turn the hints and the gauge off.
export function drawScene(run: Run, seen: SeenHints, options: SceneOptions = { hints: true, gauge: true }): void {
  const c = context();
  const cam = run.dist - MOWER_SCREEN_X;
  const shake = run.shake > 0 ? (Math.random() - 0.5) * 5 : 0;
  c.save();
  c.translate(shake, 0);

  drawSky();
  drawClouds(cam);
  drawBackdrop(run.property.backdrop, cam);
  drawSidewalkAndStreet(cam);
  drawLawn(run.level, run.mowed, cam);

  const branches = run.level.obstacles.filter(isBranch);
  for (const o of branches) if (visible(o.x - cam, 120)) drawBranchTrunk(o.x - cam, o.span);
  for (const w of run.level.weeds) if (!w.pulled && visible(w.x - cam)) drawWeed(w.x - cam, GROUND, w.missed);
  for (const o of run.level.obstacles) {
    if (o.kind !== 'branch' && visible(o.x - cam)) drawObstacle(o.kind, o.x - cam, GROUND, o.hit);
  }
  const flagX = run.level.lengthPx - cam;
  if (visible(flagX)) finishFlag(flagX);

  drawCrew(run.crew.id, MOWER_SCREEN_X, GROUND, { air: run.y, duck: run.ducking });
  for (const o of branches) if (visible(o.x - cam, 120)) drawBranch(o.x - cam, o.bottom, o.span);

  for (const p of run.particles) rect(p.x - cam, p.y, 2, 2, p.color);

  if (options.hints) {
    for (const t of hintTargets(run)) {
      const sx = t.x - cam;
      if (t.active && !seen.has(hintId(run, t.key)) && sx > MOWER_SCREEN_X - 10 && sx < W - 20) bubble(sx, t.y, t.label);
    }
  }

  c.font = '9px "Press Start 2P"';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  for (const f of run.floats) {
    const sx = f.x - cam;
    c.fillStyle = OL;
    c.fillText(f.text, sx + 1, f.y + 1);
    c.fillStyle = f.color;
    c.fillText(f.text, sx, f.y);
  }

  if (options.gauge) drawBudgetGauge(run);
  c.restore();
}
