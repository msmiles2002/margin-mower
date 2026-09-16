import { describe, expect, it } from 'vitest';
import { efficiencyPercent, efficiencyStars, scoreProperty, summarizeRound, titleFor, type PropertyInput } from './scoring';

const perfect: PropertyInput = {
  hoursUsed: 5.6,
  budgetHours: 6,
  mowedColumns: 80,
  mowableColumns: 80,
  weedsPulled: 4,
  weedCount: 4,
  hits: 0,
};

describe('efficiency', () => {
  it.each([
    [5.6, 100],
    [6.2, 97],
    [6.3, 95],
    [7.4, 81],
    [7.5, 80],
    [8.5, 71],
    [8.6, 70],
  ])('%s hours of 6 is %i%%', (used, pct) => {
    expect(efficiencyPercent(used, 6)).toBe(pct);
  });

  it.each([
    [100, 3],
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
    const s = scoreProperty(perfect);
    expect(s).toMatchObject({ efficiency: 100, efficiencyStars: 3, cut: 100, cutStar: true, weedStar: true, stars: 5 });
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

  it('adds 10 points per tenth of an hour under budget when the cut is complete', () => {
    // 80*10 + 4*50 + 4 tenths * 10
    expect(scoreProperty(perfect).points).toBe(1040);
  });

  it('gives no under-budget bonus when grass was skipped', () => {
    // 79*10 + 4*50
    expect(scoreProperty({ ...perfect, mowedColumns: 79 }).points).toBe(990);
  });

  it('subtracts 10 points per whole tenth of an hour over budget', () => {
    // 800 + 200 - 3 tenths * 10
    expect(scoreProperty({ ...perfect, hoursUsed: 6.35 }).points).toBe(970);
  });

  it('counts hours saved only for on-budget jobs with both quality stars', () => {
    expect(scoreProperty(perfect).hoursSaved).toBeCloseTo(0.4);
    expect(scoreProperty({ ...perfect, weedsPulled: 3 }).hoursSaved).toBe(0);
    expect(scoreProperty({ ...perfect, mowedColumns: 79 }).hoursSaved).toBe(0);
    expect(scoreProperty({ ...perfect, hoursUsed: 6.5 }).hoursSaved).toBe(0);
  });

  it('always gives an idle full-cut run at least one star', () => {
    const s = scoreProperty({ ...perfect, hoursUsed: 11, weedsPulled: 0 });
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
    const summary = summarizeRound([a, b]);
    expect(b.stars).toBe(3); // 87% -> 2 stars, cut star, no weed star
    expect(summary).toEqual({
      stars: 8,
      maxStars: 10,
      efficiency: 96, // 12 / 12.5
      points: 1040 + (800 + 300 - 90),
      hoursSaved: 0.4,
      title: 'Pro',
    });
  });
});
