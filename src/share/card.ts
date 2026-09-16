import type { RoundSummary } from '../rules/scoring';
import { formatHours, formatPoints, starString } from './text';

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 627;

const INK = '#1d2b36';
const BRAND = '#127DB9';
const CENTER = CARD_WIDTH / 2 - 6;

function drawCard(ctx: CanvasRenderingContext2D, s: RoundSummary): void {
  const stripe = 48;
  for (let y = 0; y < CARD_HEIGHT; y += stripe) {
    ctx.fillStyle = (y / stripe) % 2 === 0 ? '#7cc85a' : '#93d872';
    ctx.fillRect(0, y, CARD_WIDTH, stripe);
  }
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(112, 72, 976, 483);
  ctx.fillStyle = '#fffdf5';
  ctx.fillRect(100, 60, 976, 483);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 8;
  ctx.strokeRect(100, 60, 976, 483);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = INK;
  ctx.font = '44px "Press Start 2P"';
  ctx.fillText('MARGIN MOWER', CENTER, 150);

  ctx.fillStyle = BRAND;
  ctx.font = '28px "Press Start 2P"';
  ctx.fillText(s.title.toUpperCase(), CENTER, 215);

  ctx.fillStyle = '#e0a800';
  ctx.font = '72px "DM Sans", sans-serif';
  ctx.fillText(starString(s.stars, s.maxStars), CENTER, 310);

  ctx.fillStyle = INK;
  ctx.font = '22px "Press Start 2P"';
  ctx.fillText(`${s.efficiency}% EFFICIENCY | ${formatPoints(s.points)} PTS`, CENTER, 385);
  ctx.fillText(`${formatHours(s.hoursSaved)} HRS SAVED`, CENTER, 425);

  ctx.font = 'bold 32px "DM Sans", sans-serif';
  ctx.fillText('Can you mow on budget?', CENTER, 480);

  ctx.fillStyle = BRAND;
  ctx.font = '26px "DM Sans", sans-serif';
  ctx.fillText('bomdata.io/margin-mower', CENTER, 522);
}

export async function renderCardBlob(summary: RoundSummary): Promise<Blob> {
  await Promise.all([document.fonts.load('44px "Press Start 2P"'), document.fonts.load('bold 32px "DM Sans"')]);
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error('Canvas 2D is not supported');
  drawCard(ctx, summary);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob === null ? reject(new Error('Could not create image')) : resolve(blob)), 'image/png');
  });
}
