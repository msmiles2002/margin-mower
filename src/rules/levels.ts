import { BRANCH_BOTTOM, BRANCH_TOP, BRANCH_WIDTH, COL, GROUND } from './constants';
import type { CrewId } from './crews';

export type HopKind = 'rock' | 'sprinkler' | 'picnicTable' | 'shrub' | 'neighbor' | 'dogWalker';
export type ObstacleKind = HopKind | 'branch';
export type ColumnKind = 'grass' | 'pad' | 'walkway' | 'bed';

export interface Obstacle {
  kind: ObstacleKind;
  col: number;
  span: number;
  x: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  hit: boolean;
}

export interface Weed {
  col: number;
  x: number;
  pulled: boolean;
  missed: boolean;
}

export interface Level {
  columns: ColumnKind[];
  mowable: boolean[];
  obstacles: Obstacle[];
  weeds: Weed[];
  lengthPx: number;
}

export interface IntroCopy {
  // Short lines under the property name.
  pitch: readonly string[];
  // Control lines: `key` is shown bold, followed by `rest`.
  controls: readonly { key: string; rest: string }[];
  warning: readonly string[];
}

export interface Property {
  id: 'northValley' | 'oakCreek';
  name: string;
  shortName: string;
  crew: CrewId;
  backdrop: 'office' | 'hoa';
  intro: IntroCopy;
  level: string;
}

const HOP_OBSTACLES = new Map<string, { kind: HopKind; w: number; h: number }>([
  ['r', { kind: 'rock', w: 15, h: 12 }],
  ['s', { kind: 'sprinkler', w: 9, h: 9 }],
  ['c', { kind: 'picnicTable', w: 28, h: 17 }],
  ['h', { kind: 'shrub', w: 21, h: 18 }],
  ['L', { kind: 'neighbor', w: 15, h: 27 }],
  ['D', { kind: 'dogWalker', w: 30, h: 26 }],
]);

const colCenter = (col: number) => col * COL + COL / 2;

export function parseLevel(level: string): Level {
  const columns: ColumnKind[] = [];
  const mowable: boolean[] = [];
  const obstacles: Obstacle[] = [];
  const weeds: Weed[] = [];
  for (let col = 0; col < level.length; col++) {
    const ch = level.charAt(col);
    const hop = HOP_OBSTACLES.get(ch);
    if (hop !== undefined) {
      const x = colCenter(col);
      columns.push('pad');
      mowable.push(false);
      obstacles.push({
        kind: hop.kind, col, span: 1, x,
        left: x - hop.w / 2, right: x + hop.w / 2, top: GROUND - hop.h, bottom: GROUND, hit: false,
      });
    } else if (ch === 'B') {
      columns.push('grass');
      mowable.push(true);
      const prev = obstacles[obstacles.length - 1];
      if (prev !== undefined && prev.kind === 'branch' && prev.col + prev.span === col) {
        prev.span += 1;
        prev.right += COL;
      } else {
        const x = colCenter(col);
        obstacles.push({
          kind: 'branch', col, span: 1, x,
          left: x - BRANCH_WIDTH / 2, right: x + BRANCH_WIDTH / 2, top: BRANCH_TOP, bottom: BRANCH_BOTTOM, hit: false,
        });
      }
    } else if (ch === '.') {
      columns.push('grass');
      mowable.push(true);
    } else if (ch === '_') {
      columns.push('pad');
      mowable.push(false);
    } else if (ch === '=') {
      columns.push('walkway');
      mowable.push(false);
    } else if (ch === 'b' || ch === 'w') {
      columns.push('bed');
      mowable.push(false);
      if (ch === 'w') weeds.push({ col, x: colCenter(col), pulled: false, missed: false });
    } else {
      throw new Error(`Unknown level character '${ch}' at column ${col}`);
    }
  }
  return { columns, mowable, obstacles, weeds, lengthPx: level.length * COL };
}

export const PROPERTIES: readonly Property[] = [
  {
    id: 'northValley',
    name: 'North Valley Office Park',
    shortName: 'North Valley',
    crew: 'rideOn',
    backdrop: 'office',
    intro: {
      pitch: ['Open turf + no trees = a good ride-on job.', 'Move cleanly and this property should come in under budget.'],
      controls: [
        { key: '↑ HOP', rest: ' obstacles' },
        { key: '↓ PULL WEEDS', rest: ' as you pass' },
      ],
      warning: ['Don’t overdo the jumping.', 'Airborne mowers don’t cut grass.'],
    },
    level:
      '..........__s__........__r__......bwbb......__c__.........__s__....__D__........bbwb.....__s__..__r__.........__c__......bwbbwb.......__r__..........',
  },
  {
    id: 'oakCreek',
    name: 'Oak Creek HOA',
    shortName: 'Oak Creek',
    crew: 'push',
    backdrop: 'hoa',
    intro: {
      pitch: [
        'Low branches, weedy beds, and neighbors out for a walk.',
        'BomData matched a push crew that can duck under trees and get into the beds.',
      ],
      controls: [
        { key: '↑ HOP', rest: ' rocks, shrubs and neighbors' },
        { key: '↓ DUCK', rest: ' under low branches' },
        { key: '↓ PULL WEEDS', rest: ' as you pass' },
      ],
      warning: ['Don’t overdo the jumping.', 'Airborne mowers don’t cut grass.'],
    },
    level:
      '........_r_......BB.....bwbwb...._h_....BB.._L_.....bwbbw...BBB...._h_..bwb...._h_...BB..._r_....bbwbwb....BB.._h_........',
  },
];
