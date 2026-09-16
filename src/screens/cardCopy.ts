// Wording for the property card and the final scorecard:
// rank → efficiency → labor saved → budget / actual / variance / callbacks → quality.
import { CLEAN_RUN_BONUS, type PropertyScore, type RoundSummary } from '../rules/scoring';
import { counted, formatHours, formatPoints, outcomeLine } from '../share/text';

export type Tone = 'good' | 'warn' | 'bad';

export interface LaborLine {
  label: string;
  value: string;
  tone: Tone | null;
}

export interface CheckLine {
  text: string;
  ok: boolean;
}

interface LaborFacts {
  budgetHours: number;
  hoursUsed: number;
  underHours: number;
  callbackHours: number;
  netHours: number;
  efficiency: number;
}

const hrs = (hours: number) => `${formatHours(hours)} hrs`;
const pointsText = (points: number) => `${points >= 0 ? '+' : ''}${formatPoints(points)} pts`;

export function efficiencyCaption(efficiency: number): string {
  if (efficiency > 100) return `Beat the budget by ${efficiency - 100}%`;
  if (efficiency === 100) return 'Right on budget';
  return `${100 - efficiency}% behind budget`;
}

// `withNet` ends the rows with the result after quality penalties (used on the final scorecard).
export function laborLines(f: LaborFacts, withNet = false): LaborLine[] {
  const lines: LaborLine[] = [
    { label: 'Budget', value: hrs(f.budgetHours), tone: null },
    { label: 'Actual', value: hrs(f.hoursUsed), tone: null },
  ];
  if (f.underHours > 0) lines.push({ label: 'Under budget', value: hrs(f.underHours), tone: 'good' });
  if (f.underHours < 0) lines.push({ label: 'Over budget', value: hrs(-f.underHours), tone: 'bad' });
  if (f.callbackHours > 0) {
    lines.push({ label: 'Quality penalty', value: `−${hrs(f.callbackHours)}`, tone: 'bad' });
    if (withNet && f.netHours >= 0) {
      lines.push({ label: 'Saved after quality penalties', value: hrs(f.netHours), tone: f.netHours > 0 ? 'good' : 'warn' });
    }
    if (withNet && f.netHours < 0) {
      lines.push({ label: 'Over budget after quality penalties', value: hrs(-f.netHours), tone: 'bad' });
    }
  }
  return lines;
}

export function laborHeadline(f: LaborFacts): { text: string; tone: Tone } {
  const net = formatHours(Math.abs(f.netHours));
  if (f.netHours > 0) {
    return { text: `${net} labor hours saved${f.callbackHours > 0 ? ' after quality penalties' : ''}`, tone: 'good' };
  }
  if (f.netHours === 0) {
    return f.underHours > 0 ? { text: 'Callbacks ate the savings', tone: 'warn' } : { text: 'Right on budget', tone: 'good' };
  }
  if (f.underHours >= 0) return { text: `Callbacks put you ${net} hrs over budget`, tone: 'bad' };
  return { text: `${net} labor hours over budget`, tone: 'bad' };
}

function callbackRisk(items: number): string | null {
  return items === 0 ? null : `Callback risk: ${items} missed item${items === 1 ? '' : 's'}`;
}

function collisionsLine(hits: number, extra: string): CheckLine {
  return hits === 0 ? { text: 'No collisions', ok: true } : { text: `${hits} collision${hits === 1 ? '' : 's'}${extra}`, ok: false };
}

export interface CardCopy {
  outcome: { text: string; perfect: boolean };
  efficiency: string;
  efficiencyCaption: string;
  headline: { text: string; tone: Tone };
  labor: LaborLine[];
  quality: CheckLine[];
  callbackRisk: string | null;
  points: string;
}

export interface PropertyCardCopy extends CardCopy {
  cleanRunBonus: string | null;
}

export function propertyCardCopy(score: PropertyScore, hoursPerBump: number): PropertyCardCopy {
  return {
    outcome: outcomeLine(score),
    efficiency: `${score.efficiency}% efficiency`,
    efficiencyCaption: efficiencyCaption(score.efficiency),
    headline: laborHeadline(score),
    labor: laborLines(score),
    quality: [
      { text: `Grass cut: ${score.cut}%`, ok: score.cutStar },
      { text: `Weeds pulled: ${score.weedsPulled}/${score.weedCount}`, ok: score.weedStar },
      collisionsLine(score.hits, ` (+${hrs(score.hits * hoursPerBump)})`),
    ],
    callbackRisk: callbackRisk(score.callbackItems),
    cleanRunBonus: score.collisionFree ? `Clean run bonus: +${CLEAN_RUN_BONUS}` : null,
    points: pointsText(score.points),
  };
}

export interface NamedScore {
  name: string;
  score: PropertyScore;
}

export interface ShiftCardCopy extends CardCopy {
  properties: { name: string; efficiency: string; story: string }[];
  takeaway: readonly string[];
}

// A short story for one property on the final scorecard, e.g. "Fast finish, one missed weed".
export function propertyStory(s: PropertyScore): string {
  if (s.fullQuality && s.collisionFree) {
    const labor = s.underHours > 0 ? 'under budget' : s.underHours === 0 ? 'on budget' : s.underHours >= -0.3 ? 'just over budget' : 'over budget';
    return `Clean job, ${labor}`;
  }
  const labor = s.underHours > 0 ? 'Fast finish' : s.underHours === 0 ? 'On budget' : s.underHours >= -0.3 ? 'Just over budget' : 'Over budget';
  if (s.fullQuality) return `${labor}, ${counted(s.hits, 'bump').toLowerCase()}`;
  if (s.weedsMissed > 0 && s.uncutColumns > 0) return `${labor}, missed weeds and grass`;
  if (s.weedsMissed > 0) return `${labor}, ${counted(s.weedsMissed, 'missed weed').toLowerCase()}`;
  return `${labor}, grass left uncut`;
}

export const TAKEAWAY: readonly string[] = [
  'Fast only counts when the work is done right.',
  'BomData shows where labor hours are won, lost, or hidden.',
];

export function shiftCardCopy(results: readonly NamedScore[], summary: RoundSummary): ShiftCardCopy {
  const scores = results.map((r) => r.score);
  const sum = (pick: (s: PropertyScore) => number) => scores.reduce((total, s) => total + pick(s), 0);
  const mowable = sum((s) => s.mowableColumns);
  const cut = mowable === 0 ? 100 : Math.floor((sum((s) => s.mowedColumns) / mowable) * 100);
  const weedsPulled = sum((s) => s.weedsPulled);
  const weedCount = sum((s) => s.weedCount);
  return {
    outcome: outcomeLine(summary),
    efficiency: `${summary.efficiency}% efficiency`,
    efficiencyCaption: efficiencyCaption(summary.efficiency),
    headline: laborHeadline(summary),
    labor: laborLines(summary, true),
    quality: [
      { text: `Grass cut: ${cut}%`, ok: scores.every((s) => s.cutStar) },
      { text: `Weeds pulled: ${weedsPulled}/${weedCount}`, ok: weedsPulled === weedCount },
      collisionsLine(summary.hits, ''),
    ],
    callbackRisk: callbackRisk(summary.callbackItems),
    properties: results.map((r) => ({ name: r.name, efficiency: `${r.score.efficiency}% efficiency`, story: propertyStory(r.score) })),
    takeaway: TAKEAWAY,
    points: pointsText(summary.points),
  };
}
