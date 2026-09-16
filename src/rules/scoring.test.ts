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
  it('scores a clean, on-budget job', () => {
    expect(scoreProperty(perfect)).toMatchObject({
      efficiency: 107,
      cut: 100,
      fullQuality: true,
      collisionFree: true,
      callbackItems: 0,
      callbackHours: 0,
      underHours: 0.4,
      netHours: 0.4,
      stars: 5,
      points: 800 + 200 + 40 + CLEAN_RUN_BONUS,
    });
  });

  it('rounds actual hours to tenths first, so efficiency matches the hours shown', () => {
    const s = scoreProperty({ ...perfect, hoursUsed: 5.63 });
    expect(s.hoursUsed).toBe(5.6);
    expect(s.efficiency).toBe(107);
    expect(s.underHours).toBe(0.4);
  });

  it('charges a 0.1 hr callback per missed weed', () => {
    const s = scoreProperty({ ...perfect, weedsPulled: 3 });
    expect(s).toMatchObject({ weedsMissed: 1, callbackItems: 1, callbackHours: 0.1, underHours: 0.4, netHours: 0.3, stars: 4 });
    expect(s.points).toBe(800 + 150 + 30 + CLEAN_RUN_BONUS);
  });

  it('charges 0.1 hr per started block of 5 uncut columns', () => {
    const s = scoreProperty({ ...perfect, mowedColumns: 74 });
    expect(s).toMatchObject({ cut: 92, cutStar: false, uncutColumns: 6, callbackItems: 1, callbackHours: 0.2, netHours: 0.2 });
    expect(scoreProperty({ ...perfect, mowedColumns: 79 }).callbackHours).toBe(0.1);
  });

  it('lets callbacks push an early finish over budget', () => {
    const s = scoreProperty({ ...perfect, hoursUsed: 5.9, weedsPulled: 0 });
    expect(s).toMatchObject({ underHours: 0.1, callbackHours: 0.4, netHours: -0.3 });
  });

  it('scores an over-budget job with collisions', () => {
    const s = scoreProperty({ ...perfect, hoursUsed: 6.9, hits: 3 });
    expect(s).toMatchObject({ efficiency: 87, underHours: -0.9, netHours: -0.9, collisionFree: false, stars: 4 });
    expect(s.points).toBe(800 + 200 - 90);
  });

  it('always gives at least one star, even with nothing earned', () => {
    const s = scoreProperty({ ...perfect, hoursUsed: 11, mowedColumns: 70, weedsPulled: 0, hits: 9 });
    expect(s.efficiencyStars).toBe(0);
    expect(s.cutStar).toBe(false);
    expect(s.weedStar).toBe(false);
    expect(s.stars).toBe(1);
    expect(summarizeRound([s, s]).stars).toBe(1);
  });
});

describe('titles and rounds', () => {
  it.each([
    [0, 'Rookie'],
    [2, 'Rookie'],
    [3, 'Crew Lead'],
    [4, 'Route Pro'],
    [5, 'Margin Master'],
  ])('%i stars is %s', (stars, title) => {
    expect(titleFor(stars)).toBe(title);
  });

  it('totals a round in tenths, with one 5-star rating', () => {
    const a = scoreProperty({ ...perfect, hoursUsed: 5.63 });
    const b = scoreProperty({ ...perfect, hoursUsed: 5.97, weedsPulled: 3, hits: 1 });
    expect(b).toMatchObject({ hoursUsed: 6, underHours: 0, netHours: -0.1, stars: 4 });
    expect(summarizeRound([a, b])).toEqual({
      stars: 4,
      maxStars: 5,
      efficiency: 103, // 12.0 / 11.6
      points: 1140 + (800 + 150 - 10),
      budgetHours: 12,
      hoursUsed: 11.6,
      underHours: 0.4,
      callbackHours: 0.1,
      callbackItems: 1,
      netHours: 0.3,
      hits: 1,
      fullQuality: false,
      title: 'Route Pro',
    });
  });

  it('only gives 5 shift stars when both properties earn 5', () => {
    const five = scoreProperty(perfect);
    const four = scoreProperty({ ...perfect, weedsPulled: 3 });
    expect(summarizeRound([five, five]).stars).toBe(5);
    expect(summarizeRound([five, four]).stars).toBe(4);
  });
});
