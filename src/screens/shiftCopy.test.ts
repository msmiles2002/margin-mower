import { describe, expect, it } from 'vitest';
import { scoreProperty, summarizeRound, type PropertyInput } from '../rules/scoring';
import { shiftCardCopy } from './cardCopy';

const perfect: PropertyInput = {
  hoursUsed: 5.6,
  budgetHours: 6,
  mowedColumns: 80,
  mowableColumns: 80,
  weedsPulled: 4,
  weedCount: 4,
  hits: 0,
};
const shift = (a: Partial<PropertyInput>, b: Partial<PropertyInput>) => {
  const results = [
    { name: 'North Valley', score: scoreProperty({ ...perfect, ...a }) },
    { name: 'Oak Creek', score: scoreProperty({ ...perfect, ...b }) },
  ];
  return shiftCardCopy(results, summarizeRound(results.map((r) => r.score)));
};

describe('shiftCardCopy', () => {
  it('celebrates a perfect shift and totals both properties', () => {
    expect(shift({}, {})).toEqual({
      celebration: 'ON BUDGET. FULL QUALITY.',
      efficiency: '107% efficiency',
      efficiencyStars: 3,
      budget: '12.0 hrs',
      actual: '11.2 hrs',
      variance: { text: '0.8 hrs saved', tone: 'good' },
      cut: { text: 'Grass cut: 100%', ok: true },
      weeds: { text: 'Weeds pulled: 8/8', ok: true },
      collisions: { text: 'No collisions', ok: true },
      properties: [
        { name: 'North Valley', stars: 5, efficiency: '107%' },
        { name: 'Oak Creek', stars: 5, efficiency: '107%' },
      ],
      headline: '0.8 labor hours saved',
      points: '+2,280 pts',
    });
  });

  it('nets the shift when one property runs over', () => {
    const c = shift({}, { hoursUsed: 6.9, hits: 3 });
    expect(c.celebration).toBeNull();
    expect(c.actual).toBe('12.5 hrs');
    expect(c.variance).toEqual({ text: '0.5 hrs over budget', tone: 'bad' });
    expect(c.collisions).toEqual({ text: '3 collisions', ok: false });
    expect(c.headline).toBe('0.5 labor hours over budget');
  });

  it('separates hours under budget from hours saved when work was skipped', () => {
    const c = shift({}, { mowedColumns: 60, weedsPulled: 1 });
    expect(c.variance).toEqual({ text: '0.8 hrs under budget, 0.4 hrs saved', tone: 'warn' });
    expect(c.cut).toEqual({ text: 'Grass cut: 87%', ok: false });
    expect(c.weeds).toEqual({ text: 'Weeds pulled: 5/8', ok: false });
    expect(c.headline).toBe('0.4 labor hours saved');
  });

  it('says no hours saved when every early finish skipped work', () => {
    const c = shift({ weedsPulled: 0 }, { weedsPulled: 0 });
    expect(c.variance).toEqual({ text: '0.8 hrs under budget, but work was skipped', tone: 'warn' });
    expect(c.headline).toBe('No labor hours saved');
  });

  it('uses the singular for one collision', () => {
    expect(shift({ hits: 1 }, {}).collisions.text).toBe('1 collision');
  });
});
