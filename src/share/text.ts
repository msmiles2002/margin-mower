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

export function summaryLine(s: RoundSummary): string {
  return `⭐ ${s.stars}/${s.maxStars} · ${s.efficiency}% efficiency · ${formatPoints(s.points)} pts · ${formatHours(s.hoursSaved)} hrs saved`;
}

export function shareText(s: RoundSummary, pageUrl: string): string {
  return `I scored ${s.stars}/${s.maxStars} stars with ${s.efficiency}% efficiency in Margin Mower. Can you mow on budget? ${pageUrl}`;
}
