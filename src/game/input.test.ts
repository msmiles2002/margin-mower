import { describe, expect, it } from 'vitest';
import { keyAction } from './input';

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
