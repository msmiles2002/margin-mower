# Margin Mower Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Margin Mower, a pixel-art mowing game that runs in the browser. It is hosted on GitHub Pages and embedded at `bomdata.io/margin-mower`, and it ends with a share card, an optional HubSpot lead form and a Book a demo link.

**Architecture:**
- **Game rules** (`src/rules/`) are plain TypeScript with no DOM access, and every rule is unit-tested.
- **Drawing** is done on an HTML canvas at 192×256 logical pixels (a 12×16 grid of 16px tiles). Sprites are drawn in code with `fillRect`, so there are no image files to load.
- **Screens** are DOM overlays on top of the canvas.
- **Flow:** `src/main.ts` runs title → (heads-up and crew pick → mowing → site walk → walk card) × 3 → results.

**Tech Stack:** TypeScript, Vite, Vitest, yarn (classic), Canvas 2D, GitHub Actions + GitHub Pages, HubSpot Forms Submission API v3, Google Fonts (Press Start 2P, DM Sans).

**Spec:** `docs/superpowers/specs/2026-09-16-margin-mower-design.md`

## Global Constraints

- Node v24. Use `yarn` for every package operation.
- No `as` casts and no `as any`. Narrow types with type guards (`instanceof`, `typeof`, `=== null`) instead.
- Do not add a game engine or any runtime dependency. Dev dependencies are only `typescript`, `vite` and `vitest`.
- Vite `base: './'`, so the build works under `https://<user>.github.io/margin-mower/`.
- Grid is 12 columns × 16 rows, and tiles are 16 logical px.
- Crews:
  - Ride-on: 12 tiles/sec, can't enter narrow turf.
  - Push: 6 tiles/sec, can enter everything a crew can enter.
- Clock:
  - 1 real second = 0.2 hr.
  - Budget is 6.0 hr (30 s).
  - The property auto-ends at 150% of budget (9.0 hr).
- Pulling a weed pauses the mower for 1 s.
- Stars:
  - On budget: hours used ≤ budget.
  - Clean cut: at least 95% of mowable tiles mowed.
  - No weeds: 0 weeds left.
- Points:
  - +10 per tile mowed (first time only).
  - +50 per weed pulled.
  - +10 per 0.1 budget hr left over, only if Clean cut was earned.
  - −10 per 0.1 hr of overtime.
- Hours saved = sum of (budget − used) over properties that were on budget **and** earned Clean cut.
- Titles by total stars: 0–3 Rookie, 4–6 Crew Lead, 7–8 Pro, 9 Margin Master.
- The results screen shows "Real crews using BomData improved labor efficiency 8–10%." This line must never appear on the share image.
- Demo link: `https://bomdata.io/contact/` with `utm_source=linkedin&utm_medium=game&utm_campaign=margin-mower`.
- Page URL: `https://bomdata.io/margin-mower/`.
- Brand colors: `#127DB9` (primary blue), `#7EBEC5` (light teal).
- HubSpot lead-form failure message: "Couldn't save, try again". The game never blocks on HubSpot.
- Out of scope: leaderboard, sound, more than 3 properties, random layouts, analytics, accounts.

## File Map

| File | Responsibility |
|---|---|
| `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore` | Project setup |
| `src/config.ts` | URLs, HubSpot IDs, UTM and LinkedIn link builders |
| `src/rules/crews.ts` | Crew definitions |
| `src/rules/grid.ts` | Tile types, layout parsing, movement, reachability |
| `src/rules/clock.ts` | Seconds → hours, overtime, formatting |
| `src/rules/weeds.ts` | Weed spawning |
| `src/rules/scoring.ts` | Stars, points, hours saved, titles, round summary |
| `src/rules/properties.ts` | The three property layouts and their settings |
| `src/rules/run.ts` | State of one property play-through: tick, pull weed, end, result, missed tiles |
| `src/render/palette.ts` | Tile size and colors |
| `src/render/sprites.ts` | Pixel sprite drawing functions |
| `src/render/board.ts` | Draws a whole run, with optional flags and manager |
| `src/render/canvas.ts` | Canvas sizing for crisp pixels |
| `src/game/input.ts` | Pointer → tile mapping, drag tracking, weed taps |
| `src/game/loop.ts` | Animation loop for one property |
| `src/game/siteWalk.ts` | Site walk animation |
| `src/share/text.ts` | Star strings, number formatting, share text |
| `src/share/card.ts` | 1200×627 share image |
| `src/share/share.ts` | Native share, or download plus LinkedIn link |
| `src/hubspot.ts` | Lead validation, payload, submission |
| `src/screens/dom.ts` | Small DOM helpers |
| `src/screens/{title,briefing,hud,walkCard,results,fatal}.ts` | Overlay screens |
| `src/style.css` | All styles |
| `src/main.ts` | Wires the game flow together |
| `.github/workflows/deploy.yml` | Test, build and deploy to Pages |
| `README.md` | Dev, deploy, WordPress, HubSpot and launch checklist |

All commands run from the repo root (`margin-mower/`).

---

### Task 1: Project scaffold and config

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `src/style.css`, `src/main.ts`, `src/config.ts`
- Test: `src/config.test.ts`

**Interfaces:**
- Produces:
  - `config: { pageUrl: string; demoUrl: string; hubspotPortalId: string; hubspotFormGuid: string }`
  - `withUtm(url: string): string`
  - `linkedInShareUrl(pageUrl: string): string`

- [ ] **Step 1: Create project files**

`package.json`:
```json
{
  "name": "margin-mower",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  }
}
```

Then run: `yarn add -D typescript vite vitest`

If the installed TypeScript major version (7.x at the time of writing) breaks `tsc --noEmit`, pin it with `yarn add -D typescript@^5.9`.

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "types": ["vite/client"]
  },
  "include": ["src", "vite.config.ts"]
}
```

`vite.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

`.gitignore`:
```
node_modules
dist
```

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Margin Mower</title>
    <meta name="description" content="Can you mow on budget? A BomData game." />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&family=Press+Start+2P&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="app">
      <canvas id="board"></canvas>
      <div id="overlay"></div>
    </div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`src/style.css` (placeholder; replaced in Task 8):
```css
body { margin: 0; background: #2f6b2f; }
```

`src/main.ts` (placeholder; replaced in Task 8):
```ts
import './style.css';

const overlay = document.querySelector('#overlay');
if (overlay !== null) overlay.textContent = 'Margin Mower';
```

- [ ] **Step 2: Write the failing config test**

`src/config.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { config, linkedInShareUrl, withUtm } from './config';

describe('config', () => {
  it('points at the bomdata.io page and contact page', () => {
    expect(config.pageUrl).toBe('https://bomdata.io/margin-mower/');
    expect(config.demoUrl).toBe('https://bomdata.io/contact/');
  });

  it('adds campaign UTM tags', () => {
    const url = new URL(withUtm('https://bomdata.io/contact/'));
    expect(url.searchParams.get('utm_source')).toBe('linkedin');
    expect(url.searchParams.get('utm_medium')).toBe('game');
    expect(url.searchParams.get('utm_campaign')).toBe('margin-mower');
    expect(url.pathname).toBe('/contact/');
  });

  it('keeps existing query params when adding UTM tags', () => {
    const url = new URL(withUtm('https://bomdata.io/contact/?ref=x'));
    expect(url.searchParams.get('ref')).toBe('x');
  });

  it('builds a LinkedIn share link for the page', () => {
    expect(linkedInShareUrl('https://bomdata.io/margin-mower/')).toBe(
      'https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fbomdata.io%2Fmargin-mower%2F',
    );
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `yarn test`
Expected: FAIL because `./config` cannot be resolved.

- [ ] **Step 4: Implement `src/config.ts`**

```ts
export const config = {
  pageUrl: 'https://bomdata.io/margin-mower/',
  demoUrl: 'https://bomdata.io/contact/',
  // Filled in after the HubSpot form is created (see README). Empty values hide the lead form.
  hubspotPortalId: '',
  hubspotFormGuid: '',
};

const UTM_TAGS: Record<string, string> = {
  utm_source: 'linkedin',
  utm_medium: 'game',
  utm_campaign: 'margin-mower',
};

export function withUtm(url: string): string {
  const parsed = new URL(url);
  for (const [key, value] of Object.entries(UTM_TAGS)) parsed.searchParams.set(key, value);
  return parsed.toString();
}

export function linkedInShareUrl(pageUrl: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;
}
```

- [ ] **Step 5: Verify tests, typecheck and build all pass**

Run: `yarn test && yarn build`
Expected: 4 tests pass, `tsc` reports no errors, and `dist/index.html` exists.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + TypeScript project with config"
```

---

### Task 2: Crews and grid

**Files:**
- Create: `src/rules/crews.ts`, `src/rules/grid.ts`
- Test: `src/rules/grid.test.ts`

**Interfaces:**
- Produces:
  - From `crews.ts`:
    - `type CrewId = 'rideOn' | 'push'`
    - `interface Crew { id: CrewId; label: string; tilesPerSecond: number; canEnterNarrow: boolean }`
    - `CREWS: Record<CrewId, Crew>`
  - From `grid.ts`:
    - `COLS = 12`, `ROWS = 16`
    - `type Tile = 'turf' | 'narrow' | 'bed' | 'tree' | 'building' | 'path'`
    - `interface Pos { x: number; y: number }`
    - `interface Grid { tiles: Tile[]; start: Pos }`
    - `parseLayout(rows: readonly string[]): Grid`
    - `indexOf(pos: Pos): number`
    - `posOf(index: number): Pos`
    - `inBounds(pos: Pos): boolean`
    - `tileAt(grid: Grid, pos: Pos): Tile | null`
    - `isMowable(tile: Tile): boolean`
    - `canEnter(grid: Grid, pos: Pos, crew: Crew): boolean`
    - `mowableIndices(grid: Grid): number[]`
    - `bedIndices(grid: Grid): number[]`
    - `stepToward(grid: Grid, from: Pos, target: Pos, crew: Crew): Pos | null`
    - `reachableIndices(grid: Grid, crew: Crew): Set<number>`
- Layout characters:
  - `.` turf
  - `:` narrow turf
  - `b` bed
  - `T` tree
  - `H` building
  - `=` path
  - `S` path, and also marks the mower's start (exactly one per layout)

- [ ] **Step 1: Write the failing tests**

`src/rules/grid.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { CREWS } from './crews';
import {
  COLS,
  ROWS,
  bedIndices,
  canEnter,
  indexOf,
  mowableIndices,
  parseLayout,
  posOf,
  reachableIndices,
  stepToward,
  tileAt,
} from './grid';

function layout(top: string[]): string[] {
  const rows = [...top];
  while (rows.length < ROWS - 1) rows.push('============');
  rows.push('S===========');
  return rows;
}

describe('parseLayout', () => {
  it('maps characters to tiles and finds the start', () => {
    const grid = parseLayout(layout(['.:bTH=......']));
    expect(tileAt(grid, { x: 0, y: 0 })).toBe('turf');
    expect(tileAt(grid, { x: 1, y: 0 })).toBe('narrow');
    expect(tileAt(grid, { x: 2, y: 0 })).toBe('bed');
    expect(tileAt(grid, { x: 3, y: 0 })).toBe('tree');
    expect(tileAt(grid, { x: 4, y: 0 })).toBe('building');
    expect(tileAt(grid, { x: 5, y: 0 })).toBe('path');
    expect(tileAt(grid, { x: 0, y: 15 })).toBe('path');
    expect(grid.start).toEqual({ x: 0, y: 15 });
    expect(grid.tiles).toHaveLength(COLS * ROWS);
  });

  it('rejects wrong row counts, row widths, unknown characters and missing start', () => {
    expect(() => parseLayout(['S'])).toThrow(/16 rows/);
    expect(() => parseLayout(layout(['....']))).toThrow(/12 columns/);
    expect(() => parseLayout(layout(['...x........']))).toThrow(/Unknown tile/);
    const noStart = layout([]).map((row) => row.replace('S', '='));
    expect(() => parseLayout(noStart)).toThrow(/start/);
  });

  it('rejects more than one start', () => {
    expect(() => parseLayout(layout(['S...........']))).toThrow(/one start/);
  });
});

describe('index helpers', () => {
  it('round-trips positions and indices', () => {
    expect(indexOf({ x: 3, y: 2 })).toBe(27);
    expect(posOf(27)).toEqual({ x: 3, y: 2 });
  });

  it('returns null outside the grid', () => {
    const grid = parseLayout(layout([]));
    expect(tileAt(grid, { x: -1, y: 0 })).toBeNull();
    expect(tileAt(grid, { x: 0, y: ROWS })).toBeNull();
  });

  it('lists mowable and bed tiles', () => {
    const grid = parseLayout(layout(['.:bb========']));
    expect(mowableIndices(grid)).toEqual([0, 1]);
    expect(bedIndices(grid)).toEqual([2, 3]);
  });
});

describe('canEnter', () => {
  const grid = parseLayout(layout(['.:bTH=......']));

  it('lets both crews onto turf and path', () => {
    for (const crew of [CREWS.push, CREWS.rideOn]) {
      expect(canEnter(grid, { x: 0, y: 0 }, crew)).toBe(true);
      expect(canEnter(grid, { x: 5, y: 0 }, crew)).toBe(true);
    }
  });

  it('only lets the push crew onto narrow turf', () => {
    expect(canEnter(grid, { x: 1, y: 0 }, CREWS.push)).toBe(true);
    expect(canEnter(grid, { x: 1, y: 0 }, CREWS.rideOn)).toBe(false);
  });

  it('blocks beds, trees, buildings and out-of-bounds for everyone', () => {
    for (const crew of [CREWS.push, CREWS.rideOn]) {
      expect(canEnter(grid, { x: 2, y: 0 }, crew)).toBe(false);
      expect(canEnter(grid, { x: 3, y: 0 }, crew)).toBe(false);
      expect(canEnter(grid, { x: 4, y: 0 }, crew)).toBe(false);
      expect(canEnter(grid, { x: -1, y: 0 }, crew)).toBe(false);
    }
  });
});

describe('stepToward', () => {
  const grid = parseLayout(layout(['....T.......', '............']));

  it('moves along the longer axis first', () => {
    expect(stepToward(grid, { x: 3, y: 1 }, { x: 6, y: 0 }, CREWS.push)).toEqual({ x: 4, y: 1 });
  });

  it('falls back to the other axis when the preferred step is blocked', () => {
    expect(stepToward(grid, { x: 3, y: 0 }, { x: 5, y: 1 }, CREWS.push)).toEqual({ x: 3, y: 1 });
  });

  it('returns null when every step toward the target is blocked', () => {
    expect(stepToward(grid, { x: 3, y: 0 }, { x: 6, y: 0 }, CREWS.push)).toBeNull();
  });

  it('returns null when already at the target', () => {
    expect(stepToward(grid, { x: 2, y: 1 }, { x: 2, y: 1 }, CREWS.push)).toBeNull();
  });
});

describe('reachableIndices', () => {
  const grid = parseLayout(layout(['.:TTTTTTTTTT', '=:TTTTTTTTTT']));

  it('keeps the ride-on crew out of narrow strips', () => {
    const reach = reachableIndices(grid, CREWS.rideOn);
    expect(reach.has(indexOf({ x: 0, y: 0 }))).toBe(true);
    expect(reach.has(indexOf({ x: 1, y: 0 }))).toBe(false);
  });

  it('lets the push crew reach narrow strips', () => {
    const reach = reachableIndices(grid, CREWS.push);
    expect(reach.has(indexOf({ x: 1, y: 0 }))).toBe(true);
    expect(reach.has(indexOf({ x: 2, y: 0 }))).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn test src/rules/grid.test.ts`
