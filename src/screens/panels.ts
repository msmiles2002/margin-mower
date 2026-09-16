import { config, withUtm } from '../config';
import { BUDGET_HOURS } from '../rules/constants';
import type { Crew } from '../rules/crews';
import type { Property } from '../rules/levels';
import { MAX_STARS_PER_PROPERTY, type PropertyScore } from '../rules/scoring';
import { formatHours, formatPoints, starString } from '../share/text';
import { button, el, logo, row, showPanel, waitFor, withBold } from './dom';

export function showTitle(overlay: HTMLElement): Promise<void> {
  return waitFor<void>(overlay, (done) => [
    logo(withUtm(config.siteUrl)),
    el('h1', { text: 'Margin Mower' }),
    el('p', {}, [el('b', { text: 'Can you mow on budget?' })]),
    el('p', {
      text: 'Two properties. Hop the obstacles, duck the branches, pull the weeds, and cross the finish line before your 6 hours run out.',
    }),
    button('Start shift', 'primary', () => done()),
  ]);
}

function controlsHelp(crew: Crew): HTMLDivElement {
  const line = (label: string, rest: string) => el('div', {}, [el('b', { text: label }), rest]);
  return el('div', { className: 'keys' }, [
    line('⬆ Hop', ` over ${crew.canDuck ? 'rocks, shrubs and neighbors' : 'sprinklers, picnic tables and dog walkers'}: ↑, Space, or tap the game`),
    ...(crew.canDuck ? [line('⬇ Duck', ' under low branches: hold ↓')] : []),
    line('⬇ Pull', ' weeds as you pass over them: press ↓'),
    el('div', { className: 'keys-note', text: 'Only hop when you need to: grass you fly over doesn’t get cut.' }),
  ]);
}

export function showIntro(overlay: HTMLElement, property: Property, crew: Crew, index: number, total: number): Promise<void> {
  return waitFor<void>(overlay, (done) => [
    el('h2', { text: `Property ${index + 1} of ${total}` }),
    el('h1', { text: property.name }),
    el('div', { className: 'tip' }, [el('b', { className: 'label', text: 'BomData heads-up' }), ...withBold(property.tip)]),
    controlsHelp(crew),
    el('p', { text: `Budget: ${formatHours(BUDGET_HOURS)} hrs` }),
    button('Go!', 'primary', () => done()),
  ]);
}

function bumpNote(score: PropertyScore, hoursPerBump: number): string {
  const bumps =
    score.hits === 0
      ? 'No bumps. Smooth driving.'
      : `${score.hits} bump${score.hits > 1 ? 's' : ''} cost you ${formatHours(score.hits * hoursPerBump)} hrs.`;
  return score.cutStar ? bumps : `${bumps} Hopping over grass left it uncut.`;
}

export function showPropertyCard(
  overlay: HTMLElement,
  property: Property,
  score: PropertyScore,
  hoursPerBump: number,
  isLast: boolean,
): Promise<void> {
  const star = (earned: boolean) => (earned ? '★' : '☆');
  return waitFor<void>(overlay, (done) => [
    el('h1', { text: property.name }),
    el('div', { className: 'stars', text: starString(score.stars, MAX_STARS_PER_PROPERTY) }),
    el('div', { className: 'section', text: 'EFFICIENCY' }),
    row(
      el('span', {}, [`${score.efficiency}% `, el('small', { text: `(${formatHours(score.hoursUsed)} of ${formatHours(score.budgetHours)} hrs)` })]),
      starString(score.efficiencyStars, 3),
    ),
    el('div', { className: 'section', text: 'QUALITY' }),
    row(`Grass cut: ${score.cut}%`, star(score.cutStar)),
    row(`Weeds pulled: ${score.weedsPulled}/${score.weedCount}`, star(score.weedStar)),
    el('p', { className: 'proof note', text: bumpNote(score, hoursPerBump) }),
    el('p', {}, [el('b', { text: `${formatPoints(score.points)} pts` })]),
    button(isLast ? 'See my scorecard' : 'Next property', 'primary', () => done()),
  ]);
}

export function showFatal(overlay: HTMLElement): void {
  showPanel(overlay, [
    el('h2', { text: 'Something went wrong' }),
    el('p', { text: 'Reload to start a new shift.' }),
    button('Reload', 'primary', () => window.location.reload()),
  ]);
}
