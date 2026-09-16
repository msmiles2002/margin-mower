import { describe, expect, it } from 'vitest';
import type { RoundSummary } from '../rules/scoring';
import { counted, formatHours, formatPoints, laborPhrase, outcomeLine, shareText, starString, summaryLine } from './text';

const summary: RoundSummary = {
  stars: 4,
  maxStars: 5,
  efficiency: 103,
  points: 2080,
  budgetHours: 12,
  hoursUsed: 11.6,
  underHours: 0.4,
  callbackHours: 0.1,
  callbackItems: 1,
  netHours: 0.3,
  hits: 1,
  fullQuality: false,
  title: 'Route Pro',
};
const facts = { underHours: 0.4, callbackItems: 0, hits: 0, fullQuality: true };

describe('share text', () => {
  it('draws filled and empty stars', () => {
    expect(starString(4, 5)).toBe('★★★★☆');
  });

  it('formats numbers and counts', () => {
    expect(formatPoints(2330)).toBe('2,330');
    expect(formatHours(6)).toBe('6.0');
    expect(counted(1, 'callback risk')).toBe('One callback risk');
    expect(counted(2, 'bump')).toBe('Two bumps');
    expect(counted(12, 'bump')).toBe('12 bumps');
  });

  it('describes the shift labor result after callbacks', () => {
    expect(laborPhrase(summary)).toBe('0.3 hrs saved');
    expect(laborPhrase({ ...summary, netHours: -0.5 })).toBe('0.5 hrs over budget');
    expect(laborPhrase({ ...summary, netHours: 0 })).toBe('right on budget');
  });

  it('builds the summary line and share text without the BomData stat', () => {
    expect(summaryLine(summary)).toBe('Route Pro · 4/5 stars · 103% efficiency · 0.3 hrs saved · 2,080 pts');
    const text = shareText(summary, 'https://bomdata.io/margin-mower/');
    expect(text).toBe(
      'I finished as a Route Pro in Margin Mower: 103% efficiency, 0.3 hrs saved. Can you mow on budget? https://bomdata.io/margin-mower/',
    );
    expect(text).not.toContain('8–10%');
  });
});

describe('outcomeLine', () => {
  it.each([
    [facts, 'On budget. Full quality.', true],
    [{ ...facts, underHours: 0 }, 'On budget. Full quality.', true],
    [{ ...facts, hits: 1 }, 'Clean work. One bump.', false],
    [{ ...facts, underHours: -0.5 }, 'Clean work, over budget.', false],
    [{ ...facts, fullQuality: false, callbackItems: 1, hits: 1 }, 'Fast route. One callback risk.', false],
    [{ ...facts, fullQuality: false, callbackItems: 2, underHours: 0 }, 'On budget. Two callback risks.', false],
    [{ ...facts, fullQuality: false, callbackItems: 3, underHours: -1 }, 'Over budget. Three callback risks.', false],
  ])('%o → %s', (input, text, perfect) => {
    expect(outcomeLine(input)).toEqual({ text, perfect });
  });
});
