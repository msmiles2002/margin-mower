import {
  BUDGET_HOURS,
  COL,
  CREW_HALF_WIDTH,
  END_PADDING,
  GRAVITY,
  GROUND,
  HOP_VELOCITY,
  SLACK_SECONDS,
  STALL_SECONDS,
  START_DIST,
  WEED_REACH,
} from './constants';
import { CREWS, type Crew } from './crews';
import { parseLevel, type Level, type Property } from './levels';
import type { PropertyInput } from './scoring';

export type Rng = () => number;

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface FloatText {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

export interface Run {
  property: Property;
  crew: Crew;
  level: Level;
  hoursPerSecond: number;
  mowed: Set<number>;
  mowableCount: number;
  dist: number;
  y: number;
  vy: number;
  ducking: boolean;
  duckHeld: boolean;
  stall: number;
  shake: number;
  elapsed: number;
  hits: number;
  particles: Particle[];
  floats: FloatText[];
  ended: boolean;
}

export function createRun(property: Property): Run {
  const crew = CREWS[property.crew];
  const level = parseLevel(property.level);
  const budgetSeconds = level.lengthPx / crew.speed + SLACK_SECONDS;
  return {
    property,
    crew,
    level,
    hoursPerSecond: BUDGET_HOURS / budgetSeconds,
    mowed: new Set(),
    mowableCount: level.mowable.filter(Boolean).length,
    dist: START_DIST,
    y: 0,
    vy: 0,
    ducking: false,
    duckHeld: false,
    stall: 0,
    shake: 0,
    elapsed: 0,
    hits: 0,
    particles: [],
    floats: [],
    ended: false,
  };
}

export const hoursUsed = (run: Run): number => run.elapsed * run.hoursPerSecond;
export const isGrounded = (run: Run): boolean => run.y === 0;
export const cutPercent = (run: Run): number =>
  run.mowableCount === 0 ? 100 : Math.floor((run.mowed.size / run.mowableCount) * 100);

function burst(run: Run, x: number, y: number, color: string, count: number, rng: Rng): void {
  for (let i = 0; i < count; i++) {
    run.particles.push({ x, y, vx: (rng() - 0.5) * 120, vy: -60 - rng() * 90, life: 0.5, color });
  }
}

export function hop(run: Run): boolean {
  if (run.ended || !isGrounded(run) || run.stall > 0) return false;
  run.vy = HOP_VELOCITY;
  run.ducking = false;
  return true;
}

// Pressing duck also pulls the nearest weed in reach. Returns true when a weed was pulled.
export function pressDuck(run: Run, rng: Rng): boolean {
  if (run.ended) return false;
  run.duckHeld = true;
  const weed = run.level.weeds.find((w) => !w.pulled && !w.missed && Math.abs(w.x - run.dist) <= WEED_REACH);
  if (weed === undefined) return false;
  weed.pulled = true;
  run.floats.push({ x: weed.x, y: GROUND - 30, text: '+50', life: 0.8, color: '#ffffff' });
  burst(run, weed.x, GROUND - 8, '#6d8f2a', 10, rng);
  return true;
}

export function releaseDuck(run: Run): void {
  run.duckHeld = false;
}

function collide(run: Run, rng: Rng): void {
  const height = run.ducking ? run.crew.duckHeight : run.crew.height;
  const left = run.dist - CREW_HALF_WIDTH;
  const right = run.dist + CREW_HALF_WIDTH;
  const bottom = GROUND - run.y;
  const top = bottom - height;
  for (const o of run.level.obstacles) {
    if (o.hit || right <= o.left || left >= o.right) continue;
    if (bottom <= o.top || top >= o.bottom) continue;
    o.hit = true;
    run.hits += 1;
    run.stall = STALL_SECONDS;
    run.shake = 0.25;
    run.floats.push({
      x: run.dist, y: GROUND - 50, text: `+${(STALL_SECONDS * run.hoursPerSecond).toFixed(1)}h`, life: 1, color: '#F47D6D',
    });
    if (o.kind === 'neighbor') run.floats.push({ x: o.x, y: GROUND - 70, text: 'Sorry, ma’am!', life: 1.2, color: '#ffffff' });
    const branch = o.kind === 'branch';
    burst(run, o.x, branch ? o.bottom : o.top, branch ? '#3f8a3a' : '#9a9a9a', 12, rng);
  }
}

export function tickRun(run: Run, dt: number, rng: Rng): void {
  if (run.ended) return;
  run.elapsed += dt;
  run.shake = Math.max(0, run.shake - dt);

  if (!isGrounded(run) || run.vy > 0) {
    run.y += run.vy * dt;
    run.vy -= GRAVITY * dt;
    if (run.y <= 0) {
      run.y = 0;
      run.vy = 0;
    }
  }
  run.ducking = run.duckHeld && isGrounded(run) && run.crew.canDuck;

  if (run.stall > 0) run.stall = Math.max(0, run.stall - dt);
  else run.dist += run.crew.speed * dt;

  const col = Math.floor(run.dist / COL);
  const onGrass = isGrounded(run) && col < run.level.mowable.length && run.level.mowable[col] === true;
  if (onGrass) {
    run.mowed.add(col);
    if (run.stall <= 0 && rng() < 0.7) {
      run.particles.push({
        x: run.dist - 14, y: GROUND - 4, vx: -60 - rng() * 60, vy: -40 - rng() * 60, life: 0.35,
        color: rng() < 0.5 ? '#9be07a' : '#5da94e',
      });
    }
  }

  collide(run, rng);

  for (const w of run.level.weeds) {
    if (!w.pulled && !w.missed && run.dist - w.x > WEED_REACH) {
      w.missed = true;
      run.floats.push({ x: w.x, y: GROUND - 30, text: 'missed', life: 0.8, color: '#ffd0c8' });
    }
  }

  for (const p of run.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 450 * dt;
  }
  run.particles = run.particles.filter((p) => p.life > 0);
  for (const f of run.floats) {
    f.life -= dt;
    f.y -= 30 * dt;
  }
  run.floats = run.floats.filter((f) => f.life > 0);

  if (run.dist >= run.level.lengthPx + END_PADDING) run.ended = true;
}

export function resultOf(run: Run): PropertyInput {
  return {
    hoursUsed: hoursUsed(run),
    budgetHours: BUDGET_HOURS,
    mowedColumns: run.mowed.size,
    mowableColumns: run.mowableCount,
    weedsPulled: run.level.weeds.filter((w) => w.pulled).length,
    weedCount: run.level.weeds.length,
    hits: run.hits,
  };
}
