import './style.css';
import { config, withUtm } from './config';
import { setupControls } from './game/input';
import { playProperty } from './game/loop';
import { buildSubmission, hubspotEnabled, submitLead } from './hubspot';
import { isMobileLayout, setupCanvas } from './render/canvas';
import { useContext } from './render/draw';
import { drawScene, updateHints, type SeenHints } from './render/scene';
import { STALL_SECONDS } from './rules/constants';
import { PROPERTIES } from './rules/levels';
import { createRun, resultOf, type Run } from './rules/run';
import { scoreProperty, summarizeRound, type PropertyScore, type RoundSummary } from './rules/scoring';
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
const controlsPad = byId('controls', HTMLDivElement);

// Focus outlines only while navigating with Tab (not after game keys like arrows or Space);
// panels still pre-focus their main button so Enter works.
window.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') document.body.classList.add('using-keyboard');
});
window.addEventListener('pointerdown', () => document.body.classList.remove('using-keyboard'));

window.addEventListener('error', () => showFatal(overlay));
window.addEventListener('unhandledrejection', () => showFatal(overlay));

const rng = Math.random;
const seenHints: SeenHints = new Set();
let shown: Run | null = null;
// Hint bubbles stay hidden behind the title screen.
let previewHints = false;
let playing = false;
const redraw = () => {
  if (shown !== null) {
    const options = playing ? { hints: true, gauge: true } : { hints: previewHints && !shown.ended, gauge: shown.ended };
    drawScene(shown, seenHints, options, game.view());
  }
};
// On phones the game fills the space above the control pad while playing, and the space above the
// bottom sheet (60% of the screen) while a panel is open.
const reservedBelowGame = () => {
  if (!isMobileLayout(window.innerWidth, window.innerHeight)) return 0;
  return playing ? controlsPad.getBoundingClientRect().height : Math.round(window.innerHeight * 0.6);
};
const game = setupCanvas(canvas, reservedBelowGame, redraw);
useContext(game.ctx);

function setPlaying(run: Run | null): void {
  playing = run !== null;
  controlsPad.hidden = !playing;
  controls.setRun(run);
  game.refit();
}

const controls = setupControls(
  { canvas, hopButton: byId('hop-button', HTMLButtonElement), duckButton: byId('duck-button', HTMLButtonElement) },
  rng,
);
const hubspotTarget = { portalId: config.hubspotPortalId, formGuid: config.hubspotFormGuid };
const SAMPLE_SUMMARY: RoundSummary = {
  stars: 4,
  maxStars: 5,
  efficiency: 103,
  points: 2080,
  budgetHours: 12,
  hoursUsed: 11.6,
  underHours: 0.4,
  callbackHours: 0.1,
  callbackItems: 1,
  netHours: 0.3,
  hits: 1,
  fullQuality: false,
  title: 'Route Pro',
};

async function playRound(): Promise<RoundSummary> {
  const scores: PropertyScore[] = [];
  for (const [index, property] of PROPERTIES.entries()) {
    const run = createRun(property);
    shown = run;
    redraw();
    await showIntro(overlay, property, index, PROPERTIES.length);

    setPlaying(run);
    await playProperty(run, rng, () => {
      updateHints(run, seenHints);
      redraw();
    });
    setPlaying(null);

    const score = scoreProperty(resultOf(run));
    scores.push(score);
    await showPropertyCard(overlay, property, score, STALL_SECONDS * run.hoursPerSecond, index, PROPERTIES.length);
  }
  return summarizeRound(scores);
}

async function main(): Promise<void> {
  // Canvas text only triggers a font download on first use, so load the pixel font before drawing.
  await Promise.all([document.fonts.load('8px "Press Start 2P"'), document.fonts.ready]);
  if (new URLSearchParams(window.location.search).has('og')) {
    downloadBlob(await renderCardBlob(SAMPLE_SUMMARY), 'margin-mower-og.png');
    return;
  }
  shown = createRun(PROPERTIES[0]);
  redraw();
  await showTitle(overlay);
  previewHints = true;
  for (;;) {
    const summary = await playRound();
    await showResults(overlay, summary, {
      siteUrl: withUtm(config.siteUrl),
      showLeadForm: hubspotEnabled(hubspotTarget),
      onShare: async () => shareResult(await renderCardBlob(summary), summary),
      onSubmitLead: (lead) =>
        submitLead(hubspotTarget, buildSubmission(lead, summary, { pageUri: config.pageUrl, pageName: 'Margin Mower' })),
    });
  }
}

main().catch(() => showFatal(overlay));
