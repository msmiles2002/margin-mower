import { describe, expect, it } from 'vitest';
import { BRANCH_BOTTOM, BRANCH_TOP, COL, GROUND } from './constants';
import { PROPERTIES, parseLevel } from './levels';

describe('parseLevel', () => {
  it('classifies columns and marks mowable grass', () => {
    const level = parseLevel('._=bwrB');
    expect(level.columns).toEqual(['grass', 'pad', 'walkway', 'bed', 'bed', 'pad', 'grass']);
    expect(level.mowable).toEqual([true, false, false, false, false, false, true]);
    expect(level.lengthPx).toBe(7 * COL);
  });

  it('creates weeds in bed columns', () => {
    const level = parseLevel('bwbw');
    expect(level.weeds).toEqual([
      { col: 1, x: 36, pulled: false, missed: false },
      { col: 3, x: 84, pulled: false, missed: false },
    ]);
  });

  it('creates hop obstacles standing on the ground', () => {
    const [rock] = parseLevel('..r').obstacles;
    expect(rock).toEqual({ kind: 'rock', col: 2, span: 1, x: 60, left: 52.5, right: 67.5, top: GROUND - 12, bottom: GROUND, hit: false });
  });

  it('maps every hop character to its obstacle', () => {
    expect(parseLevel('rschLD').obstacles.map((o) => o.kind)).toEqual([
      'rock', 'sprinkler', 'picnicTable', 'shrub', 'neighbor', 'dogWalker',
    ]);
  });

  it('merges consecutive branch columns into one obstacle', () => {
    const { obstacles } = parseLevel('.BBB..B');
    expect(obstacles).toHaveLength(2);
    expect(obstacles[0]).toMatchObject({ kind: 'branch', col: 1, span: 3, left: 36 - 16.5, right: 84 + 16.5, top: BRANCH_TOP, bottom: BRANCH_BOTTOM });
    expect(obstacles[1]).toMatchObject({ kind: 'branch', col: 6, span: 1 });
  });

  it('rejects unknown characters', () => {
    expect(() => parseLevel('..x')).toThrow(/Unknown level character 'x' at column 2/);
  });
});

describe('PROPERTIES', () => {
  it('has North Valley (ride-on) then Oak Creek (push)', () => {
    expect(PROPERTIES.map((p) => [p.name, p.crew])).toEqual([
      ['North Valley Office Park', 'rideOn'],
      ['Oak Creek HOA', 'push'],
    ]);
  });

  it('gives North Valley 4 weeds and no branches', () => {
    const level = parseLevel(PROPERTIES[0].level);
    expect(level.weeds).toHaveLength(4);
    expect(level.obstacles.some((o) => o.kind === 'branch')).toBe(false);
    expect(level.obstacles.some((o) => o.kind === 'dogWalker')).toBe(true);
    expect(level.obstacles.some((o) => o.kind === 'picnicTable')).toBe(true);
  });

  it('gives Oak Creek 7 weeds, 5 branches and a neighbor', () => {
    const level = parseLevel(PROPERTIES[1].level);
    expect(level.weeds).toHaveLength(7);
    expect(level.obstacles.filter((o) => o.kind === 'branch')).toHaveLength(5);
    expect(level.obstacles.some((o) => o.kind === 'neighbor')).toBe(true);
  });

  it('marks the crew name in each tip', () => {
    for (const p of PROPERTIES) expect(p.tip).toMatch(/\*\*.+ crew\*\*/);
  });
});
