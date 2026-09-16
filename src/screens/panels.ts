import { config, withUtm } from '../config';
import { BUDGET_HOURS } from '../rules/constants';
import type { Property } from '../rules/levels';
import { MAX_STARS_PER_PROPERTY, type PropertyScore } from '../rules/scoring';
import { formatHours, formatPoints, starString } from '../share/text';
import { button, el, logo, row, showPanel, waitFor } from './dom';

export function showTitle(overlay: HTMLElement): Promise<void> {
  return waitFor<void>(overlay, (done) => [
    logo(withUtm(config.siteUrl)),
    el('h1', { text: 'Margin Mower' }),
    el('p', {}, [el('b', { text: 'You’ve got 6 hours. Don’t blow the labor budget.' })]),
    el('p', {}, ['Two properties. One crew.', el('br'), 'Finish the route before your hours run out.']),
    button('Start shift', 'primary', () => done()),
  ]);
}

// Lines separated by <br>.
const lines = (values: readonly string[]) => values.flatMap((v, i) => (i === 0 ? [v] : [el('br'), v]));

export function showIntro(overlay: HTMLElement, property: Property, index: number, total: number): Promise<void> {
  const { pitch, controls, warning } = property.intro;
  return waitFor<void>(overlay, (done) => [
    el('h2', { text: `Property ${index + 1} of ${total}` }),
    el('h1', { text: property.name }),
    el('div', { className: 'tip' }, lines(pitch)),
    el('div', { className: 'keys' }, [
      ...controls.map((c) => el('div', {}, [el('b', { text: c.key }), c.rest])),
      el('div', { className: 'keys-note' }, lines(warning)),
    ]),
    el('p', { text: `${formatHours(BUDGET_HOURS)} hrs budgeted` }),
    button('LET’S MOW', 'primary', () => done()),
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
