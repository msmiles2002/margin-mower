// The labor gauge at the top of the game: budgeted hours left on this property, draining as the crew works.
// It uses the same tenths-of-an-hour as the property card, so the two always agree.
const EPSILON = 1e-9;
export const LOW_FRACTION = 0.25;

export type GaugeTone = 'ok' | 'low' | 'over';

export interface BudgetGauge {
  label: string;
  value: string;
  fraction: number;
  tone: GaugeTone;
}

const hours = (value: number) => Math.max(0, value).toFixed(1);

export function budgetGauge(hoursUsed: number, budgetHours: number): BudgetGauge {
  if (hoursUsed > budgetHours + EPSILON) {
    return { label: 'OVER BUDGET', value: `+${hours(hoursUsed - budgetHours)} hrs`, fraction: 1, tone: 'over' };
  }
  const fraction = Math.max(0, 1 - hoursUsed / budgetHours);
  return {
    label: 'LABOR HOURS LEFT',
    value: `${hours(budgetHours - hoursUsed)} of ${hours(budgetHours)}`,
    fraction,
    tone: fraction > LOW_FRACTION ? 'ok' : 'low',
  };
}
