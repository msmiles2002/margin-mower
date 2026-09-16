import { BUDGET_HOURS } from '../rules/constants';
import { cutPercent, hoursUsed, type Run } from '../rules/run';
import { formatHours } from '../share/text';

export interface HudElements {
  hud: HTMLElement;
  name: HTMLElement;
  clock: HTMLElement;
  cut: HTMLElement;
  controls: HTMLElement;
}

export function showHud(els: HudElements, run: Run): void {
  els.name.textContent = `${run.property.shortName} · ${run.crew.label}`;
  els.hud.hidden = false;
  els.controls.hidden = false;
  updateHud(els, run);
}

export function updateHud(els: HudElements, run: Run): void {
  const used = hoursUsed(run);
  els.clock.textContent = `${formatHours(used)}/${formatHours(BUDGET_HOURS)}h`;
  els.clock.classList.toggle('over', used > BUDGET_HOURS + 1e-9);
  els.cut.textContent = `${cutPercent(run)}% cut`;
}

export function hideHud(els: HudElements): void {
  els.hud.hidden = true;
  els.controls.hidden = true;
}
