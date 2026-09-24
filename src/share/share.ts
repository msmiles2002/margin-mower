import { config } from '../config';
import { hasTouchScreen } from '../render/canvas';
import type { RoundSummary } from '../rules/scoring';
import { shareText } from './text';

// 'saved' = image downloaded and caption copied; 'saved-no-caption' = the clipboard refused the caption.
export type ShareOutcome = 'shared' | 'saved' | 'saved-no-caption' | 'cancelled';

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

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// Call from the click handler with an already-rendered image: browsers (Safari especially) only
// allow navigator.share right after a tap, so there must be no slow work before it.
export async function shareResult(blob: Blob, summary: RoundSummary): Promise<ShareOutcome> {
  const file = new File([blob], FILE_NAME, { type: 'image/png' });
  const text = shareText(summary, config.pageUrl);
  // Phones only: desktop Chrome and Safari on macOS also support file sharing, but the Mac share
  // sheet's Copy puts a file on the clipboard that LinkedIn's web composer can't paste.
  if (hasTouchScreen() && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      // Any other failure (for example sharing blocked inside the iframe) falls back to download.
    }
  }
  // Copy before downloading: the download can take focus away, and the clipboard needs a focused page.
  const copied = await copyText(text);
  downloadBlob(blob, FILE_NAME);
  return copied ? 'saved' : 'saved-no-caption';
}
