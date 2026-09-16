import { describe, expect, it } from 'vitest';
import { scoreProperty, type PropertyInput } from '../rules/scoring';
import { propertyCardCopy } from './cardCopy';

const perfect: PropertyInput = {
  hoursUsed: 5.6,
  budgetHours: 6,
  mowedColumns: 80,
  mowableColumns: 80,
  weedsPulled: 4,
  weedCount: 4,
  hits: 0,
};
const copy = (input: Partial<PropertyInput>, hoursPerBump = 0.2) => propertyCardCopy(scoreProperty({ ...perfect, ...input }), hoursPerBump);

describe('propertyCardCopy', () => {
  it('celebrates and shows the business payoff for a perfect property', () => {
    expect(copy({})).toEqual({
      celebration: 'ON BUDGET. FULL QUALITY.',
      efficiency: '107% efficiency',
      budget: '6.0 hrs',
      actual: '5.6 hrs',
      variance: { text: '0.4 hrs saved', tone: 'good' },
      collisions: { text: 'No collisions', ok: true },
      cleanRunBonus: 'Clean run bonus: +100',
      headline: '0.4 labor hours saved',
      points: '+1,140 pts',
    });
  });

  it('does not count early finishes as savings when work was skipped', () => {
    const c = copy({ mowedColumns: 70 });
    expect(c.celebration).toBeNull();
    expect(c.variance).toEqual({ text: '0.4 hrs under budget, but work was skipped', tone: 'warn' });
    expect(c.headline).toBe('No labor hours saved');
  });

  it('shows overtime', () => {
    const c = copy({ hoursUsed: 6.9, hits: 3 });
    expect(c.efficiency).toBe('87% efficiency');
    expect(c.variance).toEqual({ text: '0.9 hrs over budget', tone: 'bad' });
    expect(c.collisions).toEqual({ text: '3 collisions (+0.6 hrs)', ok: false });
    expect(c.cleanRunBonus).toBeNull();
    expect(c.headline).toBe('0.9 labor hours over budget');
    expect(c.celebration).toBeNull();
  });

  it('uses the singular for one collision', () => {
    expect(copy({ hits: 1 }).collisions.text).toBe('1 collision (+0.2 hrs)');
  });

  it('calls a finish within a tenth of the budget right on budget', () => {
    const c = copy({ hoursUsed: 5.97 });
    expect(c.variance).toEqual({ text: 'Right on budget', tone: 'good' });
    expect(c.headline).toBe('Right on budget');
  });

  it('shows negative points without a plus sign', () => {
    expect(copy({ hoursUsed: 11, mowedColumns: 0, weedsPulled: 0, hits: 9 }).points).toBe('-500 pts');
  });
});
