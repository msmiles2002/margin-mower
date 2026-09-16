import { describe, expect, it } from 'vitest';
import { MAX_SCALE, canvasFit } from './canvas';

describe('canvasFit', () => {
  it('fits a phone width and renders at device resolution', () => {
    const fit = canvasFit(368, 600, 3);
    expect(fit.cssWidth).toBeCloseTo(368);
    expect(fit.cssHeight).toBeCloseTo(207);
    expect(fit.pixelWidth).toBe(1104);
    expect(fit.pixelHeight).toBe(621);
    expect(fit.scale).toBeCloseTo(2.3);
  });

  it('is limited by height on short screens', () => {
    const fit = canvasFit(2000, 270, 1);
    expect(fit.cssWidth).toBe(480);
    expect(fit.cssHeight).toBe(270);
  });

  it('never grows past the max scale', () => {
    const fit = canvasFit(5000, 5000, 2);
    expect(fit.cssWidth).toBeCloseTo(480 * MAX_SCALE);
    expect(fit.scale).toBeCloseTo(2 * MAX_SCALE);
  });
});
