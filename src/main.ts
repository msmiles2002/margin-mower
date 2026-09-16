import './style.css';
import { config, withUtm } from './config';
import { setupControls } from './game/input';
import { playProperty } from './game/loop';
import { buildSubmission, hubspotEnabled, submitLead } from './hubspot';
import { setupCanvas } from './render/canvas';
import { useContext } from './render/draw';
import { drawScene, updateHints, type SeenHints } from './render/scene';
import { STALL_SECONDS } from './rules/constants';
import { PROPERTIES } from './rules/levels';
import { createRun, resultOf, type Run } from './rules/run';
import { scoreProperty, summarizeRound, type RoundSummary } from './rules/scoring';
import { hideHud, showHud, updateHud, type HudElements } from './screens/hud';
import { showFatal, showIntro, showPropertyCard, showTitle } from './screens/panels';
import type { NamedScore } from './screens/cardCopy';
import { showResults } from './screens/results';
import { renderCardBlob } from './share/card';
import { downloadBlob, shareResult } from './share/share';

function byId<T extends HTMLElement>(id: string, type: { new (): T; prototype: T }): T {
  const node = document.getElementById(id);
  if (!(node instanceof type)) throw new Error(`Missing #${id}`);
  return node;
}

const overlay = byId('overlay', HTMLDivElement);
const canvas = byId('board', HTMLCanvasElement);
const hud: HudElements = {
  hud: byId('hud', HTMLDivElement),
  name: byId('hud-name', HTMLSpanElement),
  cut: byId('hud-cut', HTMLSpanElement),
  controls: byId('controls', HTMLDivElement),
};

// Focus outlines only after keyboard use; panels still pre-focus their main button so Enter works.
window.addEventListener('keydown', () => document.body.classList.add('using-keyboard'));
window.addEventListener('pointerdown', () => document.body.classList.remove('using-keyboard'));

window.addEventListener('error', () => showFatal(overlay));
window.addEventListener('unhandledrejection', () => showFatal(overlay));

const rng = Math.random;
const seenHints: SeenHints = new Set();
let shown: Run | null = null;
// Hint bubbles stay hidden behind the title screen.
let previewHints = false;
const redraw = () => {
  if (shown !== null) drawScene(shown, seenHints, { hints: previewHints && !shown.ended, gauge: shown.ended });
};
useContext(setupCanvas(canvas, redraw));

const controls = setupControls(
  { canvas, hopButton: byId('hop-button', HTMLButtonElement), duckButton: byId('duck-button', HTMLButtonElement) },
  rng,
);
const hubspotTarget = { portalId: config.hubspotPortalId, formGuid: config.hubspotFormGuid };
const SAMPLE_SUMMARY: RoundSummary = { stars: 8, maxStars: 10, efficiency: 97, points: 2330, hoursSaved: 0.8, budgetHours: 12, hoursUsed: 11.2, title: 'Pro' };

async function playRound(): Promise<NamedScore[]> {
  const results: NamedScore[] = [];
  for (const [index, property] of PROPERTIES.entries()) {
    const run = createRun(property);
    shown = run;
    redraw();
    await showIntro(overlay, property, index, PROPERTIES.length);

    showHud(hud, run);
    controls.setRun(run);
    await playProperty(run, rng, () => {
      updateHints(run, seenHints);
      drawScene(run, seenHints);
      updateHud(hud, run);
    });
    controls.setRun(null);
    hideHud(hud);

    const score = scoreProperty(resultOf(run));
    results.push({ name: property.shortName, score });
    await showPropertyCard(overlay, property, score, STALL_SECONDS * run.hoursPerSecond, index, PROPERTIES.length);
  }
  return results;
}

async function main(): Promise<void> {
  await document.fonts.ready;
  if (new URLSearchParams(window.location.search).has('og')) {
    downloadBlob(await renderCardBlob(SAMPLE_SUMMARY), 'margin-mower-og.png');
    return;
  }
  shown = createRun(PROPERTIES[0]);
  redraw();
  await showTitle(overlay);
  previewHints = true;
  for (;;) {
    const results = await playRound();
    const summary = summarizeRound(results.map((r) => r.score));
    await showResults(overlay, results, summary, {
      demoUrl: withUtm(config.demoUrl),
      siteUrl: withUtm(config.siteUrl),
      showLeadForm: hubspotEnabled(hubspotTarget),
      onShare: async () => shareResult(await renderCardBlob(summary), summary),
      onSubmitLead: (lead) =>
        submitLead(hubspotTarget, buildSubmission(lead, summary, { pageUri: config.pageUrl, pageName: 'Margin Mower' })),
    });
  }
}

main().catch(() => showFatal(overlay));
