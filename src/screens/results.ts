import { isValidEmail, type LeadFields } from '../hubspot';
import type { RoundSummary } from '../rules/scoring';
import type { ShareOutcome } from '../share/share';
import { starString } from '../share/text';
import { shiftCardCopy } from './cardCopy';
import { headlineBlock, laborRows, outcome } from './cardParts';
import { button, el, link, logo, waitFor } from './dom';

export interface ResultsActions {
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
export function showResults(overlay: HTMLElement, summary: RoundSummary, actions: ResultsActions): Promise<void> {
  const copy = shiftCardCopy(summary);
  return waitFor<void>(overlay, (done) => {
    const shareStatus = el('p', { className: 'form-status' });
    const shareButton = button('SHARE MY SCORE', 'primary', async () => {
      shareButton.disabled = true;
      shareStatus.textContent = SHARE_MESSAGES[await actions.onShare()];
      shareButton.disabled = false;
    });
    return [
      logo(actions.siteUrl, true),
      el('h1', { className: 'rank', text: summary.title }),
      outcome(copy),
      el('div', { className: 'stars', text: starString(summary.stars, summary.maxStars) }),
      ...headlineBlock(copy, false),
      ...laborRows(copy.labor),
      el('div', { className: 'points', text: copy.points }),
      el('div', { className: 'takeaway' }, [
        el('p', {}, [el('b', { text: copy.takeaway[0] })]),
        el('p', { text: copy.takeaway[1] }),
      ]),
      shareButton,
      shareStatus,
      el('div', { className: 'button-row' }, [
        link('See how BomData works', 'btn secondary', actions.siteUrl),
        button('Play again', 'secondary', () => done()),
      ]),
      ...(actions.showLeadForm ? [leadForm(actions.onSubmitLead)] : []),
    ];
  }, 'panel results');
}
