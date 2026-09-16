import { describe, expect, it } from 'vitest';
import { CLEAN_RUN_BONUS, efficiencyPercent, efficiencyStars, scoreProperty, summarizeRound, titleFor, type PropertyInput } from './scoring';

const perfect: PropertyInput = {
  hoursUsed: 5.6,
  budgetHours: 6,
  mowedColumns: 80,
  mowableColumns: 80,
  weedsPulled: 4,
  weedCount: 4,
  hits: 0,
};

describe('efficiency (budget ÷ actual, not capped)', () => {
  it.each([
    [5.6, 107],
    [6, 100],
    [6.2, 97],
    [6.3, 95],
    [7.4, 81],
    [7.5, 80],
    [8.5, 71],
    [8.6, 70],
  ])('%s hours against a 6 hour budget is %i%%', (used, pct) => {
    expect(efficiencyPercent(used, 6)).toBe(pct);
  });

  it.each([
    [107, 3],
    [96, 3],
    [95, 2],
    [81, 2],
    [80, 1],
    [71, 1],
    [70, 0],
  ])('%i%% earns %i stars', (pct, stars) => {
    expect(efficiencyStars(pct)).toBe(stars);
  });
});

describe('scoreProperty', () => {
  it('gives 5 stars for a clean, weed-free, on-budget job', () => {
    expect(scoreProperty(perfect)).toMatchObject({
      efficiency: 107,
      efficiencyStars: 3,
      cut: 100,
      cutStar: true,
      weedStar: true,
      collisionFree: true,
      onBudget: true,
      stars: 5,
    });
  });

  it('needs every column for the cut star', () => {
    const s = scoreProperty({ ...perfect, mowedColumns: 79 });
    expect(s.cut).toBe(98);
    expect(s.cutStar).toBe(false);
    expect(s.stars).toBe(4);
  });

  it('needs every weed for the weed star', () => {
    expect(scoreProperty({ ...perfect, weedsPulled: 3 }).weedStar).toBe(false);
  });

  it('adds under-budget and clean-run bonuses', () => {
    // 80*10 + 4*50 + 4 tenths * 10 + clean run
    expect(scoreProperty(perfect).points).toBe(800 + 200 + 40 + CLEAN_RUN_BONUS);
  });

  it('only gives the clean run bonus with no collisions', () => {
    const s = scoreProperty({ ...perfect, hits: 2 });
    expect(s.collisionFree).toBe(false);
    expect(s.points).toBe(1040);
  });

  it('gives no under-budget bonus when grass was skipped', () => {
    expect(scoreProperty({ ...perfect, mowedColumns: 79 }).points).toBe(790 + 200 + CLEAN_RUN_BONUS);
  });

  it('subtracts 10 points per whole tenth of an hour over budget', () => {
    const s = scoreProperty({ ...perfect, hoursUsed: 6.35 });
    expect(s.onBudget).toBe(false);
    expect(s.points).toBe(800 + 200 - 30 + CLEAN_RUN_BONUS);
  });

  it('reports hours under and over budget', () => {
    expect(scoreProperty(perfect).hoursUnder).toBeCloseTo(0.4);
    expect(scoreProperty(perfect).hoursOver).toBe(0);
    expect(scoreProperty({ ...perfect, hoursUsed: 6.5 }).hoursOver).toBeCloseTo(0.5);
    expect(scoreProperty({ ...perfect, hoursUsed: 6.5 }).hoursUnder).toBe(0);
  });

  it('counts hours saved only for on-budget jobs with both quality stars', () => {
    expect(scoreProperty(perfect).hoursSaved).toBeCloseTo(0.4);
    expect(scoreProperty({ ...perfect, weedsPulled: 3 }).hoursSaved).toBe(0);
    expect(scoreProperty({ ...perfect, mowedColumns: 79 }).hoursSaved).toBe(0);
    expect(scoreProperty({ ...perfect, hoursUsed: 6.5 }).hoursSaved).toBe(0);
  });

  it('always gives an idle full-cut run at least one star', () => {
    const s = scoreProperty({ ...perfect, hoursUsed: 11, weedsPulled: 0, hits: 9 });
    expect(s.efficiencyStars).toBe(0);
    expect(s.stars).toBe(1);
  });
});

describe('titles and rounds', () => {
  it.each([
    [0, 'Rookie'],
    [4, 'Rookie'],
    [5, 'Crew Lead'],
    [7, 'Crew Lead'],
    [8, 'Pro'],
    [9, 'Pro'],
    [10, 'Margin Master'],
  ])('%i stars is %s', (stars, title) => {
    expect(titleFor(stars)).toBe(title);
  });

  it('totals a round', () => {
    const a = scoreProperty(perfect);
    const b = scoreProperty({ ...perfect, hoursUsed: 6.9, weedsPulled: 6, weedCount: 7 });
    expect(b.efficiency).toBe(87);
    expect(b.stars).toBe(3);
    expect(summarizeRound([a, b])).toEqual({
      stars: 8,
      maxStars: 10,
      efficiency: 96, // 12 budgeted / 12.5 actual
      points: 1140 + (800 + 300 - 90 + CLEAN_RUN_BONUS),
      hoursSaved: 0.4,
      title: 'Pro',
    });
  });
});
