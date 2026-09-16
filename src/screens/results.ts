import { isValidEmail, type LeadFields } from '../hubspot';
import { MAX_STARS_PER_PROPERTY, type RoundSummary } from '../rules/scoring';
import type { ShareOutcome } from '../share/share';
import { starString } from '../share/text';
import { shiftCardCopy, type CheckLine, type NamedScore } from './cardCopy';
import { button, el, link, logo, row, waitFor } from './dom';

export interface ResultsActions {
  demoUrl: string;
  siteUrl: string;
  showLeadForm: boolean;
  onShare(): Promise<ShareOutcome>;
  onSubmitLead(lead: LeadFields): Promise<boolean>;
}

const SHARE_MESSAGES: Record<ShareOutcome, string> = {
  shared: 'Shared!',
  downloaded: 'Image saved. Attach it to your LinkedIn post.',
  cancelled: '',
};

function input(name: string, placeholder: string, type: string): HTMLInputElement {
  const node = el('input');
  node.name = name;
  node.placeholder = placeholder;
  node.type = type;
  node.required = true;
  node.setAttribute('aria-label', placeholder);
  return node;
}

function leadForm(onSubmitLead: ResultsActions['onSubmitLead']): HTMLFormElement {
  const firstName = input('firstname', 'First name', 'text');
  const company = input('company', 'Company', 'text');
  const email = input('email', 'Work email', 'email');
  const status = el('p', { className: 'form-status' });
  const submit = el('button', { className: 'btn secondary', text: 'Send it' });
  submit.type = 'submit';
  const form = el('form', { className: 'lead' }, [
    el('h2', { text: 'See your real scorecard' }),
    el('p', { text: 'BomData turns your Aspire data into this, every week.' }),
    firstName,
    company,
    email,
    submit,
    status,
  ]);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!isValidEmail(email.value)) {
      status.textContent = 'Please enter a valid email.';
      return;
    }
    submit.disabled = true;
    status.textContent = 'Saving…';
    const ok = await onSubmitLead({ firstName: firstName.value, company: company.value, email: email.value });
    if (ok) {
      status.textContent = 'Thanks! We’ll be in touch.';
    } else {
      status.textContent = "Couldn't save, try again";
      submit.disabled = false;
    }
  });
  return form;
}

// Resolves when the player chooses Play again.
export function showResults(
  overlay: HTMLElement,
  results: readonly NamedScore[],
  summary: RoundSummary,
  actions: ResultsActions,
): Promise<void> {
  const copy = shiftCardCopy(results, summary);
  const check = (line: CheckLine) => row(line.text, line.ok ? '✓' : '✗', line.ok ? 'check' : 'cross');
  return waitFor<void>(overlay, (done) => {
    const shareStatus = el('p', { className: 'form-status' });
    const shareButton = button('Share my score', 'secondary', async () => {
      shareButton.disabled = true;
      shareStatus.textContent = SHARE_MESSAGES[await actions.onShare()];
      shareButton.disabled = false;
    });
    return [
      el('h2', { text: 'Weekly scorecard' }),
      el('h1', { text: summary.title }),
      ...(copy.celebration === null ? [] : [el('div', { className: 'celebrate', text: copy.celebration })]),
      el('div', { className: 'stars', text: starString(summary.stars, summary.maxStars) }),
      el('div', { className: 'section', text: 'LABOR PERFORMANCE' }),
      row(el('b', { text: copy.efficiency }), starString(copy.efficiencyStars, 3)),
      row('Budget', copy.budget, 'value'),
      row('Actual', copy.actual, 'value'),
      el('div', { className: `variance ${copy.variance.tone}`, text: copy.variance.text }),
      el('div', { className: 'section', text: 'QUALITY' }),
      check(copy.cut),
      check(copy.weeds),
      check(copy.collisions),
      el('div', { className: 'section', text: 'BY PROPERTY' }),
      ...copy.properties.map((p) =>
        row(el('span', {}, [p.name, el('small', { text: ` · ${p.efficiency}` })]), starString(p.stars, MAX_STARS_PER_PROPERTY)),
      ),
      el('div', { className: 'payoff' }, [
        el('div', { className: `headline ${copy.variance.tone}`, text: copy.headline }),
        el('div', { className: 'points', text: copy.points }),
      ]),
      el('p', { className: 'proof', text: 'Real crews using BomData improved labor efficiency 8–10%.' }),
      logo(actions.siteUrl, true),
      link('Book a demo', 'btn primary', actions.demoUrl),
      shareButton,
      shareStatus,
      ...(actions.showLeadForm ? [leadForm(actions.onSubmitLead)] : []),
      button('Play again', 'secondary', () => done()),
    ];
  });
}
