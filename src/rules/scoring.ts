const EPSILON = 1e-9;

export interface PropertyInput {
  hoursUsed: number;
  budgetHours: number;
  mowedColumns: number;
  mowableColumns: number;
  weedsPulled: number;
  weedCount: number;
  hits: number;
}

export interface PropertyScore extends PropertyInput {
  efficiency: number;
  efficiencyStars: number;
  onBudget: boolean;
  hoursUnder: number;
  hoursOver: number;
  cut: number;
  cutStar: boolean;
  weedStar: boolean;
  collisionFree: boolean;
  stars: number;
  points: number;
  hoursSaved: number;
}

export const MAX_STARS_PER_PROPERTY = 5;
export const CLEAN_RUN_BONUS = 100;

// Budgeted hours ÷ actual hours, like BomData's estimated-vs-actual framing. Finishing early scores over 100%.
export function efficiencyPercent(hoursUsed: number, budgetHours: number): number {
  if (hoursUsed <= 0) return 100;
  return Math.round((budgetHours / hoursUsed) * 100);
}

export function efficiencyStars(percent: number): number {
  if (percent > 95) return 3;
  if (percent > 80) return 2;
  if (percent > 70) return 1;
  return 0;
}

const tenths = (hours: number) => Math.floor(hours * 10 + EPSILON);

export function scoreProperty(input: PropertyInput): PropertyScore {
  const efficiency = efficiencyPercent(input.hoursUsed, input.budgetHours);
  const effStars = efficiencyStars(efficiency);
  const cut = input.mowableColumns === 0 ? 100 : Math.floor((input.mowedColumns / input.mowableColumns) * 100);
  const cutStar = cut === 100;
  const weedStar = input.weedsPulled === input.weedCount;
  const collisionFree = input.hits === 0;
  const onBudget = input.hoursUsed <= input.budgetHours + EPSILON;

  let points = input.mowedColumns * 10 + input.weedsPulled * 50;
  if (onBudget) {
    if (cutStar) points += tenths(input.budgetHours - input.hoursUsed) * 10;
  } else {
    points -= tenths(input.hoursUsed - input.budgetHours) * 10;
  }
  if (collisionFree) points += CLEAN_RUN_BONUS;

  return {
    ...input,
    efficiency,
    efficiencyStars: effStars,
    onBudget,
    hoursUnder: onBudget ? input.budgetHours - input.hoursUsed : 0,
    hoursOver: onBudget ? 0 : input.hoursUsed - input.budgetHours,
    cut,
    cutStar,
    weedStar,
    collisionFree,
    stars: effStars + (cutStar ? 1 : 0) + (weedStar ? 1 : 0),
    points,
    hoursSaved: onBudget && cutStar && weedStar ? input.budgetHours - input.hoursUsed : 0,
  };
}

export type Title = 'Rookie' | 'Crew Lead' | 'Pro' | 'Margin Master';

export function titleFor(stars: number): Title {
  if (stars >= 10) return 'Margin Master';
  if (stars >= 8) return 'Pro';
  if (stars >= 5) return 'Crew Lead';
  return 'Rookie';
}

export interface RoundSummary {
  stars: number;
  maxStars: number;
  efficiency: number;
  points: number;
  hoursSaved: number;
  budgetHours: number;
  hoursUsed: number;
  title: Title;
}

export function summarizeRound(scores: readonly PropertyScore[]): RoundSummary {
  const sum = (pick: (s: PropertyScore) => number) => scores.reduce((total, s) => total + pick(s), 0);
  const stars = sum((s) => s.stars);
  return {
    stars,
    maxStars: scores.length * MAX_STARS_PER_PROPERTY,
    efficiency: efficiencyPercent(sum((s) => s.hoursUsed), sum((s) => s.budgetHours)),
    points: sum((s) => s.points),
    hoursSaved: Math.round(sum((s) => s.hoursSaved) * 10) / 10,
    budgetHours: Math.round(sum((s) => s.budgetHours) * 1e6) / 1e6,
    hoursUsed: Math.round(sum((s) => s.hoursUsed) * 1e6) / 1e6,
    title: titleFor(stars),
  };
}
