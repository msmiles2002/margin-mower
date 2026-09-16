// Scoring works in tenths of an hour, the same unit every screen shows, so the numbers always add up.

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
  // Budgeted ÷ actual hours, like BomData's estimated-vs-actual framing. Over 100% means under budget.
  efficiency: number;
  efficiencyStars: number;
  cut: number;
  cutStar: boolean;
  weedStar: boolean;
  fullQuality: boolean;
  collisionFree: boolean;
  weedsMissed: number;
  uncutColumns: number;
  // Missed work that will need a return visit.
  callbackItems: number;
  callbackHours: number;
  // Budget − actual (negative when over budget).
  underHours: number;
  // Under budget after quality (callback) penalties (positive = saved, negative = over budget).
  netHours: number;
  stars: number;
  points: number;
}

export const MAX_STARS = 5;
// Every finished property and shift earns at least one star.
export const MIN_STARS = 1;
export const CLEAN_RUN_BONUS = 100;
export const CALLBACK_HOURS_PER_WEED = 0.1;
export const CALLBACK_HOURS_PER_UNCUT_BLOCK = 0.1;
export const UNCUT_COLUMNS_PER_BLOCK = 5;

export const toTenths = (hours: number): number => Math.round(hours * 10) / 10;

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

export function scoreProperty(input: PropertyInput): PropertyScore {
  const hoursUsed = toTenths(input.hoursUsed);
  const budgetHours = toTenths(input.budgetHours);
  const efficiency = efficiencyPercent(hoursUsed, budgetHours);
  const effStars = efficiencyStars(efficiency);
  const cut = input.mowableColumns === 0 ? 100 : Math.floor((input.mowedColumns / input.mowableColumns) * 100);
  const cutStar = input.mowedColumns >= input.mowableColumns;
  const weedsMissed = input.weedCount - input.weedsPulled;
  const weedStar = weedsMissed === 0;
  const uncutColumns = input.mowableColumns - input.mowedColumns;
  const uncutBlocks = Math.ceil(uncutColumns / UNCUT_COLUMNS_PER_BLOCK);
  const callbackHours = toTenths(weedsMissed * CALLBACK_HOURS_PER_WEED + uncutBlocks * CALLBACK_HOURS_PER_UNCUT_BLOCK);
  const underHours = toTenths(budgetHours - hoursUsed);
  const netHours = toTenths(underHours - callbackHours);
  const collisionFree = input.hits === 0;

  const points =
    input.mowedColumns * 10 +
    input.weedsPulled * 50 +
    Math.round(netHours * 10) * 10 +
    (collisionFree ? CLEAN_RUN_BONUS : 0);

  return {
    ...input,
    hoursUsed,
    budgetHours,
    efficiency,
    efficiencyStars: effStars,
    cut,
    cutStar,
    weedStar,
    fullQuality: cutStar && weedStar,
    collisionFree,
    weedsMissed,
    uncutColumns,
    callbackItems: weedsMissed + (uncutColumns > 0 ? 1 : 0),
    callbackHours,
    underHours,
    netHours,
    stars: Math.max(MIN_STARS, effStars + (cutStar ? 1 : 0) + (weedStar ? 1 : 0)),
    points,
  };
}

export type Title = 'Rookie' | 'Crew Lead' | 'Route Pro' | 'Margin Master';

export function titleFor(stars: number): Title {
  if (stars >= 5) return 'Margin Master';
  if (stars >= 4) return 'Route Pro';
  if (stars >= 3) return 'Crew Lead';
  return 'Rookie';
}

export interface RoundSummary {
  // One 1–5 rating for the shift: the property ratings averaged, rounded down.
  stars: number;
  maxStars: number;
  efficiency: number;
  points: number;
  budgetHours: number;
  hoursUsed: number;
  underHours: number;
  callbackHours: number;
  callbackItems: number;
  netHours: number;
  hits: number;
  fullQuality: boolean;
  title: Title;
}

export function summarizeRound(scores: readonly PropertyScore[]): RoundSummary {
  const sum = (pick: (s: PropertyScore) => number) => scores.reduce((total, s) => total + pick(s), 0);
  const stars = scores.length === 0 ? MIN_STARS : Math.max(MIN_STARS, Math.floor(sum((s) => s.stars) / scores.length));
  const budgetHours = toTenths(sum((s) => s.budgetHours));
  const hoursUsed = toTenths(sum((s) => s.hoursUsed));
  return {
    stars,
    maxStars: MAX_STARS,
    efficiency: efficiencyPercent(hoursUsed, budgetHours),
    points: sum((s) => s.points),
    budgetHours,
    hoursUsed,
    underHours: toTenths(sum((s) => s.underHours)),
    callbackHours: toTenths(sum((s) => s.callbackHours)),
    callbackItems: sum((s) => s.callbackItems),
    netHours: toTenths(sum((s) => s.netHours)),
    hits: sum((s) => s.hits),
    fullQuality: scores.every((s) => s.fullQuality),
    title: titleFor(stars),
  };
}
