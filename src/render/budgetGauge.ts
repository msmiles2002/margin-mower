// The labor budget gauge at the top of the game: time left on the budget, draining as the crew works.
const EPSILON = 1e-9;
export const LOW_FRACTION = 0.25;

export type GaugeTone = 'ok' | 'low' | 'over';

export interface BudgetGauge {
  label: string;
  time: string;
  fraction: number;
  tone: GaugeTone;
}

// Hours as h:mm, rounded up to the next minute so the clock reads 0:00 only when the budget is gone.
export function formatClock(hours: number): string {
  const minutes = Math.max(0, Math.ceil(hours * 60 - 1e-6));
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
}

export function budgetGauge(hoursUsed: number, budgetHours: number): BudgetGauge {
  if (hoursUsed > budgetHours + EPSILON) {
    return { label: 'OVER BUDGET', time: `+${formatClock(hoursUsed - budgetHours)}`, fraction: 1, tone: 'over' };
  }
  const fraction = Math.max(0, 1 - hoursUsed / budgetHours);
  return { label: 'LABOR BUDGET', time: formatClock(budgetHours - hoursUsed), fraction, tone: fraction > LOW_FRACTION ? 'ok' : 'low' };
}
