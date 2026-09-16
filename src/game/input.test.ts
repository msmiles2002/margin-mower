import { describe, expect, it } from 'vitest';
import { FLICK_DISTANCE, TAP_MAX_MS, classifyGesture, keyAction } from './input';

describe('keyAction', () => {
  it.each(['ArrowUp', ' ', 'w', 'W'])('%j hops', (key) => {
    expect(keyAction(key)).toBe('hop');
  });

  it.each(['ArrowDown', 's', 'S'])('%j ducks and pulls', (key) => {
    expect(keyAction(key)).toBe('duck');
  });

  it.each(['Enter', 'ArrowLeft', 'a', 'Escape'])('%j does nothing', (key) => {
    expect(keyAction(key)).toBeNull();
  });
});

describe('classifyGesture', () => {
  it('treats a downward flick as duck', () => {
    expect(classifyGesture(0, FLICK_DISTANCE, 80)).toBe('duck');
    expect(classifyGesture(-10, 40, 150)).toBe('duck');
  });

  it('treats an upward flick as hop', () => {
    expect(classifyGesture(0, -FLICK_DISTANCE, 80)).toBe('hop');
  });

  it('ignores mostly sideways movement', () => {
    expect(classifyGesture(60, 30, 100)).toBeNull();
  });

  it('keeps waiting while the finger has barely moved', () => {
    expect(classifyGesture(3, 5, 60)).toBeNull();
  });

  it('treats a short, still touch that ends as a tap (hop)', () => {
    expect(classifyGesture(2, 3, TAP_MAX_MS - 1, true)).toBe('hop');
  });

  it('does not treat a long press as a tap', () => {
    expect(classifyGesture(2, 3, TAP_MAX_MS + 1, true)).toBeNull();
  });
});
