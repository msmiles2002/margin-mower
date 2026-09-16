// Building blocks shared by the property card and the final scorecard.
import type { CardCopy, CheckLine, LaborLine } from './cardCopy';
import { el, row } from './dom';

export function outcome(copy: CardCopy): HTMLDivElement {
  return el('div', { className: copy.outcome.perfect ? 'outcome celebrate' : 'outcome', text: copy.outcome.text });
}

// The big numbers: efficiency (with a plain-English caption) and the labor hours result.
export function headlineBlock(copy: CardCopy): HTMLDivElement[] {
  return [
    el('div', { className: 'metric', text: copy.efficiency.toUpperCase() }),
    el('div', { className: 'caption', text: copy.efficiencyCaption }),
    el('div', { className: `headline ${copy.headline.tone}`, text: copy.headline.text }),
  ];
}

export function laborRows(lines: readonly LaborLine[]): HTMLDivElement[] {
  return lines.map((line) => row(line.label, line.value, line.tone === null ? 'value' : `value ${line.tone}`));
}

export function checkRows(lines: readonly CheckLine[]): HTMLDivElement[] {
  return lines.map((line) => row(line.text, line.ok ? '✓' : '✗', line.ok ? 'check' : 'cross'));
}

export function note(text: string | null, className: string): HTMLDivElement[] {
  return text === null ? [] : [el('div', { className, text })];
}
