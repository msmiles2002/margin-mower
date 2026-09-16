import { config, withUtm } from '../config';
import { BUDGET_HOURS } from '../rules/constants';
import type { Property } from '../rules/levels';
import { MAX_STARS_PER_PROPERTY, type PropertyScore } from '../rules/scoring';
import { formatHours, starString } from '../share/text';
import { propertyCardCopy } from './cardCopy';
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

// The pixel font has no arrow glyph, so the arrow is drawn in the body font.
function nextButton(label: string, onClick: () => void): HTMLButtonElement {
  const node = button(label, 'primary', onClick);
  node.append(el('span', { className: 'arrow', text: ' →' }));
  return node;
}

export function showPropertyCard(
  overlay: HTMLElement,
  property: Property,
  score: PropertyScore,
  hoursPerBump: number,
  index: number,
  total: number,
): Promise<void> {
  const copy = propertyCardCopy(score, hoursPerBump);
  const star = (earned: boolean) => (earned ? '★' : '☆');
  return waitFor<void>(overlay, (done) => [
    el('h1', { text: property.name }),
    ...(copy.celebration === null ? [] : [el('div', { className: 'celebrate', text: copy.celebration })]),
    el('div', { className: 'stars', text: starString(score.stars, MAX_STARS_PER_PROPERTY) }),
    el('div', { className: 'section', text: 'LABOR PERFORMANCE' }),
    row(el('b', { text: copy.efficiency }), starString(score.efficiencyStars, 3)),
    row('Budget', copy.budget, 'value'),
    row('Actual', copy.actual, 'value'),
    el('div', { className: `variance ${copy.variance.tone}`, text: copy.variance.text }),
    el('div', { className: 'section', text: 'QUALITY' }),
    row(`Grass cut: ${score.cut}%`, star(score.cutStar)),
    ...(score.cutStar ? [] : [el('div', { className: 'sub-note', text: 'Hopping over grass left it uncut.' })]),
    row(`Weeds pulled: ${score.weedsPulled}/${score.weedCount}`, star(score.weedStar)),
    row(copy.collisions.text, copy.collisions.ok ? '✓' : '✗', copy.collisions.ok ? 'check' : 'cross'),
    ...(copy.cleanRunBonus === null ? [] : [el('div', { className: 'bonus', text: copy.cleanRunBonus })]),
    el('div', { className: 'payoff' }, [
      el('div', { className: `headline ${copy.variance.tone}`, text: copy.headline }),
      el('div', { className: 'points', text: copy.points }),
    ]),
    nextButton(index + 1 < total ? `HEAD TO PROPERTY ${index + 2}` : 'See my scorecard', () => done()),
  ]);
}

export function showFatal(overlay: HTMLElement): void {
  showPanel(overlay, [
    el('h2', { text: 'Something went wrong' }),
    el('p', { text: 'Reload to start a new shift.' }),
    button('Reload', 'primary', () => window.location.reload()),
  ]);
}
