import { describe, expect, it } from 'vitest';
import { scoreProperty, summarizeRound, type PropertyInput } from '../rules/scoring';
import { efficiencyCaption, propertyCardCopy, shiftCardCopy } from './cardCopy';

const perfect: PropertyInput = {
  hoursUsed: 5.6,
  budgetHours: 6,
  mowedColumns: 80,
  mowableColumns: 80,
  weedsPulled: 4,
  weedCount: 4,
  hits: 0,
};
const score = (input: Partial<PropertyInput>) => scoreProperty({ ...perfect, ...input });

describe('efficiencyCaption', () => {
  it('explains the percentage', () => {
    expect(efficiencyCaption(103)).toBe('Beat the budget by 3%');
    expect(efficiencyCaption(100)).toBe('Right on budget');
    expect(efficiencyCaption(87)).toBe('13% behind budget');
  });
});

describe('propertyCardCopy', () => {
  it('describes a perfect property', () => {
    expect(propertyCardCopy(score({}), 0.2)).toEqual({
      outcome: { text: 'On budget. Full quality.', perfect: true },
      efficiency: '107% efficiency',
      efficiencyCaption: 'Beat the budget by 7%',
      headline: { text: '0.4 labor hours saved', tone: 'good' },
      labor: [
        { label: 'Budget', value: '6.0 hrs', tone: null },
        { label: 'Actual', value: '5.6 hrs', tone: null },
        { label: 'Under budget', value: '0.4 hrs', tone: 'good' },
      ],
      quality: [
        { text: 'Grass cut: 100%', ok: true },
        { text: 'Weeds pulled: 4/4', ok: true },
        { text: 'No collisions', ok: true },
      ],
      callbackRisk: null,
      cleanRunBonus: 'Clean run bonus: +100',
      points: '+1,140 pts',
    });
  });

  it('shows the callback penalty and truly-saved hours when work was missed', () => {
    const c = propertyCardCopy(score({ weedsPulled: 3, hits: 1 }), 0.2);
    expect(c.outcome).toEqual({ text: 'Fast route. One callback risk.', perfect: false });
    expect(c.labor).toEqual([
      { label: 'Budget', value: '6.0 hrs', tone: null },
      { label: 'Actual', value: '5.6 hrs', tone: null },
      { label: 'Under budget', value: '0.4 hrs', tone: 'good' },
      { label: 'Quality penalty', value: '−0.1 hrs', tone: 'bad' },
    ]);
    expect(c.headline).toEqual({ text: '0.3 labor hours saved after quality penalties', tone: 'good' });
    expect(c.quality[1]).toEqual({ text: 'Weeds pulled: 3/4', ok: false });
    expect(c.quality[2]).toEqual({ text: '1 collision (+0.2 hrs)', ok: false });
    expect(c.callbackRisk).toBe('Callback risk: 1 missed item');
    expect(c.cleanRunBonus).toBeNull();
  });

  it('says when callbacks eat or exceed the savings', () => {
    expect(propertyCardCopy(score({ hoursUsed: 5.8, weedsPulled: 2 }), 0.2).headline).toEqual({
      text: 'Callbacks ate the savings',
      tone: 'warn',
    });
    expect(propertyCardCopy(score({ hoursUsed: 5.9, weedsPulled: 0 }), 0.2).headline).toEqual({
      text: 'Callbacks put you 0.3 hrs over budget',
      tone: 'bad',
    });
  });

  it('shows overtime', () => {
    const c = propertyCardCopy(score({ hoursUsed: 6.9, hits: 3 }), 0.2);
    expect(c.efficiencyCaption).toBe('13% behind budget');
    expect(c.labor[2]).toEqual({ label: 'Over budget', value: '0.9 hrs', tone: 'bad' });
    expect(c.headline).toEqual({ text: '0.9 labor hours over budget', tone: 'bad' });
    expect(c.outcome.text).toBe('Clean work, over budget.');
  });

  it('calls an exact finish right on budget', () => {
    const c = propertyCardCopy(score({ hoursUsed: 6 }), 0.2);
    expect(c.labor).toHaveLength(2);
    expect(c.headline).toEqual({ text: 'Right on budget', tone: 'good' });
  });
});

describe('shiftCardCopy', () => {
  const shift = (a: Partial<PropertyInput>, b: Partial<PropertyInput>) => {
    return shiftCardCopy(summarizeRound([score(a), score(b)]));
  };

  it('tells the story of the example shift', () => {
    const c = shift({ hoursUsed: 5.63 }, { hoursUsed: 5.97, weedsPulled: 3, hits: 1 });
    expect(c.outcome).toEqual({ text: 'Fast route. One callback risk.', perfect: false });
    expect(c.efficiency).toBe('103% efficiency');
    expect(c.efficiencyCaption).toBe('Beat the budget by 3%');
    expect(c.labor).toEqual([
      { label: 'Budget', value: '12.0 hrs', tone: null },
      { label: 'Actual', value: '11.6 hrs', tone: null },
      { label: 'Under budget', value: '0.4 hrs', tone: 'good' },
      { label: 'Quality penalty', value: '−0.1 hrs', tone: 'bad' },
      { label: 'Saved after quality penalties', value: '0.3 hrs', tone: 'good' },
    ]);
    expect(c.takeaway).toEqual(['Fast only counts when the work is done right.', 'BomData shows where labor hours are won, lost, or hidden.']);
    expect(c.points).toBe('+2,080 pts');
  });

  it('ends the math with the result after quality penalties', () => {
    expect(shift({}, { hoursUsed: 5.8, weedsPulled: 2 }).labor.at(-1)).toEqual({ label: 'Saved after quality penalties', value: '0.4 hrs', tone: 'good' });
    expect(shift({ hoursUsed: 6 }, { hoursUsed: 5.8, weedsPulled: 2 }).labor.at(-1)).toEqual({
      label: 'Saved after quality penalties',
      value: '0.0 hrs',
      tone: 'warn',
    });
    expect(shift({ hoursUsed: 6 }, { hoursUsed: 5.9, weedsPulled: 0 }).labor.at(-1)).toEqual({
      label: 'Over budget after quality penalties',
      value: '0.3 hrs',
      tone: 'bad',
    });
  });

  it('celebrates a perfect shift', () => {
    const c = shift({}, {});
    expect(c.outcome).toEqual({ text: 'On budget. Full quality.', perfect: true });
    expect(c.labor).toHaveLength(3);
  });
});
