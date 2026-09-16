import type { RoundSummary } from '../rules/scoring';

export function starString(earned: number, total: number): string {
  return '★'.repeat(earned) + '☆'.repeat(Math.max(0, total - earned));
}

export function formatPoints(points: number): string {
  return points.toLocaleString('en-US');
}

export function formatHours(hours: number): string {
  return hours.toFixed(1);
}

const isZero = (hours: number) => formatHours(hours) === '0.0';

// The shift's labor result in a few words: over budget (net), hours saved, or neither.
export function laborPhrase(s: RoundSummary): string {
  const over = s.hoursUsed - s.budgetHours;
  if (over > 0 && !isZero(over)) return `${formatHours(over)} hrs over budget`;
  if (!isZero(s.hoursSaved)) return `${formatHours(s.hoursSaved)} hrs saved`;
  return isZero(over) ? 'right on budget' : 'no hours saved';
}

export function summaryLine(s: RoundSummary): string {
  return `⭐ ${s.stars}/${s.maxStars} · ${s.efficiency}% efficiency · ${laborPhrase(s)} · ${formatPoints(s.points)} pts`;
}

export function shareText(s: RoundSummary, pageUrl: string): string {
  return `I scored ${s.stars}/${s.maxStars} stars with ${s.efficiency}% efficiency in Margin Mower. Can you mow on budget? ${pageUrl}`;
}
