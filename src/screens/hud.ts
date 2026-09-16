import { cutPercent, type Run } from '../rules/run';

export interface HudElements {
  hud: HTMLElement;
  name: HTMLElement;
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
  els.cut.textContent = `${cutPercent(run)}% cut`;
}

export function hideHud(els: HudElements): void {
  els.hud.hidden = true;
  els.controls.hidden = true;
}
