// Wording for the card shown after each property: budget → actual → variance → efficiency, then quality.
import { CLEAN_RUN_BONUS, type PropertyScore } from '../rules/scoring';
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
