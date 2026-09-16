// Wording for the card shown after each property: budget → actual → variance → efficiency, then quality.
import { CLEAN_RUN_BONUS, efficiencyStars, type PropertyScore, type RoundSummary } from '../rules/scoring';
import { formatHours, formatPoints } from '../share/text';

export type VarianceTone = 'good' | 'warn' | 'bad';

export interface PropertyCardCopy {
  celebration: string | null;
  efficiency: string;
  budget: string;
  actual: string;
  variance: { text: string; tone: VarianceTone };
  collisions: { text: string; ok: boolean };
  cleanRunBonus: string | null;
  headline: string;
  points: string;
}

const hrs = (hours: number) => `${formatHours(hours)} hrs`;
const isZero = (hours: number) => formatHours(hours) === '0.0';

export function propertyCardCopy(score: PropertyScore, hoursPerBump: number): PropertyCardCopy {
  const fullQuality = score.cutStar && score.weedStar;

  let variance: PropertyCardCopy['variance'];
  let headline: string;
  if (!score.onBudget && !isZero(score.hoursOver)) {
    variance = { text: `${hrs(score.hoursOver)} over budget`, tone: 'bad' };
    headline = `${formatHours(score.hoursOver)} labor hours over budget`;
  } else if (isZero(score.hoursUnder)) {
    variance = { text: 'Right on budget', tone: 'good' };
    headline = 'Right on budget';
  } else if (fullQuality) {
    variance = { text: `${hrs(score.hoursUnder)} saved`, tone: 'good' };
    headline = `${formatHours(score.hoursUnder)} labor hours saved`;
  } else {
    variance = { text: `${hrs(score.hoursUnder)} under budget, but work was skipped`, tone: 'warn' };
    headline = 'No labor hours saved';
  }

  const collisions = score.collisionFree
    ? { text: 'No collisions', ok: true }
    : { text: `${score.hits} collision${score.hits === 1 ? '' : 's'} (+${hrs(score.hits * hoursPerBump)})`, ok: false };

  return {
    celebration: score.onBudget && fullQuality ? 'ON BUDGET. FULL QUALITY.' : null,
    efficiency: `${score.efficiency}% efficiency`,
    budget: hrs(score.budgetHours),
    actual: hrs(score.hoursUsed),
    variance,
    collisions,
    cleanRunBonus: score.collisionFree ? `Clean run bonus: +${CLEAN_RUN_BONUS}` : null,
    headline,
    points: `${score.points >= 0 ? '+' : ''}${formatPoints(score.points)} pts`,
  };
}

export interface NamedScore {
  name: string;
  score: PropertyScore;
}

export interface CheckLine {
  text: string;
  ok: boolean;
}

export interface ShiftCardCopy {
  celebration: string | null;
  efficiency: string;
  efficiencyStars: number;
  budget: string;
  actual: string;
  variance: { text: string; tone: VarianceTone };
  cut: CheckLine;
  weeds: CheckLine;
  collisions: CheckLine;
  properties: { name: string; stars: number; efficiency: string }[];
  headline: string;
  points: string;
}

// Wording for the final scorecard: the whole shift, netted across properties.
export function shiftCardCopy(results: readonly NamedScore[], summary: RoundSummary): ShiftCardCopy {
  const scores = results.map((r) => r.score);
  const sum = (pick: (s: PropertyScore) => number) => scores.reduce((total, s) => total + pick(s), 0);
  const over = summary.hoursUsed - summary.budgetHours;
  const under = -over;
  const saved = summary.hoursSaved;

  let variance: ShiftCardCopy['variance'];
  let headline: string;
  if (over > 0 && !isZero(over)) {
    variance = { text: `${hrs(over)} over budget`, tone: 'bad' };
    headline = `${formatHours(over)} labor hours over budget`;
  } else if (isZero(under)) {
    variance = { text: 'Right on budget', tone: 'good' };
    headline = 'Right on budget';
  } else if (isZero(saved)) {
    variance = { text: `${hrs(under)} under budget, but work was skipped`, tone: 'warn' };
    headline = 'No labor hours saved';
  } else if (formatHours(saved) === formatHours(under)) {
    variance = { text: `${hrs(saved)} saved`, tone: 'good' };
    headline = `${formatHours(saved)} labor hours saved`;
  } else {
    variance = { text: `${hrs(under)} under budget, ${hrs(saved)} saved`, tone: 'warn' };
    headline = `${formatHours(saved)} labor hours saved`;
  }

  const mowable = sum((s) => s.mowableColumns);
  const cut = mowable === 0 ? 100 : Math.floor((sum((s) => s.mowedColumns) / mowable) * 100);
  const weedsPulled = sum((s) => s.weedsPulled);
  const weedCount = sum((s) => s.weedCount);
  const hits = sum((s) => s.hits);

  return {
    celebration: scores.every((s) => s.onBudget && s.cutStar && s.weedStar) ? 'ON BUDGET. FULL QUALITY.' : null,
    efficiency: `${summary.efficiency}% efficiency`,
    efficiencyStars: efficiencyStars(summary.efficiency),
    budget: hrs(summary.budgetHours),
    actual: hrs(summary.hoursUsed),
    variance,
    cut: { text: `Grass cut: ${cut}%`, ok: cut === 100 },
    weeds: { text: `Weeds pulled: ${weedsPulled}/${weedCount}`, ok: weedsPulled === weedCount },
    collisions: hits === 0 ? { text: 'No collisions', ok: true } : { text: `${hits} collision${hits === 1 ? '' : 's'}`, ok: false },
    properties: results.map((r) => ({ name: r.name, stars: r.score.stars, efficiency: `${r.score.efficiency}%` })),
    headline,
    points: `${summary.points >= 0 ? '+' : ''}${formatPoints(summary.points)} pts`,
  };
}
