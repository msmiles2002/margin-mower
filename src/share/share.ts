import { config, linkedInShareUrl } from '../config';
import type { RoundSummary } from '../rules/scoring';
import { shareText } from './text';

export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled';

const FILE_NAME = 'margin-mower-score.png';

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function shareResult(blob: Blob, summary: RoundSummary): Promise<ShareOutcome> {
  const file = new File([blob], FILE_NAME, { type: 'image/png' });
  const text = shareText(summary, config.pageUrl);
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      // Any other failure (for example sharing blocked inside the iframe) falls back to download.
    }
  }
  downloadBlob(blob, FILE_NAME);
  window.open(linkedInShareUrl(config.pageUrl), '_blank', 'noopener');
  return 'downloaded';
}
