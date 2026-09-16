import { describe, expect, it } from 'vitest';
import { BUDGET_HOURS, DUCK_SECONDS, END_PADDING, HOP_VELOCITY, START_DIST, STALL_SECONDS } from './constants';
import type { CrewId } from './crews';
import type { Property } from './levels';
import { createRun, cutPercent, hop, hoursUsed, isGrounded, pressDuck, releaseDuck, resultOf, tickRun, type Run } from './run';

const noEffects = () => 0.99; // never spawns clippings; bursts still work
const step = 1 / 60;

function testProperty(level: string, crew: CrewId = 'push'): Property {
  return { id: 'oakCreek', name: 'Test', shortName: 'Test', crew, backdrop: 'hoa', tip: '**push crew**', level };
}

function advanceUntil(run: Run, done: (r: Run) => boolean, maxSeconds = 30): void {
  for (let t = 0; t < maxSeconds && !done(run); t += step) tickRun(run, step, noEffects);
}

describe('createRun', () => {
  it('starts on the ground with a 6-hour budget', () => {
    const run = createRun(testProperty('..........'));
    expect(run.dist).toBe(START_DIST);
    expect(isGrounded(run)).toBe(true);
    expect(run.mowableCount).toBe(10);
    // budget seconds = 240 / 128 + 1.5
    expect(run.hoursPerSecond).toBeCloseTo(BUDGET_HOURS / (240 / 128 + 1.5));
  });
});

describe('movement and mowing', () => {
  it('moves at crew speed and mows the column under the crew', () => {
    const run = createRun(testProperty('..........', 'rideOn'));
    tickRun(run, 0.1, noEffects);
    expect(run.dist).toBeCloseTo(START_DIST + 16.5);
    expect([...run.mowed]).toEqual([1]);
    expect(hoursUsed(run)).toBeCloseTo(0.1 * run.hoursPerSecond);
  });

  it('does not mow pads, walkways or beds', () => {
    const run = createRun(testProperty('_=b.'));
    advanceUntil(run, (r) => r.ended);
    expect([...run.mowed]).toEqual([3]);
  });

  it('ends once past the level plus padding', () => {
    const run = createRun(testProperty('....'));
    advanceUntil(run, (r) => r.ended);
    expect(run.ended).toBe(true);
    expect(run.dist).toBeGreaterThanOrEqual(4 * 24 + END_PADDING);
    const elapsed = run.elapsed;
    tickRun(run, 1, noEffects);
    expect(run.elapsed).toBe(elapsed);
  });
});

describe('hop', () => {
  it('launches from the ground and lands about 0.65s later', () => {
    const run = createRun(testProperty('.'.repeat(40)));
    expect(hop(run)).toBe(true);
    expect(run.vy).toBe(HOP_VELOCITY);
    expect(hop(run)).toBe(true); // still on the ground until the next tick
    tickRun(run, step, noEffects);
    expect(isGrounded(run)).toBe(false);
    expect(hop(run)).toBe(false);
    let air = step;
    while (!isGrounded(run)) {
      tickRun(run, step, noEffects);
      air += step;
    }
    expect(air).toBeGreaterThan(0.6);
    expect(air).toBeLessThan(0.7);
  });

  it('skips mowing while in the air', () => {
    const run = createRun(testProperty('.'.repeat(40)));
    hop(run);
    tickRun(run, 0.05, noEffects);
    expect(run.mowed.size).toBe(0);
    advanceUntil(run, isGrounded);
    tickRun(run, step, noEffects);
    expect(run.mowed.size).toBe(1);
    expect(cutPercent(run)).toBe(2);
  });

  it('is refused while stalled', () => {
    const run = createRun(testProperty('..r....'));
    advanceUntil(run, (r) => r.hits > 0);
    expect(run.stall).toBeGreaterThan(0);
    expect(hop(run)).toBe(false);
  });
});

