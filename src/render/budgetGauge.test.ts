import { describe, expect, it } from 'vitest';
import { budgetGauge } from './budgetGauge';

describe('budgetGauge', () => {
  it('starts full', () => {
    expect(budgetGauge(0, 6)).toEqual({ label: 'LABOR HOURS LEFT', value: '6.0 of 6.0', fraction: 1, tone: 'ok' });
  });

  it('drains as hours are used, in the same hours as the scorecard', () => {
    const g = budgetGauge(1.5, 6);
    expect(g.value).toBe('4.5 of 6.0');
    expect(g.fraction).toBeCloseTo(0.75);
    expect(g.tone).toBe('ok');
    expect(budgetGauge(5.6, 6).value).toBe('0.4 of 6.0');
  });

  it('turns low in the last quarter of the budget', () => {
    expect(budgetGauge(4.4, 6).tone).toBe('ok');
    expect(budgetGauge(4.6, 6).tone).toBe('low');
    expect(budgetGauge(6, 6)).toEqual({ label: 'LABOR HOURS LEFT', value: '0.0 of 6.0', fraction: 0, tone: 'low' });
  });

  it('shows how far over budget the crew is', () => {
    expect(budgetGauge(6.4, 6)).toEqual({ label: 'OVER BUDGET', value: '+0.4 hrs', fraction: 1, tone: 'over' });
  });
});
