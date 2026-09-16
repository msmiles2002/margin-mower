import { MAX_FRAME_SECONDS } from '../rules/constants';
import { tickRun, type Rng, type Run } from '../rules/run';

// Runs one property until the crew crosses the finish line.
export function playProperty(run: Run, rng: Rng, onFrame: () => void): Promise<void> {
  return new Promise((resolve) => {
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(MAX_FRAME_SECONDS, Math.max(0, (now - last) / 1000));
      last = now;
      tickRun(run, dt, rng);
      onFrame();
      if (run.ended) {
        resolve();
        return;
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}
