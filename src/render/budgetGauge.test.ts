import { describe, expect, it } from 'vitest';
import { budgetGauge, formatClock } from './budgetGauge';

describe('formatClock', () => {
  it.each([
    [6, '6:00'],
    [5.4, '5:24'],
    [0.5, '0:30'],
    [0, '0:00'],
  ])('%s hours is %s', (hours, clock) => {
    expect(formatClock(hours)).toBe(clock);
  });

  it('rounds up, so the clock only reads 0:00 when the budget is gone', () => {
    expect(formatClock(0.001)).toBe('0:01');
    expect(formatClock(5.999)).toBe('6:00');
  });
});

describe('budgetGauge', () => {
  it('starts full', () => {
    expect(budgetGauge(0, 6)).toEqual({ label: 'LABOR BUDGET', time: '6:00', fraction: 1, tone: 'ok' });
  });

  it('drains as hours are used', () => {
    const g = budgetGauge(1.5, 6);
    expect(g.time).toBe('4:30');
    expect(g.fraction).toBeCloseTo(0.75);
    expect(g.tone).toBe('ok');
  });

  it('turns low in the last quarter of the budget', () => {
    expect(budgetGauge(4.4, 6).tone).toBe('ok');
    expect(budgetGauge(4.6, 6).tone).toBe('low');
    expect(budgetGauge(6, 6)).toEqual({ label: 'LABOR BUDGET', time: '0:00', fraction: 0, tone: 'low' });
  });

  it('shows how far over budget the crew is', () => {
    expect(budgetGauge(6.4, 6)).toEqual({ label: 'OVER BUDGET', time: '+0:24', fraction: 1, tone: 'over' });
  });
});
