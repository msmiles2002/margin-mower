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

const NUMBER_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];

// "One callback risk", "Two bumps", "12 bumps"
export function counted(count: number, noun: string): string {
  return `${NUMBER_WORDS[count] ?? String(count)} ${noun}${count === 1 ? '' : 's'}`;
}

export interface OutcomeFacts {
  underHours: number;
  callbackItems: number;
  hits: number;
  fullQuality: boolean;
}

// The one-line story of a property or a shift, shown under the rank.
export function outcomeLine(o: OutcomeFacts): { text: string; perfect: boolean } {
  const notOver = o.underHours >= 0;
  if (o.fullQuality && notOver && o.hits === 0) return { text: 'On budget. Full quality.', perfect: true };
  if (o.fullQuality && notOver) return { text: `Clean work. ${counted(o.hits, 'bump')}.`, perfect: false };
  if (o.fullQuality) return { text: 'Clean work, over budget.', perfect: false };
  const risk = counted(o.callbackItems, 'callback risk');
  if (o.underHours > 0) return { text: `Fast route. ${risk}.`, perfect: false };
  if (o.underHours === 0) return { text: `On budget. ${risk}.`, perfect: false };
  return { text: `Over budget. ${risk}.`, perfect: false };
}

// The shift's labor result after callbacks, in a few words.
export function laborPhrase(s: RoundSummary): string {
  if (s.netHours > 0) return `${formatHours(s.netHours)} hrs saved`;
  if (s.netHours < 0) return `${formatHours(-s.netHours)} hrs over budget`;
  return 'right on budget';
}

export function summaryLine(s: RoundSummary): string {
  return `${s.title} · ${s.stars}/${s.maxStars} stars · ${s.efficiency}% efficiency · ${laborPhrase(s)} · ${formatPoints(s.points)} pts`;
}

// "https://bomdata.io/margin-mower/" → "bomdata.io/margin-mower"
export function displayUrl(pageUrl: string): string {
  return pageUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export function shareText(s: RoundSummary, pageUrl: string): string {
  return [
    `I hit ${s.title} in Margin Mower 🌱`,
    `${s.efficiency}% efficiency · ${laborPhrase(s)}`,
    '',
    'Think you can beat it?',
    displayUrl(pageUrl),
  ].join('\n');
}
