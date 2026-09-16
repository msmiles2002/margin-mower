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
import { scoreProperty, summarizeRound, type PropertyScore, type RoundSummary } from './rules/scoring';
import { hideHud, showHud, updateHud, type HudElements } from './screens/hud';
import { showFatal, showIntro, showPropertyCard, showTitle } from './screens/panels';
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
  clock: byId('hud-clock', HTMLSpanElement),
  cut: byId('hud-cut', HTMLSpanElement),
  controls: byId('controls', HTMLDivElement),
};

window.addEventListener('error', () => showFatal(overlay));
window.addEventListener('unhandledrejection', () => showFatal(overlay));

const rng = Math.random;
const seenHints: SeenHints = new Set();
let shown: Run | null = null;
const redraw = () => {
  if (shown !== null) drawScene(shown, seenHints, !shown.ended);
};
useContext(setupCanvas(canvas, redraw));

const controls = setupControls(
  { canvas, hopButton: byId('hop-button', HTMLButtonElement), duckButton: byId('duck-button', HTMLButtonElement) },
  rng,
);
const hubspotTarget = { portalId: config.hubspotPortalId, formGuid: config.hubspotFormGuid };
const SAMPLE_SUMMARY: RoundSummary = { stars: 8, maxStars: 10, efficiency: 97, points: 2330, hoursSaved: 0.8, title: 'Pro' };

async function playRound(): Promise<RoundSummary> {
  const scores: PropertyScore[] = [];
  for (const [index, property] of PROPERTIES.entries()) {
    const run = createRun(property);
    shown = run;
    redraw();
    await showIntro(overlay, property, run.crew, index, PROPERTIES.length);

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
    scores.push(score);
    await showPropertyCard(overlay, property, score, STALL_SECONDS * run.hoursPerSecond, index === PROPERTIES.length - 1);
  }
  return summarizeRound(scores);
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
  for (;;) {
    const summary = await playRound();
    await showResults(overlay, summary, {
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
