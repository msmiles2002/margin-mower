import { describe, expect, it } from 'vitest';
import { DESKTOP_VIEW, MAX_SCALE, canvasFit, canvasLayout, isMobileLayout, viewFor } from './canvas';

describe('canvasFit (desktop letterbox)', () => {
  it('fits a phone width and renders at device resolution', () => {
    const fit = canvasFit(368, 600, 3);
    expect(fit.cssWidth).toBeCloseTo(368);
    expect(fit.cssHeight).toBeCloseTo(207);
    expect(fit.pixelWidth).toBe(1104);
  });

  it('never grows past the max scale', () => {
    expect(canvasFit(5000, 5000, 2).cssWidth).toBeCloseTo(480 * MAX_SCALE);
  });
});

describe('viewFor', () => {
  it('uses the classic wide view on desktop', () => {
    expect(viewFor(1280, 444, false)).toEqual(DESKTOP_VIEW);
    expect(DESKTOP_VIEW).toEqual({ width: 480, height: 270, top: 0, mowerX: 130 });
  });

  it('zooms in and adds sky above and street below on a portrait phone', () => {
    // 390 x 550: 300 units wide, so sprites are ~1.7x bigger than the 480-unit desktop view
    expect(viewFor(390, 550, true)).toEqual({ width: 300, height: 423, top: -107, mowerX: 69 });
  });

  it('caps the extra street below the curb on very tall screens', () => {
    expect(viewFor(390, 1000, true)).toEqual({ width: 300, height: 769, top: -409, mowerX: 69 });
  });

  it('widens the view on short, wide mobile screens without cutting off the street', () => {
    expect(viewFor(600, 400, true)).toEqual({ width: 405, height: 270, top: 0, mowerX: 93 });
  });

  it('falls back to the classic view on very wide mobile screens', () => {
    expect(viewFor(800, 360, true)).toEqual(DESKTOP_VIEW);
  });
});

describe('isMobileLayout', () => {
  it('treats narrow screens and upright touch screens as phones', () => {
    expect(isMobileLayout(390, 844, true)).toBe(true);
    expect(isMobileLayout(600, 900, false)).toBe(true);
    expect(isMobileLayout(768, 1024, true)).toBe(true);
  });

  it('keeps tall desktop browser windows on the desktop layout', () => {
    expect(isMobileLayout(1280, 1400, false)).toBe(false);
    expect(isMobileLayout(1280, 800, false)).toBe(false);
    expect(isMobileLayout(1280, 800, true)).toBe(false);
  });
});

describe('canvasLayout', () => {
  it('fills the phone screen above the controls', () => {
    const l = canvasLayout(390, 844, 294, 3, true);
    expect(l.mobile).toBe(true);
    expect([l.cssWidth, l.cssHeight]).toEqual([390, 550]);
    expect([l.pixelWidth, l.pixelHeight]).toEqual([1170, 1650]);
    expect(l.view).toEqual({ width: 300, height: 423, top: -107, mowerX: 69 });
    expect(l.scale).toBeCloseTo(3.9);
  });

  it('fills the whole phone screen when the controls are hidden', () => {
    const l = canvasLayout(390, 844, 0, 2, true);
    expect(l.cssHeight).toBe(844);
    expect(l.view.width).toBe(300);
  });

  it('letterboxes the classic view on desktop, even in a tall window', () => {
    expect(canvasLayout(1280, 1400, 0, 1, false).mobile).toBe(false);
    const l = canvasLayout(1280, 800, 0, 1, false);
    expect(l.mobile).toBe(false);
    expect(l.view).toEqual(DESKTOP_VIEW);
    expect(l.cssHeight).toBeCloseTo(l.cssWidth * (270 / 480));
  });
});
