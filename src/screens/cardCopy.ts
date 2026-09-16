// Wording for the property card and the final scorecard:
// rank → efficiency → labor saved → budget / actual / variance / callbacks → quality.
import { CLEAN_RUN_BONUS, type PropertyScore, type RoundSummary } from '../rules/scoring';
import { formatHours, formatPoints, outcomeLine } from '../share/text';

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
  points: string;
}

export interface PropertyCardCopy extends CardCopy {
  quality: CheckLine[];
  callbackRisk: string | null;
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

export interface ShiftCardCopy extends CardCopy {
  takeaway: readonly string[];
}

export const TAKEAWAY: readonly string[] = [
  'Fast only counts when the work is done right.',
  'BomData shows where labor hours are won, lost, or hidden.',
];

export function shiftCardCopy(summary: RoundSummary): ShiftCardCopy {
  return {
    outcome: outcomeLine(summary),
    efficiency: `${summary.efficiency}% efficiency`,
    efficiencyCaption: efficiencyCaption(summary.efficiency),
    headline: laborHeadline(summary),
    labor: laborLines(summary, true),
    takeaway: TAKEAWAY,
    points: pointsText(summary.points),
  };
}
