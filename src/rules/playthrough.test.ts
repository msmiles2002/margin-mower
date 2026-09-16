import { describe, expect, it } from 'vitest';
import { PROPERTIES, type Property } from './levels';
import { createRun, hop, pressDuck, releaseDuck, resultOf, tickRun } from './run';
import { scoreProperty } from './scoring';

const rng = () => 0.5;
const step = 1 / 60;

// A scripted player: hops when the next hop obstacle is `lead` units ahead,
// ducks under branches, and pulls each weed as it passes.
function play(property: Property, lead: number | null) {
  const run = createRun(property);
  for (let i = 0; i < 60 * 120 && !run.ended; i++) {
    if (lead !== null) {
      const next = run.level.obstacles.find((o) => !o.hit && o.right > run.dist - 10);
      if (next !== undefined && next.kind !== 'branch' && next.x - run.dist > 0 && next.x - run.dist < lead) hop(run);
      if (next !== undefined && next.kind === 'branch' && next.left - run.dist < 30) run.duckHeld = true;
      else if (run.duckHeld) releaseDuck(run);
      const weed = run.level.weeds.find((w) => !w.pulled && !w.missed && Math.abs(w.x - run.dist) <= 6);
      if (weed !== undefined) {
        pressDuck(run, rng);
        if (property.crew === 'rideOn') releaseDuck(run);
      }
    }
    tickRun(run, step, rng);
  }
  return { run, score: scoreProperty(resultOf(run)) };
}

describe.each(PROPERTIES.map((p) => ({ name: p.name, property: p })))('$name', ({ property }) => {
  it('can be finished perfectly: no bumps and 5 stars', () => {
    const perfectLeads: number[] = [];
    for (let lead = 10; lead <= 110; lead += 2) {
      const { score } = play(property, lead);
      if (score.hits === 0 && score.stars === 5) perfectLeads.push(lead);
    }
    // A window of at least 20 units (several frames) keeps it humanly possible.
    expect(perfectLeads.length).toBeGreaterThanOrEqual(10);
  });

  it('is always finished, with at least one star, by a player who does nothing', () => {
    const { run, score } = play(property, null);
    expect(run.ended).toBe(true);
    expect(score.stars).toBeGreaterThanOrEqual(1);
    expect(score.hits).toBeGreaterThan(0);
  });
});