describe('bumps', () => {
  it('stalls for 1 second while the clock keeps running', () => {
    const run = createRun(testProperty('..r......'));
    advanceUntil(run, (r) => r.hits > 0);
    expect(run.hits).toBe(1);
    expect(run.stall).toBe(STALL_SECONDS);
    expect(run.floats.map((f) => f.text)).toContain(`+${Math.round(STALL_SECONDS * run.hoursPerSecond * 60)} min`);
    const dist = run.dist;
    const elapsed = run.elapsed;
    tickRun(run, 0.5, noEffects);
    expect(run.dist).toBe(dist);
    expect(run.elapsed).toBeCloseTo(elapsed + 0.5);
  });

  it('counts each obstacle once', () => {
    const run = createRun(testProperty('..r......'));
    advanceUntil(run, (r) => r.ended);
    expect(run.hits).toBe(1);
  });

  it('clears a hop obstacle with a well-timed hop', () => {
    const run = createRun(testProperty('.....r.....'));
    advanceUntil(run, (r) => run.level.obstacles[0].x - r.dist < 40);
    hop(run);
    advanceUntil(run, (r) => r.ended);
    expect(run.hits).toBe(0);
  });

  it('says sorry to the neighbor', () => {
    const run = createRun(testProperty('..L....'));
    advanceUntil(run, (r) => r.hits > 0);
    expect(run.floats.map((f) => f.text)).toContain('Sorry, ma’am!');
  });

  it('hits a standing push crew under a branch, once per branch group', () => {
    const run = createRun(testProperty('...BBB....'));
    advanceUntil(run, (r) => r.ended);
    expect(run.hits).toBe(1);
  });

  it('lets a ducking push crew pass under a branch and keep mowing', () => {
    const run = createRun(testProperty('...BBB....'));
    pressDuck(run, noEffects);
    advanceUntil(run, (r) => r.ended);
    expect(run.hits).toBe(0);
    expect(run.mowed.size).toBe(10);
  });

  it('never ducks a ride-on crew', () => {
    const run = createRun(testProperty('...BBB....', 'rideOn'));
    pressDuck(run, noEffects);
    tickRun(run, step, noEffects);
    expect(run.ducking).toBe(false);
    advanceUntil(run, (r) => r.ended);
    expect(run.hits).toBe(1);
  });

  it('keeps ducking briefly after a quick press, so a tap or flick clears a branch', () => {
    const run = createRun(testProperty('..........'));
    pressDuck(run, noEffects);
    releaseDuck(run);
    tickRun(run, step, noEffects);
    expect(run.ducking).toBe(true);
    advanceUntil(run, (r) => r.elapsed >= DUCK_SECONDS - 0.05);
    expect(run.ducking).toBe(true);
    advanceUntil(run, (r) => r.elapsed >= DUCK_SECONDS + 0.05);
    expect(run.ducking).toBe(false);
  });

  it('keeps ducking while held past the quick-duck time', () => {
    const run = createRun(testProperty('.'.repeat(40)));
    pressDuck(run, noEffects);
    advanceUntil(run, (r) => r.elapsed >= DUCK_SECONDS + 0.5);
    expect(run.ducking).toBe(true);
    releaseDuck(run);
    tickRun(run, step, noEffects);
    expect(run.ducking).toBe(false);
  });

  it('clears the longest branch group with a single quick press just before it', () => {
    const run = createRun(testProperty('.....BBB.....'));
    const branch = run.level.obstacles[0];
    advanceUntil(run, (r) => branch.left - (r.dist + 10) < 20);
    pressDuck(run, noEffects);
    releaseDuck(run);
    advanceUntil(run, (r) => r.ended);
    expect(run.hits).toBe(0);
  });

  it('cancels a quick duck when hopping', () => {
    const run = createRun(testProperty('.'.repeat(40)));
    pressDuck(run, noEffects);
    releaseDuck(run);
    tickRun(run, step, noEffects);
    expect(hop(run)).toBe(true);
    advanceUntil(run, isGrounded);
    tickRun(run, step, noEffects);
    expect(run.ducking).toBe(false);
  });
});

describe('weeds', () => {
  it('only pulls a weed within reach', () => {
    const run = createRun(testProperty('..w......'));
    expect(pressDuck(run, noEffects)).toBe(false); // weed at x=60, crew at 12
    releaseDuck(run);
    advanceUntil(run, (r) => r.dist >= 30);
    expect(pressDuck(run, noEffects)).toBe(true);
    expect(run.level.weeds[0].pulled).toBe(true);
    expect(run.floats.map((f) => f.text)).toContain('+50');
    expect(pressDuck(run, noEffects)).toBe(false);
  });

  it('marks a weed missed once it is out of reach behind the crew', () => {
    const run = createRun(testProperty('..w......'));
    advanceUntil(run, (r) => r.dist > 60 + 33);
    expect(run.level.weeds[0].missed).toBe(true);
    expect(run.floats.map((f) => f.text)).toContain('missed');
    advanceUntil(run, (r) => r.ended);
    expect(pressDuck(run, noEffects)).toBe(false);
  });

  it('pulling does not stall the crew', () => {
    const run = createRun(testProperty('..w......'));
    advanceUntil(run, (r) => r.dist >= 40);
    pressDuck(run, noEffects);
    const dist = run.dist;
    tickRun(run, 0.1, noEffects);
    expect(run.dist).toBeCloseTo(dist + 12.8);
  });
});

describe('resultOf', () => {
  it('summarizes the run for scoring', () => {
    const run = createRun(testProperty('..w..r..'));
    advanceUntil(run, (r) => r.ended);
    const result = resultOf(run);
    expect(result).toMatchObject({ budgetHours: 6, mowedColumns: 6, mowableColumns: 6, weedsPulled: 0, weedCount: 1, hits: 1 });
    expect(result.hoursUsed).toBeCloseTo(hoursUsed(run));
  });
});