Expected: FAIL because the modules are not found.

- [ ] **Step 3: Implement `src/rules/crews.ts`**

```ts
export type CrewId = 'rideOn' | 'push';

export interface Crew {
  id: CrewId;
  label: string;
  tilesPerSecond: number;
  canEnterNarrow: boolean;
}

export const CREWS: Record<CrewId, Crew> = {
  rideOn: { id: 'rideOn', label: 'Ride-on crew', tilesPerSecond: 12, canEnterNarrow: false },
  push: { id: 'push', label: 'Push crew', tilesPerSecond: 6, canEnterNarrow: true },
};
```

- [ ] **Step 4: Implement `src/rules/grid.ts`**

```ts
import type { Crew } from './crews';

export const COLS = 12;
export const ROWS = 16;

export type Tile = 'turf' | 'narrow' | 'bed' | 'tree' | 'building' | 'path';

export interface Pos {
  x: number;
  y: number;
}

export interface Grid {
  tiles: Tile[];
  start: Pos;
}

const CHAR_TO_TILE = new Map<string, Tile>([
  ['.', 'turf'],
  [':', 'narrow'],
  ['b', 'bed'],
  ['T', 'tree'],
  ['H', 'building'],
  ['=', 'path'],
  ['S', 'path'],
]);

export function parseLayout(rows: readonly string[]): Grid {
  if (rows.length !== ROWS) throw new Error(`Layout needs ${ROWS} rows, got ${rows.length}`);
  const tiles: Tile[] = [];
  const starts: Pos[] = [];
  for (let y = 0; y < ROWS; y++) {
    const row = rows[y];
    if (row.length !== COLS) throw new Error(`Row ${y} needs ${COLS} columns, got ${row.length}`);
    for (let x = 0; x < COLS; x++) {
      const ch = row.charAt(x);
      const tile = CHAR_TO_TILE.get(ch);
      if (tile === undefined) throw new Error(`Unknown tile '${ch}' at ${x},${y}`);
      if (ch === 'S') starts.push({ x, y });
      tiles.push(tile);
    }
  }
  const [start] = starts;
  if (start === undefined) throw new Error('Layout has no start tile S');
  if (starts.length > 1) throw new Error('Layout must have exactly one start tile S');
  return { tiles, start };
}

export function indexOf(pos: Pos): number {
  return pos.y * COLS + pos.x;
}

export function posOf(index: number): Pos {
  return { x: index % COLS, y: Math.floor(index / COLS) };
}

export function inBounds(pos: Pos): boolean {
  return pos.x >= 0 && pos.x < COLS && pos.y >= 0 && pos.y < ROWS;
}

export function tileAt(grid: Grid, pos: Pos): Tile | null {
  return inBounds(pos) ? grid.tiles[indexOf(pos)] : null;
}

export function isMowable(tile: Tile): boolean {
  return tile === 'turf' || tile === 'narrow';
}

export function canEnter(grid: Grid, pos: Pos, crew: Crew): boolean {
  const tile = tileAt(grid, pos);
  if (tile === 'turf' || tile === 'path') return true;
  if (tile === 'narrow') return crew.canEnterNarrow;
  return false;
}

function indicesWhere(grid: Grid, predicate: (tile: Tile) => boolean): number[] {
  const result: number[] = [];
  grid.tiles.forEach((tile, index) => {
    if (predicate(tile)) result.push(index);
  });
  return result;
}

export function mowableIndices(grid: Grid): number[] {
  return indicesWhere(grid, isMowable);
}

export function bedIndices(grid: Grid): number[] {
  return indicesWhere(grid, (tile) => tile === 'bed');
}

export function stepToward(grid: Grid, from: Pos, target: Pos, crew: Crew): Pos | null {
  const dx = Math.sign(target.x - from.x);
  const dy = Math.sign(target.y - from.y);
  if (dx === 0 && dy === 0) return null;
  const horizontal = { x: from.x + dx, y: from.y };
  const vertical = { x: from.x, y: from.y + dy };
  const preferHorizontal = Math.abs(target.x - from.x) >= Math.abs(target.y - from.y);
  const options = preferHorizontal ? [horizontal, vertical] : [vertical, horizontal];
  for (const next of options) {
    const moves = next.x !== from.x || next.y !== from.y;
    if (moves && canEnter(grid, next, crew)) return next;
  }
  return null;
}

export function reachableIndices(grid: Grid, crew: Crew): Set<number> {
  const seen = new Set<number>([indexOf(grid.start)]);
  const queue: Pos[] = [grid.start];
  for (let pos = queue.shift(); pos !== undefined; pos = queue.shift()) {
    const neighbors = [
      { x: pos.x + 1, y: pos.y },
      { x: pos.x - 1, y: pos.y },
      { x: pos.x, y: pos.y + 1 },
      { x: pos.x, y: pos.y - 1 },
    ];
    for (const next of neighbors) {
      const index = indexOf(next);
      if (!seen.has(index) && canEnter(grid, next, crew)) {
        seen.add(index);
        queue.push(next);
      }
    }
  }
  return seen;
}
```

- [ ] **Step 5: Run the tests and typecheck**

Run: `yarn test src/rules/grid.test.ts && yarn typecheck`
Expected: all tests pass and there are no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/rules
git commit -m "feat: add crews and grid rules"
```

---

### Task 3: Clock and weeds

**Files:**
- Create: `src/rules/clock.ts`, `src/rules/weeds.ts`
- Test: `src/rules/clock.test.ts`, `src/rules/weeds.test.ts`

**Interfaces:**
- Produces:
  - From `clock.ts`:
    - `HOURS_PER_SECOND = 0.2`
    - `BUDGET_HOURS = 6`
    - `OVERTIME_CAP_RATIO = 1.5`
    - `hoursFor(elapsedSeconds: number): number`
    - `isOvertime(hoursUsed: number, budgetHours: number): boolean`
    - `hitOvertimeCap(hoursUsed: number, budgetHours: number): boolean`
    - `toTenths(hours: number): number` (floors, and is tolerant of float error)
    - `formatHours(hours: number): string` (one decimal place)
  - From `weeds.ts`:
    - `type Rng = () => number`
    - `weedsToSpawn(elapsedBefore: number, elapsedAfter: number, weedsPerSecond: number): number`
    - `spawnWeeds(weeds: Set<number>, beds: readonly number[], count: number, rng: Rng): void`

- [ ] **Step 1: Write the failing tests**

`src/rules/clock.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { BUDGET_HOURS, formatHours, hitOvertimeCap, hoursFor, isOvertime, toTenths } from './clock';

describe('clock', () => {
  it('converts 30 real seconds into the 6 hour budget', () => {
    expect(hoursFor(30)).toBeCloseTo(BUDGET_HOURS);
    expect(hoursFor(1)).toBeCloseTo(0.2);
  });

  it('is overtime only past the budget', () => {
    expect(isOvertime(6, 6)).toBe(false);
    expect(isOvertime(6.1, 6)).toBe(true);
  });

  it('hits the cap at 150% of budget', () => {
    expect(hitOvertimeCap(8.9, 6)).toBe(false);
    expect(hitOvertimeCap(9, 6)).toBe(true);
    expect(hitOvertimeCap(hoursFor(45), 6)).toBe(true);
  });

  it('counts whole tenths despite float error', () => {
    expect(toTenths(6 - 5.4)).toBe(6);
    expect(toTenths(0.05)).toBe(0);
    expect(toTenths(1.25)).toBe(12);
  });

  it('formats hours with one decimal', () => {
    expect(formatHours(6)).toBe('6.0');
    expect(formatHours(1.44)).toBe('1.4');
  });
});
```

`src/rules/weeds.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { spawnWeeds, weedsToSpawn } from './weeds';

describe('weedsToSpawn', () => {
  it('spawns one weed each time the running total crosses a whole number', () => {
    expect(weedsToSpawn(0, 1, 0.3)).toBe(0);
    expect(weedsToSpawn(0, 4, 0.3)).toBe(1);
    expect(weedsToSpawn(3.3, 3.4, 0.3)).toBe(1);
    expect(weedsToSpawn(0, 30, 0.3)).toBe(9);
  });

  it('never spawns with a zero rate', () => {
    expect(weedsToSpawn(0, 30, 0)).toBe(0);
  });
});

