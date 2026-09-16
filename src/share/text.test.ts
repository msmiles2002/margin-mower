import { describe, expect, it } from 'vitest';
import type { RoundSummary } from '../rules/scoring';
import { formatHours, formatPoints, shareText, starString, summaryLine } from './text';

const summary: RoundSummary = { stars: 8, maxStars: 10, efficiency: 97, points: 2330, hoursSaved: 0.8, title: 'Pro' };

describe('share text', () => {
  it('draws filled and empty stars', () => {
    expect(starString(2, 5)).toBe('★★☆☆☆');
    expect(starString(0, 3)).toBe('☆☆☆');
  });

  it('formats numbers', () => {
    expect(formatPoints(2330)).toBe('2,330');
    expect(formatPoints(-30)).toBe('-30');
    expect(formatHours(0.84)).toBe('0.8');
    expect(formatHours(6)).toBe('6.0');
  });

  it('builds the scorecard summary line', () => {
    expect(summaryLine(summary)).toBe('⭐ 8/10 · 97% efficiency · 2,330 pts · 0.8 hrs saved');
  });

  it('builds share text with the page link and no BomData stat', () => {
    const text = shareText(summary, 'https://bomdata.io/margin-mower/');
    expect(text).toBe(
      'I scored 8/10 stars with 97% efficiency in Margin Mower. Can you mow on budget? https://bomdata.io/margin-mower/',
    );
    expect(text).not.toContain('8–10%');
  });
});