describe('spawnWeeds', () => {
  it('picks free bed tiles using the rng', () => {
    const weeds = new Set<number>();
    spawnWeeds(weeds, [10, 11, 12], 1, () => 0);
    expect([...weeds]).toEqual([10]);
    spawnWeeds(weeds, [10, 11, 12], 1, () => 0.99);
    expect([...weeds].sort((a, b) => a - b)).toEqual([10, 12]);
  });

  it('does not spawn on a bed that already has a weed', () => {
    const weeds = new Set<number>([10]);
    spawnWeeds(weeds, [10, 11], 1, () => 0);
    expect([...weeds].sort((a, b) => a - b)).toEqual([10, 11]);
  });

  it('stops when every bed is full', () => {
    const weeds = new Set<number>();
    spawnWeeds(weeds, [10, 11], 5, () => 0.5);
    expect(weeds.size).toBe(2);
  });

  it('handles an rng that returns exactly 1', () => {
    const weeds = new Set<number>();
    spawnWeeds(weeds, [10, 11], 1, () => 1);
    expect([...weeds]).toEqual([11]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn test src/rules/clock.test.ts src/rules/weeds.test.ts`
Expected: FAIL because the modules are not found.

- [ ] **Step 3: Implement `src/rules/clock.ts`**

```ts
export const HOURS_PER_SECOND = 0.2;
export const BUDGET_HOURS = 6;
export const OVERTIME_CAP_RATIO = 1.5;

const EPSILON = 1e-9;

export function hoursFor(elapsedSeconds: number): number {
  return elapsedSeconds * HOURS_PER_SECOND;
}

export function isOvertime(hoursUsed: number, budgetHours: number): boolean {
  return hoursUsed > budgetHours + EPSILON;
}

export function hitOvertimeCap(hoursUsed: number, budgetHours: number): boolean {
  return hoursUsed + EPSILON >= budgetHours * OVERTIME_CAP_RATIO;
}

export function toTenths(hours: number): number {
  return Math.floor(hours * 10 + EPSILON);
}

export function formatHours(hours: number): string {
  return hours.toFixed(1);
}
```

- [ ] **Step 4: Implement `src/rules/weeds.ts`**

```ts
export type Rng = () => number;

const EPSILON = 1e-9;

export function weedsToSpawn(elapsedBefore: number, elapsedAfter: number, weedsPerSecond: number): number {
  const total = (seconds: number) => Math.floor(seconds * weedsPerSecond + EPSILON);
  return total(elapsedAfter) - total(elapsedBefore);
}

export function spawnWeeds(weeds: Set<number>, beds: readonly number[], count: number, rng: Rng): void {
  for (let i = 0; i < count; i++) {
    const free = beds.filter((bed) => !weeds.has(bed));
    if (free.length === 0) return;
    const pick = Math.min(free.length - 1, Math.floor(rng() * free.length));
    weeds.add(free[pick]);
  }
}
```

- [ ] **Step 5: Run the tests and typecheck**

Run: `yarn test && yarn typecheck`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/rules
git commit -m "feat: add clock and weed spawning rules"
```

---

### Task 4: Scoring

**Files:**
- Create: `src/rules/scoring.ts`
- Test: `src/rules/scoring.test.ts`

**Interfaces:**
- Consumes: `toTenths` from `clock.ts`
- Produces:
  - `interface PropertyResult { mowedTiles: number; mowableTiles: number; weedsPulled: number; weedsLeft: number; hoursUsed: number; budgetHours: number }`
  - `interface Stars { onBudget: boolean; cleanCut: boolean; noWeeds: boolean }`
  - `CLEAN_CUT_RATIO = 0.95`
  - `starsFor(result: PropertyResult): Stars`
  - `starCount(stars: Stars): number`
  - `pointsFor(result: PropertyResult): number`
  - `hoursSavedFor(result: PropertyResult): number`
  - `type Title = 'Rookie' | 'Crew Lead' | 'Pro' | 'Margin Master'`
  - `titleFor(totalStars: number): Title`
  - `interface RoundSummary { stars: number; maxStars: number; points: number; hoursSaved: number; title: Title }`
  - `summarizeRound(results: readonly PropertyResult[]): RoundSummary`

- [ ] **Step 1: Write the failing tests**

`src/rules/scoring.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  hoursSavedFor,
  pointsFor,
  starCount,
  starsFor,
  summarizeRound,
  titleFor,
  type PropertyResult,
} from './scoring';

const perfect: PropertyResult = {
  mowedTiles: 100,
  mowableTiles: 100,
  weedsPulled: 4,
  weedsLeft: 0,
  hoursUsed: 5.4,
  budgetHours: 6,
};

describe('starsFor', () => {
  it('awards all three stars for a clean, on-budget, weed-free job', () => {
    expect(starsFor(perfect)).toEqual({ onBudget: true, cleanCut: true, noWeeds: true });
    expect(starCount(starsFor(perfect))).toBe(3);
  });

  it('treats exactly on budget as on budget', () => {
    expect(starsFor({ ...perfect, hoursUsed: 6 }).onBudget).toBe(true);
    expect(starsFor({ ...perfect, hoursUsed: 6.2 }).onBudget).toBe(false);
  });

  it('needs 95% coverage for Clean cut', () => {
    expect(starsFor({ ...perfect, mowedTiles: 95 }).cleanCut).toBe(true);
    expect(starsFor({ ...perfect, mowedTiles: 94 }).cleanCut).toBe(false);
  });

  it('loses No weeds when any weed is left', () => {
    expect(starsFor({ ...perfect, weedsLeft: 1 }).noWeeds).toBe(false);
  });
});

describe('pointsFor', () => {
  it('adds tiles, weeds and leftover budget when the cut is clean', () => {
    // 100*10 + 4*50 + 6 tenths left * 10
    expect(pointsFor(perfect)).toBe(1260);
  });

  it('gives no leftover-budget bonus when the cut is not clean', () => {
    // 90*10 + 4*50, no bonus
    expect(pointsFor({ ...perfect, mowedTiles: 90 })).toBe(1100);
  });

  it('subtracts 10 per tenth of overtime', () => {
    // 1000 + 200 - 15 tenths * 10
    expect(pointsFor({ ...perfect, hoursUsed: 7.5 })).toBe(1050);
  });
});

describe('hoursSavedFor', () => {
  it('counts leftover budget for clean, on-budget jobs', () => {
    expect(hoursSavedFor(perfect)).toBeCloseTo(0.6);
  });

  it('counts nothing when work was skipped', () => {
    expect(hoursSavedFor({ ...perfect, mowedTiles: 50, hoursUsed: 2 })).toBe(0);
  });

  it('counts nothing when over budget', () => {
    expect(hoursSavedFor({ ...perfect, hoursUsed: 7 })).toBe(0);
  });
});

describe('titleFor', () => {
  it.each([
    [0, 'Rookie'],
    [3, 'Rookie'],
    [4, 'Crew Lead'],
    [6, 'Crew Lead'],
    [7, 'Pro'],
    [8, 'Pro'],
    [9, 'Margin Master'],
  ])('%i stars is %s', (stars, title) => {
    expect(titleFor(stars)).toBe(title);
  });
});

describe('summarizeRound', () => {
  it('totals stars, points and hours saved across properties', () => {
    const sloppy: PropertyResult = { ...perfect, mowedTiles: 50, weedsLeft: 2, hoursUsed: 7 };
    const summary = summarizeRound([perfect, perfect, sloppy]);
    expect(summary.stars).toBe(6);
    expect(summary.maxStars).toBe(9);
    expect(summary.points).toBe(1260 + 1260 + (500 + 200 - 100));
    expect(summary.hoursSaved).toBe(1.2);
    expect(summary.title).toBe('Crew Lead');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn test src/rules/scoring.test.ts`
Expected: FAIL because the module is not found.

- [ ] **Step 3: Implement `src/rules/scoring.ts`**

```ts
import { isOvertime, toTenths } from './clock';

export interface PropertyResult {
  mowedTiles: number;
  mowableTiles: number;
  weedsPulled: number;
  weedsLeft: number;
  hoursUsed: number;
  budgetHours: number;
}

export interface Stars {
  onBudget: boolean;
  cleanCut: boolean;
  noWeeds: boolean;
}

export const CLEAN_CUT_RATIO = 0.95;
const STARS_PER_PROPERTY = 3;

export function starsFor(result: PropertyResult): Stars {
  return {
    onBudget: !isOvertime(result.hoursUsed, result.budgetHours),
    cleanCut: result.mowableTiles === 0 || result.mowedTiles / result.mowableTiles >= CLEAN_CUT_RATIO,
    noWeeds: result.weedsLeft === 0,
  };
}

export function starCount(stars: Stars): number {
  return [stars.onBudget, stars.cleanCut, stars.noWeeds].filter(Boolean).length;
}

export function pointsFor(result: PropertyResult): number {
  const stars = starsFor(result);
  let points = result.mowedTiles * 10 + result.weedsPulled * 50;
  if (stars.onBudget) {
    if (stars.cleanCut) points += toTenths(result.budgetHours - result.hoursUsed) * 10;
  } else {
    points -= toTenths(result.hoursUsed - result.budgetHours) * 10;
  }
  return points;
}

export function hoursSavedFor(result: PropertyResult): number {
  const stars = starsFor(result);
  return stars.onBudget && stars.cleanCut ? result.budgetHours - result.hoursUsed : 0;
}

export type Title = 'Rookie' | 'Crew Lead' | 'Pro' | 'Margin Master';

export function titleFor(totalStars: number): Title {
  if (totalStars >= 9) return 'Margin Master';
  if (totalStars >= 7) return 'Pro';
  if (totalStars >= 4) return 'Crew Lead';
  return 'Rookie';
}

export interface RoundSummary {
  stars: number;
  maxStars: number;
  points: number;
  hoursSaved: number;
  title: Title;
}

export function summarizeRound(results: readonly PropertyResult[]): RoundSummary {
  const stars = results.reduce((sum, r) => sum + starCount(starsFor(r)), 0);
  const points = results.reduce((sum, r) => sum + pointsFor(r), 0);
  const hoursSaved = results.reduce((sum, r) => sum + hoursSavedFor(r), 0);
  return {
    stars,
    maxStars: results.length * STARS_PER_PROPERTY,
    points,
    hoursSaved: Math.round(hoursSaved * 10) / 10,
    title: titleFor(stars),
  };
}
```

- [ ] **Step 4: Run the tests and typecheck**

Run: `yarn test && yarn typecheck`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/rules
git commit -m "feat: add star, points and hours-saved scoring"
```

---

### Task 5: Property layouts

**Files:**
- Create: `src/rules/properties.ts`
- Test: `src/rules/properties.test.ts`

**Interfaces:**
- Consumes: `CrewId`, `CREWS`, `parseLayout`, `mowableIndices`, `bedIndices`, `reachableIndices`, `BUDGET_HOURS`
- Produces:
  - `interface Property { id: 'office' | 'hoa' | 'hospital'; name: string; layout: readonly string[]; budgetHours: number; weedsPerSecond: number; tip: string; recommendedCrew: CrewId }`
  - `PROPERTIES: readonly Property[]` (in play order: office, hoa, hospital)

- [ ] **Step 1: Write the failing tests**

`src/rules/properties.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { CREWS } from './crews';
import { bedIndices, mowableIndices, parseLayout, reachableIndices } from './grid';
import { PROPERTIES } from './properties';

describe('PROPERTIES', () => {
  it('has office, hoa and hospital in play order', () => {
    expect(PROPERTIES.map((p) => p.id)).toEqual(['office', 'hoa', 'hospital']);
  });

  it.each(PROPERTIES)('$id layout parses and has beds', (property) => {
    const grid = parseLayout(property.layout);
    expect(bedIndices(grid).length).toBeGreaterThan(0);
    expect(property.budgetHours).toBe(6);
    expect(property.tip.length).toBeGreaterThan(0);
  });

  it.each(PROPERTIES)(
    '$id: the push crew can reach every mowable tile',
    (property) => {
      const grid = parseLayout(property.layout);
      const reach = reachableIndices(grid, CREWS.push);
      expect(mowableIndices(grid).filter((i) => !reach.has(i))).toEqual([]);
    },
  );

  it('office park: the ride-on crew can reach every mowable tile', () => {
    const office = PROPERTIES[0];
    const grid = parseLayout(office.layout);
    const reach = reachableIndices(grid, CREWS.rideOn);
    expect(mowableIndices(grid).filter((i) => !reach.has(i))).toEqual([]);
    expect(office.recommendedCrew).toBe('rideOn');
  });

  it('hospital: the ride-on crew cannot reach enough turf for a clean cut', () => {
    const hospital = PROPERTIES[2];
    const grid = parseLayout(hospital.layout);
    const reach = reachableIndices(grid, CREWS.rideOn);
    const mowable = mowableIndices(grid);
    const reachable = mowable.filter((i) => reach.has(i)).length;
    expect(reachable / mowable.length).toBeLessThan(0.95);
    expect(hospital.recommendedCrew).toBe('push');
  });

  it('hoa has the highest weed rate', () => {
    const [office, hoa, hospital] = PROPERTIES;
    expect(hoa.weedsPerSecond).toBeGreaterThan(office.weedsPerSecond);
    expect(hoa.weedsPerSecond).toBeGreaterThan(hospital.weedsPerSecond);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn test src/rules/properties.test.ts`
Expected: FAIL because the module is not found.

- [ ] **Step 3: Implement `src/rules/properties.ts`**

```ts
import { BUDGET_HOURS } from './clock';
import type { CrewId } from './crews';

export interface Property {
  id: 'office' | 'hoa' | 'hospital';
  name: string;
  layout: readonly string[];
  budgetHours: number;
  weedsPerSecond: number;
  tip: string;
  recommendedCrew: CrewId;
}

// Legend: . turf  : narrow turf  b bed  T tree  H building  = path  S start (path)
export const PROPERTIES: readonly Property[] = [
  {
    id: 'office',
    name: 'Office Park',
    budgetHours: BUDGET_HOURS,
    weedsPerSecond: 0.1,
    recommendedCrew: 'rideOn',
    tip: 'Office Park: wide open turf. The ride-on crew will fly.',
    layout: [
      'HHHH====HHHH',
      'HHHH=..=HHHH',
      '....=..=....',
      '............',
      '..T......T..',
      '............',
      '...bbbbbb...',
      '............',
      '............',
      '..T......T..',
      '............',
      '............',
      '....bb.bb...',
      '............',
      '............',
      '=====S======',
    ],
  },
  {
    id: 'hoa',
    name: 'HOA',
    budgetHours: BUDGET_HOURS,
    weedsPerSecond: 0.3,
    recommendedCrew: 'push',
    tip: 'HOA: beds get weedy. Save time to pull them.',
    layout: [
      'bbbb....bbbb',
      '............',
      '..HH.bb.HH..',
      '..HH.bb.HH..',
      '..bb....bb..',
      '............',
      'bb..bbbb..bb',
      '............',
      '..HH.bb.HH..',
      '..HH.bb.HH..',
      '..bb....bb..',
      '............',
      'b..........b',
      'bb..bbbb..bb',
      '............',
      '=====S======',
    ],
  },
  {
    id: 'hospital',
    name: 'Hospital Campus',
    budgetHours: BUDGET_HOURS,
    weedsPerSecond: 0.15,
    recommendedCrew: 'push',
    tip: 'Hospital Campus: tight strips. Push crew recommended.',
    layout: [
      'HHHHHHHHHHHH',
      'HHHHHHHHHHHH',
      '::::::::::::',
      'bbbbbb=bbbbb',
      '............',
      '....HHHH....',
      '....HHHH....',
      '::b:HHHH:b::',
      '::b:HHHH:b::',
      '....====....',
      '............',
      'bb:bb=bb:bbb',
      '::::::::::::',
      'T..........T',
      '............',
      '=====S======',
    ],
  },
];
```

- [ ] **Step 4: Run the tests and typecheck**

Run: `yarn test && yarn typecheck`
Expected: all tests pass. If a reachability test fails, it prints the unreachable tile indices. Fix the layout by opening a path next to those tiles, and do not weaken the test.

- [ ] **Step 5: Commit**

```bash
git add src/rules
git commit -m "feat: add office park, HOA and hospital layouts"
```

---

### Task 6: Property run state

**Files:**
- Create: `src/rules/run.ts`
- Test: `src/rules/run.test.ts`

**Interfaces:**
- Consumes: Tasks 2–5
- Produces:
  - `WEED_PULL_PAUSE_SECONDS = 1`
  - `interface Run { property: Property; grid: Grid; crew: Crew; mower: Pos; mowed: Set<number>; mowableCount: number; beds: number[]; weeds: Set<number>; weedsPulled: number; elapsedSeconds: number; moveCredit: number; pauseSeconds: number; ended: boolean }`
  - `createRun(property: Property, crewId: CrewId): Run`
  - `hoursUsed(run: Run): number`
  - `coveragePercent(run: Run): number`
  - `tickRun(run: Run, dtSeconds: number, target: Pos | null, rng: Rng): void` (mutates `run`)
  - `pullWeed(run: Run, index: number): boolean`
  - `endRun(run: Run): void`
  - `resultOf(run: Run): PropertyResult`
  - `missedTiles(run: Run): number[]` (unmowed mowable tiles plus weed tiles, sorted ascending)

- [ ] **Step 1: Write the failing tests**

`src/rules/run.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { indexOf } from './grid';
import type { Property } from './properties';
import {
  coveragePercent,
  createRun,
  endRun,
  hoursUsed,
  missedTiles,
  pullWeed,
  resultOf,
  tickRun,
} from './run';

const rng = () => 0;

function testProperty(weedsPerSecond = 0): Property {
  return {
    id: 'office',
    name: 'Test Lot',
    budgetHours: 6,
    weedsPerSecond,
    recommendedCrew: 'push',
    tip: 'test',
    layout: [
      'S.....:.....',
      'b===========',
      ...Array.from({ length: 14 }, () => '============'),
    ],
  };
}

describe('createRun', () => {
  it('starts at the start tile with nothing mowed', () => {
    const run = createRun(testProperty(), 'push');
    expect(run.mower).toEqual({ x: 0, y: 0 });
    expect(run.mowed.size).toBe(0);
    expect(run.mowableCount).toBe(11);
    expect(run.beds).toEqual([indexOf({ x: 0, y: 1 })]);
    expect(run.crew.id).toBe('push');
    expect(coveragePercent(run)).toBe(0);
  });
});

describe('tickRun movement', () => {
  it('moves at the crew speed and mows turf it crosses', () => {
    const run = createRun(testProperty(), 'push');
    tickRun(run, 0.5, { x: 5, y: 0 }, rng);
    expect(run.mower).toEqual({ x: 3, y: 0 });
    expect([...run.mowed].sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });

  it('does not double-count tiles mowed twice', () => {
    const run = createRun(testProperty(), 'push');
    tickRun(run, 0.5, { x: 3, y: 0 }, rng);
    tickRun(run, 0.5, { x: 1, y: 0 }, rng);
    expect(run.mowed.size).toBe(3);
  });

  it('does not move without a target', () => {
    const run = createRun(testProperty(), 'push');
    tickRun(run, 1, null, rng);
    expect(run.mower).toEqual({ x: 0, y: 0 });
    expect(run.elapsedSeconds).toBe(1);
  });

  it('stops the ride-on crew at narrow turf', () => {
    const run = createRun(testProperty(), 'rideOn');
    tickRun(run, 1, { x: 11, y: 0 }, rng);
    expect(run.mower).toEqual({ x: 5, y: 0 });
  });

  it('lets the push crew cross narrow turf', () => {
    const run = createRun(testProperty(), 'push');
    tickRun(run, 2, { x: 11, y: 0 }, rng);
    expect(run.mower).toEqual({ x: 11, y: 0 });
    expect(run.mowed.size).toBe(11);
    expect(coveragePercent(run)).toBe(100);
  });
});

describe('weeds', () => {
  it('spawns weeds on beds over time', () => {
    const run = createRun(testProperty(1), 'push');
    tickRun(run, 1, null, rng);
    expect([...run.weeds]).toEqual([indexOf({ x: 0, y: 1 })]);
  });

  it('pulling a weed removes it and pauses the mower for 1 second', () => {
    const run = createRun(testProperty(1), 'push');
    tickRun(run, 1, null, rng);
    const bed = indexOf({ x: 0, y: 1 });
    expect(pullWeed(run, bed)).toBe(true);
    expect(run.weedsPulled).toBe(1);
    tickRun(run, 0.5, { x: 5, y: 0 }, rng);
    tickRun(run, 0.5, { x: 5, y: 0 }, rng);
    expect(run.mower).toEqual({ x: 0, y: 0 });
    tickRun(run, 0.5, { x: 5, y: 0 }, rng);
    expect(run.mower).toEqual({ x: 3, y: 0 });
  });

  it('ignores taps on tiles without a weed', () => {
    const run = createRun(testProperty(), 'push');
    expect(pullWeed(run, indexOf({ x: 0, y: 1 }))).toBe(false);
    expect(run.pauseSeconds).toBe(0);
  });
});

describe('ending', () => {
  it('ends automatically at 150% of budget', () => {
    const run = createRun(testProperty(), 'push');
    tickRun(run, 44.9, null, rng);
    expect(run.ended).toBe(false);
    tickRun(run, 0.1, null, rng);
    expect(run.ended).toBe(true);
    expect(hoursUsed(run)).toBeCloseTo(9);
  });

  it('ignores ticks and taps after ending', () => {
    const run = createRun(testProperty(1), 'push');
    tickRun(run, 1, null, rng);
    endRun(run);
    tickRun(run, 1, { x: 5, y: 0 }, rng);
    expect(run.elapsedSeconds).toBe(1);
    expect(run.mower).toEqual({ x: 0, y: 0 });
    expect(pullWeed(run, indexOf({ x: 0, y: 1 }))).toBe(false);
  });
});

describe('resultOf and missedTiles', () => {
  it('summarizes the run for scoring', () => {
    const run = createRun(testProperty(1), 'push');
    tickRun(run, 0.5, { x: 3, y: 0 }, rng);
    tickRun(run, 0.5, null, rng);
    endRun(run);
    const result = resultOf(run);
    expect(result).toMatchObject({ mowedTiles: 3, mowableTiles: 11, weedsPulled: 0, weedsLeft: 1, budgetHours: 6 });
    expect(result.hoursUsed).toBeCloseTo(0.2);
  });

  it('lists unmowed turf and weeds in index order', () => {
    const run = createRun(testProperty(1), 'push');
    tickRun(run, 0.5, { x: 3, y: 0 }, rng);
    tickRun(run, 0.5, null, rng);
    expect(missedTiles(run)).toEqual([4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn test src/rules/run.test.ts`
Expected: FAIL because the module is not found.

- [ ] **Step 3: Implement `src/rules/run.ts`**

```ts
import { hitOvertimeCap, hoursFor } from './clock';
import { CREWS, type Crew, type CrewId } from './crews';
import {
  bedIndices,
  indexOf,
  isMowable,
  mowableIndices,
  parseLayout,
  stepToward,
  type Grid,
  type Pos,
} from './grid';
import type { Property } from './properties';
import type { PropertyResult } from './scoring';
import { spawnWeeds, weedsToSpawn, type Rng } from './weeds';

export const WEED_PULL_PAUSE_SECONDS = 1;

export interface Run {
  property: Property;
  grid: Grid;
  crew: Crew;
  mower: Pos;
  mowed: Set<number>;
  mowableCount: number;
  beds: number[];
  weeds: Set<number>;
  weedsPulled: number;
  elapsedSeconds: number;
  moveCredit: number;
  pauseSeconds: number;
  ended: boolean;
}

export function createRun(property: Property, crewId: CrewId): Run {
  const grid = parseLayout(property.layout);
  return {
    property,
    grid,
    crew: CREWS[crewId],
    mower: { ...grid.start },
    mowed: new Set(),
    mowableCount: mowableIndices(grid).length,
    beds: bedIndices(grid),
    weeds: new Set(),
    weedsPulled: 0,
    elapsedSeconds: 0,
    moveCredit: 0,
    pauseSeconds: 0,
    ended: false,
  };
}

export function hoursUsed(run: Run): number {
  return hoursFor(run.elapsedSeconds);
}

export function coveragePercent(run: Run): number {
  return run.mowableCount === 0 ? 100 : (run.mowed.size / run.mowableCount) * 100;
}

function moveMower(run: Run, dtSeconds: number, target: Pos): void {
  run.moveCredit += dtSeconds * run.crew.tilesPerSecond;
  while (run.moveCredit >= 1) {
    const next = stepToward(run.grid, run.mower, target, run.crew);
    if (next === null) {
      run.moveCredit = 0;
      return;
    }
    run.mower = next;
    run.moveCredit -= 1;
    const index = indexOf(next);
    if (isMowable(run.grid.tiles[index])) run.mowed.add(index);
  }
}

export function tickRun(run: Run, dtSeconds: number, target: Pos | null, rng: Rng): void {
  if (run.ended) return;
  const before = run.elapsedSeconds;
  run.elapsedSeconds += dtSeconds;
  spawnWeeds(run.weeds, run.beds, weedsToSpawn(before, run.elapsedSeconds, run.property.weedsPerSecond), rng);

  if (run.pauseSeconds > 0) {
    run.pauseSeconds = Math.max(0, run.pauseSeconds - dtSeconds);
    run.moveCredit = 0;
  } else if (target === null) {
    run.moveCredit = 0;
  } else {
    moveMower(run, dtSeconds, target);
  }

  if (hitOvertimeCap(hoursUsed(run), run.property.budgetHours)) run.ended = true;
}

export function pullWeed(run: Run, index: number): boolean {
  if (run.ended || !run.weeds.has(index)) return false;
  run.weeds.delete(index);
  run.weedsPulled += 1;
  run.pauseSeconds = WEED_PULL_PAUSE_SECONDS;
  return true;
}

export function endRun(run: Run): void {
  run.ended = true;
}

export function resultOf(run: Run): PropertyResult {
  return {
    mowedTiles: run.mowed.size,
    mowableTiles: run.mowableCount,
    weedsPulled: run.weedsPulled,
    weedsLeft: run.weeds.size,
    hoursUsed: hoursUsed(run),
    budgetHours: run.property.budgetHours,
  };
}

export function missedTiles(run: Run): number[] {
  const unmowed = mowableIndices(run.grid).filter((index) => !run.mowed.has(index));
  return [...unmowed, ...run.weeds].sort((a, b) => a - b);
}
```

- [ ] **Step 4: Run the tests and typecheck**

Run: `yarn test && yarn typecheck`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/rules
git commit -m "feat: add property run state with movement, weeds and results"
```

---

### Task 7: Rendering, input and game loop

**Files:**
- Create: `src/render/palette.ts`, `src/render/sprites.ts`, `src/render/board.ts`, `src/render/canvas.ts`, `src/game/input.ts`, `src/game/loop.ts`, `src/game/siteWalk.ts`
- Test: `src/render/canvas.test.ts`, `src/game/input.test.ts`

**Interfaces:**
- Consumes:
  - `Run`, `tickRun`, `pullWeed`, `missedTiles` from `run.ts`
  - `COLS`, `ROWS`, `Pos`, `indexOf`, `posOf`, `inBounds` from `grid.ts`
  - `Rng` from `weeds.ts`
- Produces:
  - `TILE = 16`
  - `BOARD_WIDTH = 192`, `BOARD_HEIGHT = 256`
  - `interface BoardSize { pixelScale: number; cssWidth: number; cssHeight: number }`
  - `boardSize(availableWidth: number, availableHeight: number, devicePixelRatio: number): BoardSize`
  - `setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D`
  - `interface BoardExtras { flags?: ReadonlySet<number>; manager?: Pos | null; hideMower?: boolean }`
  - `drawBoard(ctx: CanvasRenderingContext2D, run: Run, extras?: BoardExtras): void`
  - `pointToTile(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }): Pos | null`
  - `trackPointer(canvas: HTMLCanvasElement, onTapTile: (pos: Pos) => boolean): { target(): Pos | null; dispose(): void }`
  - `playProperty(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, run: Run, rng: Rng, onFrame: () => void): Promise<void>`
  - `playSiteWalk(ctx: CanvasRenderingContext2D, run: Run, durationMs?: number): Promise<void>`

- [ ] **Step 1: Write the failing tests for the pure helpers**

`src/render/canvas.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { BOARD_HEIGHT, BOARD_WIDTH, boardSize } from './canvas';

describe('boardSize', () => {
  it('is 192x256', () => {
    expect([BOARD_WIDTH, BOARD_HEIGHT]).toEqual([192, 256]);
  });

  it('uses the largest whole device-pixel multiple that fits', () => {
    // iPhone-ish: 374x588 CSS px available at 3x
    expect(boardSize(374, 588, 3)).toEqual({ pixelScale: 5, cssWidth: 320, cssHeight: (256 * 5) / 3 });
  });

  it('is 1:1 when the space exactly fits at 1x', () => {
    expect(boardSize(192, 256, 1)).toEqual({ pixelScale: 1, cssWidth: 192, cssHeight: 256 });
  });

  it('never drops below 1 device pixel per board pixel', () => {
    expect(boardSize(100, 100, 1).pixelScale).toBe(1);
  });
});
```

`src/game/input.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { pointToTile } from './input';

const rect = { left: 10, top: 20, width: 384, height: 512 };

describe('pointToTile', () => {
  it('maps a point to the tile under it', () => {
    expect(pointToTile(10, 20, rect)).toEqual({ x: 0, y: 0 });
    expect(pointToTile(10 + 33, 20 + 65, rect)).toEqual({ x: 1, y: 2 });
    expect(pointToTile(10 + 383, 20 + 511, rect)).toEqual({ x: 11, y: 15 });
  });

  it('returns null outside the board', () => {
    expect(pointToTile(9, 20, rect)).toBeNull();
    expect(pointToTile(10 + 384, 20, rect)).toBeNull();
    expect(pointToTile(10, 20 + 512, rect)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn test src/render src/game`
Expected: FAIL because the modules are not found.

- [ ] **Step 3: Implement `src/render/palette.ts`**

```ts
export const TILE = 16;

export const COLORS = {
  turf: '#4a9d3f',
  turfTuft: '#3b8433',
  mowedA: '#7cc36b',
  mowedB: '#6ab85a',
  mowedLine: '#5da94e',
  narrowMark: '#f5e6a3',
  bed: '#7a4b2a',
  bedSpeck: '#5c3620',
  path: '#c9c3b6',
  pathCrack: '#a9a397',
  roof: '#5a6b7d',
  roofEdge: '#46556a',
  window: '#cfe3f2',
  canopy: '#2f6b2f',
  canopyLight: '#3f8a3a',
  trunk: '#6b4423',
  weedStem: '#5fae3a',
  weedHead: '#f5d33b',
  weedCenter: '#e39b1b',
  rideOn: '#d64533',
  push: '#127DB9',
  wheel: '#222222',
  seat: '#333333',
  skin: '#f1c27d',
  flag: '#e23b3b',
  pole: '#333333',
  shirt: '#127DB9',
  clipboard: '#f0e6c8',
  shadow: 'rgba(0, 0, 0, 0.25)',
};
```

- [ ] **Step 4: Implement `src/render/canvas.ts`**

```ts
import { COLS, ROWS } from '../rules/grid';
import { TILE } from './palette';

export const BOARD_WIDTH = COLS * TILE;
export const BOARD_HEIGHT = ROWS * TILE;

const HUD_HEIGHT = 56;
const GUTTER = 16;

export interface BoardSize {
  pixelScale: number;
  cssWidth: number;
  cssHeight: number;
}

export function boardSize(availableWidth: number, availableHeight: number, devicePixelRatio: number): BoardSize {
  const fit = Math.min(availableWidth / BOARD_WIDTH, availableHeight / BOARD_HEIGHT);
  const pixelScale = Math.max(1, Math.floor(fit * devicePixelRatio));
  return {
    pixelScale,
    cssWidth: (BOARD_WIDTH * pixelScale) / devicePixelRatio,
    cssHeight: (BOARD_HEIGHT * pixelScale) / devicePixelRatio,
  };
}

export function setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error('Canvas 2D is not supported');
  const fit = () => {
    const dpr = window.devicePixelRatio || 1;
    const size = boardSize(window.innerWidth - GUTTER, window.innerHeight - HUD_HEIGHT - GUTTER, dpr);
    canvas.width = BOARD_WIDTH * size.pixelScale;
    canvas.height = BOARD_HEIGHT * size.pixelScale;
    canvas.style.width = `${size.cssWidth}px`;
    canvas.style.height = `${size.cssHeight}px`;
    // Resizing a canvas resets its context state, so re-apply both settings every time.
    ctx.setTransform(size.pixelScale, 0, 0, size.pixelScale, 0, 0);
    ctx.imageSmoothingEnabled = false;
  };
  fit();
  window.addEventListener('resize', fit);
  return ctx;
}
```

- [ ] **Step 5: Implement `src/render/sprites.ts`**

All coordinates are in logical board pixels, and `(x, y)` is the tile's top-left corner.

```ts
import type { CrewId } from '../rules/crews';
import { COLORS, TILE } from './palette';

type Ctx = CanvasRenderingContext2D;

function px(ctx: Ctx, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function hash(n: number): number {
  let h = Math.imul(n + 1, 374761393) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return h;
}

export function drawTurf(ctx: Ctx, x: number, y: number, seed: number): void {
  px(ctx, x, y, TILE, TILE, COLORS.turf);
  const h = hash(seed);
  for (let i = 0; i < 4; i++) {
    const tx = (h >>> (i * 4)) & 15;
    const ty = (h >>> (i * 4 + 16)) & 15;
    px(ctx, x + Math.min(tx, 14), y + Math.min(ty, 12), 1, 3, COLORS.turfTuft);
  }
}

export function drawMowed(ctx: Ctx, x: number, y: number, row: number): void {
  px(ctx, x, y, TILE, TILE, row % 2 === 0 ? COLORS.mowedA : COLORS.mowedB);
  px(ctx, x, y + TILE - 1, TILE, 1, COLORS.mowedLine);
}

export function drawNarrowMarks(ctx: Ctx, x: number, y: number): void {
  for (let i = 0; i < TILE; i += 4) {
    px(ctx, x + i, y, 2, 1, COLORS.narrowMark);
    px(ctx, x + i, y + TILE - 1, 2, 1, COLORS.narrowMark);
  }
}

export function drawBed(ctx: Ctx, x: number, y: number, seed: number): void {
  px(ctx, x, y, TILE, TILE, COLORS.bed);
  const h = hash(seed);
  for (let i = 0; i < 6; i++) {
    const sx = (h >>> (i * 5)) & 15;
    const sy = (h >>> (i * 3 + 7)) & 15;
    px(ctx, x + sx, y + sy, 1, 1, COLORS.bedSpeck);
  }
}

export function drawPath(ctx: Ctx, x: number, y: number, seed: number): void {
  px(ctx, x, y, TILE, TILE, COLORS.path);
  const h = hash(seed);
  if ((h & 3) === 0) {
    const cx = 3 + ((h >>> 4) & 7);
    px(ctx, x + cx, y + 5, 1, 3, COLORS.pathCrack);
    px(ctx, x + cx + 1, y + 8, 1, 2, COLORS.pathCrack);
  }
}

export function drawBuilding(ctx: Ctx, x: number, y: number): void {
  px(ctx, x, y, TILE, TILE, COLORS.roof);
  px(ctx, x, y, TILE, 1, COLORS.roofEdge);
  px(ctx, x + 3, y + 4, 4, 4, COLORS.window);
  px(ctx, x + 9, y + 4, 4, 4, COLORS.window);
  px(ctx, x + 3, y + 10, 4, 4, COLORS.window);
  px(ctx, x + 9, y + 10, 4, 4, COLORS.window);
}

export function drawTree(ctx: Ctx, x: number, y: number, seed: number): void {
  drawTurf(ctx, x, y, seed);
  px(ctx, x + 4, y + 13, 9, 2, COLORS.shadow);
  px(ctx, x + 7, y + 10, 2, 5, COLORS.trunk);
  px(ctx, x + 3, y + 2, 10, 9, COLORS.canopy);
  px(ctx, x + 2, y + 4, 12, 5, COLORS.canopy);
  px(ctx, x + 5, y + 3, 4, 3, COLORS.canopyLight);
}

export function drawWeed(ctx: Ctx, x: number, y: number): void {
  px(ctx, x + 7, y + 7, 2, 7, COLORS.weedStem);
  px(ctx, x + 4, y + 10, 3, 2, COLORS.weedStem);
  px(ctx, x + 9, y + 9, 3, 2, COLORS.weedStem);
  px(ctx, x + 5, y + 2, 6, 5, COLORS.weedHead);
  px(ctx, x + 7, y + 4, 2, 2, COLORS.weedCenter);
}

export function drawMower(ctx: Ctx, x: number, y: number, crew: CrewId): void {
  px(ctx, x + 2, y + 13, 12, 2, COLORS.shadow);
  if (crew === 'rideOn') {
    px(ctx, x + 2, y + 6, 12, 7, COLORS.rideOn);
    px(ctx, x + 5, y + 4, 6, 4, COLORS.seat);
    px(ctx, x + 6, y + 0, 4, 4, COLORS.skin);
    px(ctx, x + 1, y + 11, 3, 4, COLORS.wheel);
    px(ctx, x + 12, y + 11, 3, 4, COLORS.wheel);
  } else {
    px(ctx, x + 3, y + 8, 10, 6, COLORS.push);
    px(ctx, x + 5, y + 2, 1, 6, COLORS.seat);
    px(ctx, x + 10, y + 2, 1, 6, COLORS.seat);
    px(ctx, x + 5, y + 2, 6, 1, COLORS.seat);
    px(ctx, x + 3, y + 13, 2, 2, COLORS.wheel);
    px(ctx, x + 11, y + 13, 2, 2, COLORS.wheel);
  }
}

export function drawFlag(ctx: Ctx, x: number, y: number): void {
  px(ctx, x + 4, y + 2, 1, 13, COLORS.pole);
  px(ctx, x + 5, y + 2, 7, 5, COLORS.flag);
}

export function drawManager(ctx: Ctx, x: number, y: number): void {
  px(ctx, x + 4, y + 14, 8, 2, COLORS.shadow);
  px(ctx, x + 6, y + 1, 4, 4, COLORS.skin);
  px(ctx, x + 5, y + 5, 6, 6, COLORS.shirt);
  px(ctx, x + 6, y + 11, 2, 4, COLORS.seat);
  px(ctx, x + 8, y + 11, 2, 4, COLORS.seat);
  px(ctx, x + 11, y + 6, 3, 4, COLORS.clipboard);
}
```

- [ ] **Step 6: Implement `src/render/board.ts`**

```ts
import { posOf, type Pos } from '../rules/grid';
import type { Run } from '../rules/run';
import { TILE } from './palette';
import {
  drawBed,
  drawBuilding,
  drawFlag,
  drawManager,
  drawMowed,
  drawMower,
  drawNarrowMarks,
  drawPath,
  drawTree,
  drawTurf,
  drawWeed,
} from './sprites';

export interface BoardExtras {
  flags?: ReadonlySet<number>;
  manager?: Pos | null;
  hideMower?: boolean;
}

export function drawBoard(ctx: CanvasRenderingContext2D, run: Run, extras: BoardExtras = {}): void {
  run.grid.tiles.forEach((tile, index) => {
    const pos = posOf(index);
    const x = pos.x * TILE;
    const y = pos.y * TILE;
    switch (tile) {
      case 'turf':
      case 'narrow':
        if (run.mowed.has(index)) drawMowed(ctx, x, y, pos.y);
        else drawTurf(ctx, x, y, index);
        if (tile === 'narrow') drawNarrowMarks(ctx, x, y);
        break;
      case 'bed':
        drawBed(ctx, x, y, index);
        break;
      case 'path':
        drawPath(ctx, x, y, index);
        break;
      case 'building':
        drawBuilding(ctx, x, y);
        break;
      case 'tree':
        drawTree(ctx, x, y, index);
        break;
    }
    if (run.weeds.has(index)) drawWeed(ctx, x, y);
    if (extras.flags?.has(index)) drawFlag(ctx, x, y);
  });
  if (!extras.hideMower) drawMower(ctx, run.mower.x * TILE, run.mower.y * TILE, run.crew.id);
  if (extras.manager) drawManager(ctx, extras.manager.x * TILE, extras.manager.y * TILE);
}
```

- [ ] **Step 7: Implement `src/game/input.ts`**

```ts
import { COLS, ROWS, inBounds, type Pos } from '../rules/grid';

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function pointToTile(clientX: number, clientY: number, rect: Rect): Pos | null {
  const pos = {
    x: Math.floor(((clientX - rect.left) / rect.width) * COLS),
    y: Math.floor(((clientY - rect.top) / rect.height) * ROWS),
  };
  return inBounds(pos) ? pos : null;
}

export interface PointerTracker {
  target(): Pos | null;
  dispose(): void;
}

// A press on a tile that onTapTile handles (a weed) is a tap; any other press starts a drag.
export function trackPointer(canvas: HTMLCanvasElement, onTapTile: (pos: Pos) => boolean): PointerTracker {
  let target: Pos | null = null;
  let activePointer: number | null = null;
  const toTile = (event: PointerEvent) => pointToTile(event.clientX, event.clientY, canvas.getBoundingClientRect());

  const down = (event: PointerEvent) => {
    event.preventDefault();
    const pos = toTile(event);
    if (pos !== null && onTapTile(pos)) return;
    activePointer = event.pointerId;
    canvas.setPointerCapture(event.pointerId);
    target = pos;
  };
  const move = (event: PointerEvent) => {
    if (event.pointerId !== activePointer) return;
    const pos = toTile(event);
    if (pos !== null) target = pos;
  };
  const up = (event: PointerEvent) => {
    if (event.pointerId !== activePointer) return;
    activePointer = null;
    target = null;
  };

  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);

  return {
    target: () => target,
    dispose() {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
    },
  };
}
```

- [ ] **Step 8: Implement `src/game/loop.ts`**

```ts
import { drawBoard } from '../render/board';
import { indexOf } from '../rules/grid';
import { pullWeed, tickRun, type Run } from '../rules/run';
import type { Rng } from '../rules/weeds';
import { trackPointer } from './input';

// Caps a single tick so a backgrounded tab can't teleport the mower.
const MAX_DT_SECONDS = 0.1;

export function playProperty(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  run: Run,
  rng: Rng,
  onFrame: () => void,
): Promise<void> {
  return new Promise((resolve) => {
    const pointer = trackPointer(canvas, (pos) => pullWeed(run, indexOf(pos)));
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(MAX_DT_SECONDS, Math.max(0, (now - last) / 1000));
      last = now;
      tickRun(run, dt, pointer.target(), rng);
      drawBoard(ctx, run);
      onFrame();
      if (run.ended) {
        pointer.dispose();
        resolve();
        return;
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}
```

- [ ] **Step 9: Implement `src/game/siteWalk.ts`**

```ts
import { drawBoard } from '../render/board';
import { COLS, ROWS, posOf } from '../rules/grid';
import { missedTiles, type Run } from '../rules/run';

export function playSiteWalk(ctx: CanvasRenderingContext2D, run: Run, durationMs = 2500): Promise<void> {
  const missed = missedTiles(run);
  return new Promise((resolve) => {
    const startedAt = performance.now();
    const frame = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      const shown = Math.floor(progress * missed.length);
      const flags = new Set(missed.slice(0, shown));
      const lastFlag = missed.length > 0 ? missed[Math.max(0, shown - 1)] : undefined;
      const manager =
        lastFlag === undefined
          ? { x: Math.floor(progress * (COLS - 1)), y: ROWS - 1 }
          : posOf(lastFlag);
      drawBoard(ctx, run, { flags, manager });
      if (progress >= 1) {
        resolve();
        return;
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}
```

- [ ] **Step 10: Run the tests and typecheck**

Run: `yarn test && yarn typecheck`
Expected: all tests pass and there are no type errors.

- [ ] **Step 11: Commit**

```bash
git add src/render src/game
git commit -m "feat: add pixel renderer, pointer input, game loop and site walk"
```

---

### Task 8: Screens, styles and main flow

**Files:**
- Create: `src/screens/dom.ts`, `src/screens/title.ts`, `src/screens/briefing.ts`, `src/screens/hud.ts`, `src/screens/walkCard.ts`, `src/screens/results.ts`, `src/screens/fatal.ts`, `src/share/text.ts`
- Replace: `src/style.css`, `src/main.ts`
- Test: `src/share/text.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 1–7
- Produces:
  - From `share/text.ts`:
    - `starString(earned: number, total: number): string`
    - `formatPoints(points: number): string`
    - `summaryLine(summary: RoundSummary): string`
    - `shareText(summary: RoundSummary, pageUrl: string): string`
  - Screens:
    - `showTitle(overlay: HTMLElement): Promise<void>`
    - `showBriefing(overlay: HTMLElement, property: Property, index: number, total: number): Promise<CrewId>`
    - `createHud(overlay: HTMLElement, property: Property, onDone: () => void): { update(run: Run): void; remove(): void }`
    - `showWalkCard(overlay: HTMLElement, property: Property, result: PropertyResult, isLast: boolean): Promise<void>`
    - `interface ResultsActions { demoUrl: string; showLeadForm: boolean; onShare(): Promise<ShareOutcome>; onSubmitLead(lead: LeadFields): Promise<boolean> }`
    - `showResults(overlay: HTMLElement, summary: RoundSummary, actions: ResultsActions): Promise<void>` (resolves on Play again)
    - `showFatal(overlay: HTMLElement): void`
- Task 8 imports two things that later tasks create: `ShareOutcome` (Task 9) and `LeadFields` (Task 10). So that Task 8 compiles on its own, it creates minimal versions of both in their final shape:
  - `src/share/share.ts` with `export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled';`
  - `src/hubspot.ts` with `export interface LeadFields { firstName: string; company: string; email: string }` and `export function isValidEmail(email: string): boolean`

  Tasks 9 and 10 then add the rest of each file.

- [ ] **Step 1: Write the failing text tests**

`src/share/text.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import type { RoundSummary } from '../rules/scoring';
import { formatPoints, shareText, starString, summaryLine } from './text';

const summary: RoundSummary = { stars: 7, maxStars: 9, points: 4820, hoursSaved: 1.4, title: 'Pro' };

describe('share text', () => {
  it('draws filled and empty stars', () => {
    expect(starString(2, 3)).toBe('★★☆');
    expect(starString(0, 3)).toBe('☆☆☆');
  });

  it('formats points with thousands separators', () => {
    expect(formatPoints(4820)).toBe('4,820');
    expect(formatPoints(-30)).toBe('-30');
  });

  it('builds the scorecard summary line', () => {
    expect(summaryLine(summary)).toBe('⭐ 7/9 · 4,820 pts · 1.4 hrs saved · Pro');
  });

  it('builds the share text with the page link and no BomData stat', () => {
    const text = shareText(summary, 'https://bomdata.io/margin-mower/');
    expect(text).toBe(
      'I scored 7/9 stars and saved 1.4 hrs in Margin Mower. Can you mow on budget? https://bomdata.io/margin-mower/',
    );
    expect(text).not.toContain('8–10%');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn test src/share`
Expected: FAIL because the module is not found.

- [ ] **Step 3: Implement `src/share/text.ts`**

```ts
import { formatHours } from '../rules/clock';
import type { RoundSummary } from '../rules/scoring';

export function starString(earned: number, total: number): string {
  return '★'.repeat(earned) + '☆'.repeat(Math.max(0, total - earned));
}

export function formatPoints(points: number): string {
  return points.toLocaleString('en-US');
}

export function summaryLine(summary: RoundSummary): string {
  return `⭐ ${summary.stars}/${summary.maxStars} · ${formatPoints(summary.points)} pts · ${formatHours(summary.hoursSaved)} hrs saved · ${summary.title}`;
}

export function shareText(summary: RoundSummary, pageUrl: string): string {
  return `I scored ${summary.stars}/${summary.maxStars} stars and saved ${formatHours(summary.hoursSaved)} hrs in Margin Mower. Can you mow on budget? ${pageUrl}`;
}
```

- [ ] **Step 4: Create the minimal versions of `src/share/share.ts` and `src/hubspot.ts`**

`src/share/share.ts`:
```ts
export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled';
```

`src/hubspot.ts`:
```ts
export interface LeadFields {
  firstName: string;
  company: string;
  email: string;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
```

- [ ] **Step 5: Implement `src/screens/dom.ts`**

```ts
type Child = Node | string;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: { className?: string; text?: string } = {},
  children: Child[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.className !== undefined) node.className = props.className;
  if (props.text !== undefined) node.textContent = props.text;
  node.append(...children);
  return node;
}

export function button(label: string, className: string, onClick: () => void): HTMLButtonElement {
  const node = el('button', { className: `btn ${className}`, text: label });
  node.type = 'button';
  node.addEventListener('click', onClick);
  return node;
}

export function link(label: string, className: string, href: string): HTMLAnchorElement {
  const node = el('a', { className, text: label });
  node.href = href;
  node.target = '_blank';
  node.rel = 'noopener';
  return node;
}

export function statRow(label: string, value: string): HTMLDivElement {
  return el('div', { className: 'stat-row' }, [el('span', { text: label }), el('span', { text: value })]);
}

export function mount(overlay: HTMLElement, node: HTMLElement): void {
  overlay.replaceChildren(node);
}
```

- [ ] **Step 6: Implement the screens**

`src/screens/title.ts`:
```ts
import { withUtm } from '../config';
import { button, el, link, mount } from './dom';

export function showTitle(overlay: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    mount(
      overlay,
      el('div', { className: 'panel' }, [
        el('h1', { text: 'Margin Mower' }),
        el('p', { className: 'tagline', text: 'Can you mow on budget?' }),
        el('p', {
          text: 'Three properties, six hours each. Drag to mow, tap weeds to pull them, and finish before the clock runs out.',
        }),
        button('Start shift', 'primary', () => {
          overlay.replaceChildren();
          resolve();
        }),
        el('p', { className: 'proof' }, ['A game by ', link('BomData', 'inline-link', withUtm('https://bomdata.io/'))]),
      ]),
    );
  });
}
```

`src/screens/briefing.ts`:
```ts
import { formatHours } from '../rules/clock';
import { CREWS, type CrewId } from '../rules/crews';
import type { Property } from '../rules/properties';
import { button, el, mount } from './dom';

export function showBriefing(overlay: HTMLElement, property: Property, index: number, total: number): Promise<CrewId> {
  return new Promise((resolve) => {
    const crewButton = (id: CrewId, detail: string) => {
      const node = button(CREWS[id].label, 'secondary', () => {
        overlay.replaceChildren();
        resolve(id);
      });
      node.append(el('small', { text: detail }));
      return node;
    };
    mount(
      overlay,
      el('div', { className: 'panel bottom' }, [
        el('h2', { text: `Property ${index + 1} of ${total}` }),
        el('h1', { text: property.name }),
        el('p', { text: `Budget: ${formatHours(property.budgetHours)} hrs` }),
        el('div', { className: 'tip' }, [el('strong', { text: 'BomData heads-up' }), property.tip]),
        el('div', { className: 'crew-choice' }, [
          crewButton('rideOn', 'Fast. Can’t fit narrow strips.'),
          crewButton('push', 'Slower. Reaches everything.'),
        ]),
      ]),
    );
  });
}
```

`src/screens/hud.ts`:
```ts
import { formatHours, isOvertime } from '../rules/clock';
import type { Property } from '../rules/properties';
import { coveragePercent, hoursUsed, type Run } from '../rules/run';
import { button, el, mount } from './dom';

export interface Hud {
  update(run: Run): void;
  remove(): void;
}

export function createHud(overlay: HTMLElement, property: Property, onDone: () => void): Hud {
  const clock = el('span', { className: 'clock' });
  const coverage = el('span', { className: 'coverage' });
  const bar = el('div', { className: 'hud' }, [
    el('span', { className: 'name', text: property.name }),
    clock,
    coverage,
    button('Done', 'hud-done', onDone),
  ]);
  mount(overlay, bar);
  return {
    update(run) {
      const used = hoursUsed(run);
      clock.textContent = `${formatHours(used)}/${formatHours(run.property.budgetHours)}h`;
      clock.classList.toggle('overtime', isOvertime(used, run.property.budgetHours));
      coverage.textContent = `${Math.floor(coveragePercent(run))}% cut`;
    },
    remove() {
      bar.remove();
    },
  };
}
```

`src/screens/walkCard.ts`:
```ts
import { formatHours } from '../rules/clock';
import type { Property } from '../rules/properties';
import { starCount, starsFor, type PropertyResult } from '../rules/scoring';
import { starString } from '../share/text';
import { button, el, mount, statRow } from './dom';

export function showWalkCard(
  overlay: HTMLElement,
  property: Property,
  result: PropertyResult,
  isLast: boolean,
): Promise<void> {
  const stars = starsFor(result);
  const mark = (earned: boolean) => (earned ? '★' : '☆');
  return new Promise((resolve) => {
    mount(
      overlay,
      el('div', { className: 'panel bottom' }, [
        el('h2', { text: `${property.name} site walk` }),
        el('div', { className: 'stars', text: starString(starCount(stars), 3) }),
        statRow('Hours', `${formatHours(result.hoursUsed)} / ${formatHours(result.budgetHours)}`),
        statRow('On budget', mark(stars.onBudget)),
        statRow('Clean cut', mark(stars.cleanCut)),
        statRow('No weeds', mark(stars.noWeeds)),
        button(isLast ? 'See my scorecard' : 'Next property', 'primary', () => {
          overlay.replaceChildren();
          resolve();
        }),
      ]),
    );
  });
}
```

`src/screens/results.ts`:
```ts
import { isValidEmail, type LeadFields } from '../hubspot';
import { formatHours } from '../rules/clock';
import type { RoundSummary } from '../rules/scoring';
import type { ShareOutcome } from '../share/share';
import { formatPoints, starString, summaryLine } from '../share/text';
import { button, el, link, mount, statRow } from './dom';

export interface ResultsActions {
  demoUrl: string;
  showLeadForm: boolean;
  onShare(): Promise<ShareOutcome>;
  onSubmitLead(lead: LeadFields): Promise<boolean>;
}

const SHARE_MESSAGES: Record<ShareOutcome, string> = {
  shared: 'Shared!',
  downloaded: 'Image saved. Attach it to your LinkedIn post.',
  cancelled: '',
};

function input(name: string, placeholder: string, type: string): HTMLInputElement {
  const node = el('input');
  node.name = name;
  node.placeholder = placeholder;
  node.type = type;
  node.required = true;
  node.setAttribute('aria-label', placeholder);
  return node;
}

function leadForm(onSubmitLead: ResultsActions['onSubmitLead']): HTMLFormElement {
  const firstName = input('firstname', 'First name', 'text');
  const company = input('company', 'Company', 'text');
  const email = input('email', 'Work email', 'email');
  const status = el('p', { className: 'form-status' });
  const submit = el('button', { className: 'btn secondary', text: 'Send it' });
  submit.type = 'submit';
  const form = el('form', { className: 'lead' }, [
    el('h2', { text: 'See your real scorecard' }),
    el('p', { text: 'BomData turns your Aspire data into this, every week.' }),
    firstName,
    company,
    email,
    submit,
    status,
  ]);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!isValidEmail(email.value)) {
      status.textContent = 'Please enter a valid email.';
      return;
    }
    submit.disabled = true;
    status.textContent = 'Saving…';
    const ok = await onSubmitLead({ firstName: firstName.value, company: company.value, email: email.value });
    if (ok) {
      status.textContent = 'Thanks! We’ll be in touch.';
    } else {
      status.textContent = "Couldn't save, try again";
      submit.disabled = false;
    }
  });
  return form;
}

export function showResults(overlay: HTMLElement, summary: RoundSummary, actions: ResultsActions): Promise<void> {
  return new Promise((resolve) => {
    const shareStatus = el('p', { className: 'form-status' });
    const shareButton = button('Share my score', 'secondary', async () => {
      shareButton.disabled = true;
      shareStatus.textContent = SHARE_MESSAGES[await actions.onShare()];
      shareButton.disabled = false;
    });
    mount(
      overlay,
      el('div', { className: 'panel' }, [
        el('h2', { text: 'Weekly scorecard' }),
        el('h1', { text: summary.title }),
        el('div', { className: 'stars', text: starString(summary.stars, summary.maxStars) }),
        el('p', { className: 'summary', text: summaryLine(summary) }),
        statRow('Points', formatPoints(summary.points)),
        statRow('Hours saved', `${formatHours(summary.hoursSaved)} hrs`),
        el('p', { className: 'proof', text: 'Real crews using BomData improved labor efficiency 8–10%.' }),
        link('Book a demo', 'btn primary', actions.demoUrl),
        shareButton,
        shareStatus,
        ...(actions.showLeadForm ? [leadForm(actions.onSubmitLead)] : []),
        button('Play again', 'secondary', () => {
          overlay.replaceChildren();
          resolve();
        }),
      ]),
    );
  });
}
```

`src/screens/fatal.ts`:
```ts
import { button, el, mount } from './dom';

export function showFatal(overlay: HTMLElement): void {
  mount(
    overlay,
    el('div', { className: 'panel' }, [
      el('h2', { text: 'Something went wrong' }),
      el('p', { text: 'Reload to start a new shift.' }),
      button('Reload', 'primary', () => window.location.reload()),
    ]),
  );
}
```

- [ ] **Step 7: Replace `src/style.css`**

```css
:root {
  --brand: #127db9;
  --brand-light: #7ebec5;
  --ink: #1d2b36;
  --paper: #fffdf5;
  --danger: #d64533;
  --gold: #f5c542;
  --pixel: 'Press Start 2P', monospace;
  --body: 'DM Sans', Helvetica, Arial, sans-serif;
}

* { box-sizing: border-box; }

html,
body {
  margin: 0;
  height: 100%;
  background: #2f6b2f;
  color: var(--ink);
  font-family: var(--body);
  overflow: hidden;
  overscroll-behavior: none;
}

#app {
  position: relative;
  width: 100%;
  height: 100%;
  padding-top: 56px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

#board {
  display: block;
  margin-top: 8px;
  image-rendering: pixelated;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

#overlay { position: absolute; inset: 0; pointer-events: none; }
#overlay > * { pointer-events: auto; }

.hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(29, 43, 54, 0.92);
  color: #fff;
  font-family: var(--pixel);
  font-size: 10px;
}
.hud .name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hud .clock.overtime { color: #ff7a6b; }
.hud .btn { width: auto; margin: 0; padding: 8px 10px; font-size: 10px; }

.panel {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: min(calc(100vw - 32px), 380px);
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  background: var(--paper);
  border: 4px solid var(--ink);
  box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.35);
  padding: 20px 16px;
  text-align: center;
}
.panel.bottom { top: auto; bottom: 16px; transform: translateX(-50%); }
.panel h1,
.panel h2 { font-family: var(--pixel); line-height: 1.5; margin: 0 0 12px; }
.panel h1 { font-size: 18px; }
.panel h2 { font-size: 11px; color: var(--brand); }
.panel p { margin: 0 0 12px; line-height: 1.4; }

.tagline { font-size: 17px; font-weight: 700; }
.summary { font-weight: 700; }
.proof { font-size: 13px; color: #4d5b66; }
.inline-link { color: var(--brand); font-weight: 700; }

.tip {
  background: #e8f3fa;
  border-left: 4px solid var(--brand);
  text-align: left;
  padding: 10px 12px;
  margin: 12px 0;
  font-size: 15px;
}
.tip strong { display: block; color: var(--brand); font-family: var(--pixel); font-size: 9px; margin-bottom: 6px; }

.btn {
  display: block;
  width: 100%;
  margin-top: 10px;
  padding: 14px 12px;
  font-family: var(--pixel);
  font-size: 11px;
  line-height: 1.4;
  text-align: center;
  text-decoration: none;
  color: var(--ink);
  background: var(--gold);
  border: 3px solid var(--ink);
  box-shadow: 3px 3px 0 var(--ink);
  cursor: pointer;
}
.btn:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 var(--ink); }
.btn:disabled { opacity: 0.6; cursor: default; }
.btn.primary { background: var(--brand); color: #fff; }
.btn.secondary { background: #fff; }
.btn small { display: block; margin-top: 6px; font-family: var(--body); font-size: 12px; }

.crew-choice { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

.stars { font-size: 26px; letter-spacing: 3px; color: #e0a800; margin: 4px 0 8px; }

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 2px dashed #d8d2bf;
  font-size: 15px;
}

form.lead { margin-top: 18px; padding-top: 14px; border-top: 3px solid var(--ink); }
form.lead input {
  display: block;
  width: 100%;
  margin-top: 8px;
  padding: 10px;
  font: inherit;
  font-size: 16px;
  border: 2px solid var(--ink);
  background: #fff;
}
.form-status { font-size: 13px; min-height: 1em; margin-top: 6px; }
```

`font-size: 16px` on the inputs stops iOS Safari from zooming in when an input gets focus.

- [ ] **Step 8: Replace `src/main.ts`**

This version does not yet wire up sharing or HubSpot. Share reports `'cancelled'`, and the lead form stays hidden. Tasks 9 and 10 replace these stubs.

```ts
import './style.css';
import { config, withUtm } from './config';
import { playProperty } from './game/loop';
import { playSiteWalk } from './game/siteWalk';
import { drawBoard } from './render/board';
import { setupCanvas } from './render/canvas';
import { PROPERTIES } from './rules/properties';
import { createRun, endRun, resultOf } from './rules/run';
import { summarizeRound, type PropertyResult, type RoundSummary } from './rules/scoring';
import { showBriefing } from './screens/briefing';
import { showFatal } from './screens/fatal';
import { createHud } from './screens/hud';
import { showResults } from './screens/results';
import { showTitle } from './screens/title';
import { showWalkCard } from './screens/walkCard';

function requireElement<T extends HTMLElement>(selector: string, type: { new (): T }): T {
  const node = document.querySelector(selector);
  if (!(node instanceof type)) throw new Error(`Missing element ${selector}`);
  return node;
}

const canvas = requireElement('#board', HTMLCanvasElement);
const overlay = requireElement('#overlay', HTMLDivElement);
const ctx = setupCanvas(canvas);

window.addEventListener('error', () => showFatal(overlay));
window.addEventListener('unhandledrejection', () => showFatal(overlay));

async function playRound(): Promise<RoundSummary> {
  const results: PropertyResult[] = [];
  for (const [index, property] of PROPERTIES.entries()) {
    drawBoard(ctx, createRun(property, 'push'), { hideMower: true });
    const crew = await showBriefing(overlay, property, index, PROPERTIES.length);
    const run = createRun(property, crew);
    const hud = createHud(overlay, property, () => endRun(run));
    await playProperty(ctx, canvas, run, Math.random, () => hud.update(run));
    hud.remove();
    await playSiteWalk(ctx, run);
    const result = resultOf(run);
    results.push(result);
    await showWalkCard(overlay, property, result, index === PROPERTIES.length - 1);
  }
  return summarizeRound(results);
}

async function main(): Promise<void> {
  await showTitle(overlay);
  for (;;) {
    const summary = await playRound();
    await showResults(overlay, summary, {
      demoUrl: withUtm(config.demoUrl),
      showLeadForm: false,
      onShare: async () => 'cancelled',
      onSubmitLead: async () => false,
    });
  }
}

main().catch(() => showFatal(overlay));
```

- [ ] **Step 9: Run the tests, typecheck and build**

Run: `yarn test && yarn build`
Expected: all tests pass and the build succeeds.

- [ ] **Step 10: Play it in a browser**

Run: `yarn dev`. If port 5173 is taken, Vite prints the port it picked instead. Open the printed Local URL, and on a phone on the same Wi-Fi, open the printed Network URL.

Check each of these:
- The title screen shows, and Start opens the Office Park heads-up with the board visible above the panel.
- Both crew buttons work.
- Dragging moves the mower, leaves stripes on mowed turf, and the page does not scroll.
- The ride-on crew can't enter the dotted narrow strips at the Hospital.
- Weeds appear on beds, tapping one removes it, and the mower pauses for about a second.
- The clock turns red after 6.0h, and the property auto-ends at 9.0h.
- Done ends the property early.
- The site walk drops flags on missed turf and weeds, then the walk card shows the stars.
- After the Hospital, the results screen shows the title, stars, summary line, 8–10% line, Book a demo (opens `bomdata.io/contact/?utm_…` in a new tab) and Play again.
- Play again starts a new round at Office Park.

Stop the dev server when you're done.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: add screens, styles and full game flow"
```

---

### Task 9: Share card and sharing

**Files:**
- Create: `src/share/card.ts`
- Replace: `src/share/share.ts` (the minimal version from Task 8)
- Modify: `src/main.ts` (wire up sharing and add the `?og` preview-image mode)

**Interfaces:**
- Consumes: `RoundSummary`, `starString`, `formatPoints`, `shareText`, `formatHours`, `config`, `linkedInShareUrl`
- Produces:
  - `CARD_WIDTH = 1200`, `CARD_HEIGHT = 627`
  - `renderCardBlob(summary: RoundSummary): Promise<Blob>`
  - `type ShareOutcome = 'shared' | 'downloaded' | 'cancelled'`
  - `shareResult(blob: Blob, summary: RoundSummary): Promise<ShareOutcome>`
  - `downloadBlob(blob: Blob, filename: string): void`

These modules use only browser APIs (canvas, fonts, `navigator.share`). The text they render is already covered by `text.test.ts`, so this task has no new unit tests and is verified in the browser.

- [ ] **Step 1: Implement `src/share/card.ts`**

```ts
import { formatHours } from '../rules/clock';
import type { RoundSummary } from '../rules/scoring';
import { formatPoints, starString } from './text';

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 627;

const INK = '#1d2b36';
const BRAND = '#127DB9';
const CENTER = CARD_WIDTH / 2 - 6;

function drawCard(ctx: CanvasRenderingContext2D, summary: RoundSummary): void {
  const stripe = 48;
  for (let y = 0; y < CARD_HEIGHT; y += stripe) {
    ctx.fillStyle = (y / stripe) % 2 === 0 ? '#7cc36b' : '#6ab85a';
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
  ctx.fillStyle = INK;
  ctx.font = '44px "Press Start 2P"';
  ctx.fillText('MARGIN MOWER', CENTER, 150);

  ctx.fillStyle = BRAND;
  ctx.font = '28px "Press Start 2P"';
  ctx.fillText(summary.title.toUpperCase(), CENTER, 215);

  ctx.fillStyle = '#e0a800';
  ctx.font = '72px "DM Sans", sans-serif';
  ctx.fillText(starString(summary.stars, summary.maxStars), CENTER, 310);

  ctx.fillStyle = INK;
  ctx.font = '24px "Press Start 2P"';
  ctx.fillText(
    `${formatPoints(summary.points)} PTS | ${formatHours(summary.hoursSaved)} HRS SAVED`,
    CENTER,
    400,
  );

  ctx.font = 'bold 32px "DM Sans", sans-serif';
  ctx.fillText('Can you mow on budget?', CENTER, 470);

  ctx.fillStyle = BRAND;
  ctx.font = '26px "DM Sans", sans-serif';
  ctx.fillText('bomdata.io/margin-mower', CENTER, 515);
}

export async function renderCardBlob(summary: RoundSummary): Promise<Blob> {
  await Promise.all([
    document.fonts.load('44px "Press Start 2P"'),
    document.fonts.load('bold 32px "DM Sans"'),
  ]);
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
```

- [ ] **Step 2: Replace `src/share/share.ts`**

```ts
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
      // Any other failure (for example, sharing blocked inside the iframe) falls through to download.
    }
  }
  downloadBlob(blob, FILE_NAME);
  window.open(linkedInShareUrl(config.pageUrl), '_blank', 'noopener');
  return 'downloaded';
}
```

- [ ] **Step 3: Wire sharing and `?og` mode into `src/main.ts`**

Add these imports:
```ts
import { renderCardBlob } from './share/card';
import { downloadBlob, shareResult } from './share/share';
```

Add this constant after the imports:
```ts
const SAMPLE_SUMMARY: RoundSummary = { stars: 7, maxStars: 9, points: 4820, hoursSaved: 1.4, title: 'Pro' };
```

Replace `main` with:
```ts
async function main(): Promise<void> {
  if (new URLSearchParams(window.location.search).has('og')) {
    downloadBlob(await renderCardBlob(SAMPLE_SUMMARY), 'margin-mower-og.png');
    return;
  }
  await showTitle(overlay);
  for (;;) {
    const summary = await playRound();
    await showResults(overlay, summary, {
      demoUrl: withUtm(config.demoUrl),
      showLeadForm: false,
      onShare: async () => shareResult(await renderCardBlob(summary), summary),
      onSubmitLead: async () => false,
    });
  }
}
```

- [ ] **Step 4: Typecheck, test and build**

Run: `yarn test && yarn build`
Expected: everything passes.

- [ ] **Step 5: Verify in the browser**

Run `yarn dev`, then check:
- **Desktop Chrome:** finish a round and tap Share my score. Either the system share sheet opens, or a PNG downloads and a LinkedIn share tab opens. The PNG is 1200×627, uses the pixel font, and shows the stars, points, hours saved and `bomdata.io/margin-mower`, but **not** the 8–10% line.
- **`?og`:** open `<dev url>/?og`. `margin-mower-og.png` downloads, and you keep it for the WordPress social image in Task 11.
- **Phone on the same Wi-Fi:** tapping Share opens the native share sheet with the image attached, and LinkedIn appears as a target.

Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add shareable score card with native share and LinkedIn fallback"
```

---

### Task 10: HubSpot lead form

**Files:**
- Replace: `src/hubspot.ts` (extends the minimal version from Task 8)
- Modify: `src/main.ts`
- Test: `src/hubspot.test.ts`

**Interfaces:**
- Consumes: `RoundSummary`, `config`
- Produces:
  - `interface LeadFields { firstName: string; company: string; email: string }`
  - `interface HubSpotTarget { portalId: string; formGuid: string }`
  - `interface PageContext { pageUri: string; pageName: string }`
  - `interface HubSpotSubmission { fields: { objectTypeId: string; name: string; value: string }[]; context: PageContext }`
  - `hubspotEnabled(target: HubSpotTarget): boolean`
  - `isValidEmail(email: string): boolean`
  - `buildSubmission(lead: LeadFields, summary: RoundSummary, page: PageContext): HubSpotSubmission`
  - `submissionUrl(target: HubSpotTarget): string`
  - `submitLead(target: HubSpotTarget, submission: HubSpotSubmission, fetchFn?: typeof fetch): Promise<boolean>`

- [ ] **Step 1: Write the failing tests**

`src/hubspot.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
import {
  buildSubmission,
  hubspotEnabled,
  isValidEmail,
  submissionUrl,
  submitLead,
  type HubSpotSubmission,
} from './hubspot';
import type { RoundSummary } from './rules/scoring';

const target = { portalId: '123', formGuid: 'abc-def' };
const summary: RoundSummary = { stars: 7, maxStars: 9, points: 4820, hoursSaved: 1.4, title: 'Pro' };
const page = { pageUri: 'https://bomdata.io/margin-mower/', pageName: 'Margin Mower' };

describe('hubspotEnabled', () => {
  it('needs both a portal ID and a form GUID', () => {
    expect(hubspotEnabled(target)).toBe(true);
    expect(hubspotEnabled({ portalId: '', formGuid: 'abc' })).toBe(false);
    expect(hubspotEnabled({ portalId: '123', formGuid: '  ' })).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('accepts normal addresses and rejects junk', () => {
    expect(isValidEmail('pat@greenco.com')).toBe(true);
    expect(isValidEmail('  pat@greenco.com ')).toBe(true);
    expect(isValidEmail('pat@greenco')).toBe(false);
    expect(isValidEmail('not an email')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('buildSubmission', () => {
  it('maps lead fields and score to HubSpot contact fields', () => {
    const submission = buildSubmission(
      { firstName: ' Pat ', company: 'GreenCo', email: 'pat@greenco.com ' },
      summary,
      page,
    );
    expect(submission).toEqual({
      fields: [
        { objectTypeId: '0-1', name: 'firstname', value: 'Pat' },
        { objectTypeId: '0-1', name: 'company', value: 'GreenCo' },
        { objectTypeId: '0-1', name: 'email', value: 'pat@greenco.com' },
        { objectTypeId: '0-1', name: 'margin_mower_score', value: '4820' },
        { objectTypeId: '0-1', name: 'margin_mower_stars', value: '7' },
      ],
      context: page,
    });
  });
});

describe('submitLead', () => {
  const submission: HubSpotSubmission = buildSubmission(
    { firstName: 'Pat', company: 'GreenCo', email: 'pat@greenco.com' },
    summary,
    page,
  );

  it('posts JSON to the HubSpot forms endpoint', async () => {
    const fetchFn = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(null, { status: 200 }));
    await expect(submitLead(target, submission, fetchFn)).resolves.toBe(true);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('https://api.hsforms.com/submissions/v3/integration/submit/123/abc-def');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual(submission);
  });

  it('returns false on an error status', async () => {
    const fetchFn = vi.fn(async () => new Response(null, { status: 400 }));
    await expect(submitLead(target, submission, fetchFn)).resolves.toBe(false);
  });

  it('returns false when the network fails', async () => {
    const fetchFn = vi.fn(async () => {
      throw new TypeError('offline');
    });
    await expect(submitLead(target, submission, fetchFn)).resolves.toBe(false);
  });
});

describe('submissionUrl', () => {
  it('encodes the IDs', () => {
    expect(submissionUrl({ portalId: '1 2', formGuid: 'a/b' })).toBe(
      'https://api.hsforms.com/submissions/v3/integration/submit/1%202/a%2Fb',
    );
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn test src/hubspot.test.ts`
Expected: FAIL because `buildSubmission` and the other new exports don't exist yet.

- [ ] **Step 3: Replace `src/hubspot.ts`**

```ts
import type { RoundSummary } from './rules/scoring';

export interface LeadFields {
  firstName: string;
  company: string;
  email: string;
}

export interface HubSpotTarget {
  portalId: string;
  formGuid: string;
}

export interface PageContext {
  pageUri: string;
  pageName: string;
}

export interface HubSpotSubmission {
  fields: { objectTypeId: string; name: string; value: string }[];
  context: PageContext;
}

const CONTACT_OBJECT_TYPE = '0-1';

export function hubspotEnabled(target: HubSpotTarget): boolean {
  return target.portalId.trim() !== '' && target.formGuid.trim() !== '';
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function buildSubmission(lead: LeadFields, summary: RoundSummary, page: PageContext): HubSpotSubmission {
  const field = (name: string, value: string) => ({ objectTypeId: CONTACT_OBJECT_TYPE, name, value });
  return {
    fields: [
      field('firstname', lead.firstName.trim()),
      field('company', lead.company.trim()),
      field('email', lead.email.trim()),
      field('margin_mower_score', String(summary.points)),
      field('margin_mower_stars', String(summary.stars)),
    ],
    context: page,
  };
}

export function submissionUrl(target: HubSpotTarget): string {
  return `https://api.hsforms.com/submissions/v3/integration/submit/${encodeURIComponent(target.portalId)}/${encodeURIComponent(target.formGuid)}`;
}

export async function submitLead(
  target: HubSpotTarget,
  submission: HubSpotSubmission,
  fetchFn: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const response = await fetchFn(submissionUrl(target), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
    return response.ok;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Wire the form into `src/main.ts`**

Add this import:
```ts
import { buildSubmission, hubspotEnabled, submitLead } from './hubspot';
```

Add this after `const ctx = setupCanvas(canvas);`:
```ts
const hubspotTarget = { portalId: config.hubspotPortalId, formGuid: config.hubspotFormGuid };
```

In `main`, replace the `showResults` call with:
```ts
    await showResults(overlay, summary, {
      demoUrl: withUtm(config.demoUrl),
      showLeadForm: hubspotEnabled(hubspotTarget),
      onShare: async () => shareResult(await renderCardBlob(summary), summary),
      onSubmitLead: (lead) =>
        submitLead(
          hubspotTarget,
          buildSubmission(lead, summary, { pageUri: config.pageUrl, pageName: 'Margin Mower' }),
        ),
    });
```

- [ ] **Step 5: Run the tests and build**

Run: `yarn test && yarn build`
Expected: everything passes.

- [ ] **Step 6: Check the form in the browser**

1. Temporarily set `hubspotPortalId: '1'` and `hubspotFormGuid: 'test'` in `src/config.ts` and run `yarn dev`.
2. Finish a round. The form appears.
3. Submit a bad email. You see "Please enter a valid email."
4. Submit a valid email. HubSpot rejects the fake IDs, so you see "Couldn't save, try again", and the button becomes clickable again.
5. **Revert `src/config.ts` to empty strings.**
6. Confirm the form is hidden again.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add optional HubSpot lead form"
```

---

### Task 11: Deploy workflow and README

**Files:**
- Create: `.github/workflows/deploy.yml`, `README.md`

**Interfaces:** none. The deliverable is a repo that deploys itself, plus written launch steps.

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: yarn
      - run: yarn install --frozen-lockfile
      - run: yarn test
      - run: yarn build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Create `README.md`**

````markdown
# Margin Mower

**Can you mow on budget?** This is a pixel-art mowing game from BomData, built to share on LinkedIn. It is hosted on GitHub Pages and embedded at https://bomdata.io/margin-mower/.

Design: `docs/superpowers/specs/2026-09-16-margin-mower-design.md`

## Develop

Requires Node 24 and yarn.

```sh
yarn          # install
yarn dev      # play locally; the "Network" URL works on your phone on the same Wi-Fi
yarn test     # rules and helper tests
yarn build    # typecheck and build to dist/
```

Open `/?og` on the dev server to download a sample score image to use as the social preview image.

## Publish to GitHub Pages (one time)

1. On github.com, create a new **public** repository named `margin-mower`. Leave it empty.
2. From this folder, push the code:
   ```sh
   git remote add origin https://github.com/<your-username>/margin-mower.git
   git push -u origin main
   ```
3. In the repository, open **Settings → Pages**. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Open the **Actions** tab and wait for **Deploy to GitHub Pages** to finish. The game is then live at `https://<your-username>.github.io/margin-mower/`.

Every later push to `main` re-runs the tests and redeploys.

## Add it to bomdata.io (WordPress)

1. In WordPress, go to **Pages → Add New** and give the page the title **Margin Mower**. Set the permalink slug to `margin-mower`.
2. Choose a full-width template with no sidebar. On Divi, that's **Page Attributes → Template → Blank Page**, or **Full Width** if you want to keep the site header.
3. Add a **Custom HTML** block containing:
   ```html
   <iframe
     src="https://<your-username>.github.io/margin-mower/"
     title="Margin Mower: Can you mow on budget?"
     allow="web-share; clipboard-write"
     style="display:block;width:100%;height:100vh;border:0;"
   ></iframe>
   ```
4. Set the page's social sharing image to `margin-mower-og.png` (from `/?og`). Use your SEO plugin's **Social** tab, or the page's featured image. Title: *Margin Mower: Can you mow on budget?*
5. Publish. Then paste `https://bomdata.io/margin-mower/` into the LinkedIn Post Inspector (https://www.linkedin.com/post-inspector/) to check the preview.

## HubSpot lead form (optional; the form stays hidden until this is done)

1. In HubSpot, go to **Settings → Properties → Contact properties** and create two **Number** properties:
   - `margin_mower_score` (label: Margin Mower score)
   - `margin_mower_stars` (label: Margin Mower stars)
2. Go to **Marketing → Forms** and create a form with the fields **First name**, **Company name** and **Email**. Add the two properties above as **hidden** fields, then publish the form.
3. Copy the portal ID and form ID from the form's **Share → Embed code**. They appear as `portalId` and `formId`.
4. Put them into `src/config.ts` as `hubspotPortalId` and `hubspotFormGuid`, then commit and push.

## Launch checklist

On each of these:
- iPhone Safari
- Android Chrome
- Desktop Chrome and Safari

check both `https://<your-username>.github.io/margin-mower/` and `https://bomdata.io/margin-mower/`:

- [ ] Dragging mows and never scrolls the page
- [ ] Weeds can be tapped, and the ride-on crew can't enter narrow strips
- [ ] All three properties, the site walks and the results screen appear
- [ ] Share opens the phone share sheet (or downloads the image and opens LinkedIn on desktop)
- [ ] A lead form submission appears in HubSpot with score and stars
- [ ] Book a demo opens `bomdata.io/contact/` with `utm_campaign=margin-mower`
- [ ] LinkedIn Post Inspector shows the preview image and title
````

- [ ] **Step 3: Verify the build one last time**

Run: `yarn test && yarn build`
Expected: everything passes.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: add GitHub Pages deploy workflow and launch README"
```

---

### Task 12: Playtest and tune (with the user)

**Files:**
- Modify (only if tuning is needed): `src/rules/crews.ts` (speeds), `src/rules/properties.ts` (weed rates, layouts), `src/rules/clock.ts` (`HOURS_PER_SECOND`)

The spec marks speeds, budgets and weed rates as starting values, so this task tunes them by playing.

- [ ] **Step 1: Play three full rounds on a phone** using `yarn dev` and the Network URL. For each property, record the stars, hours used and whether it felt fair.
- [ ] **Step 2: Compare against these targets.** A first-time player should get 3–5 stars. A player who picks the recommended crews and plans their route should be able to reach 9. The Office Park should be comfortably finishable with the ride-on crew, and the Hospital should be tight with the push crew.
- [ ] **Step 3: If a target is missed, change one number at a time**, re-run `yarn test`, and replay. A property test failing after a layout change means the layout broke reachability, so fix the layout. Change the property test only when the user agrees the intended design has changed.
- [ ] **Step 4: Commit the tuning**

```bash
git add -A
git commit -m "tune: adjust speeds and weed rates after playtest"
```

- [ ] **Step 5: Hand off to the user.** Point them to the README's "Publish to GitHub Pages", "Add it to bomdata.io" and "HubSpot lead form" sections. Pushing to GitHub, publishing the WordPress page and creating the HubSpot form are the user's actions, or need their explicit go-ahead.
