# Margin Mower Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Margin Mower as a real TypeScript app. It's a style-B cartoon side-scrolling mowing game with two properties, a share card, an optional HubSpot lead form and a Book a demo link. It's deployed to GitHub Pages and embedded at `bomdata.io/margin-mower`.

**Architecture:**
- **Game rules** (`src/rules/`) are pure TypeScript and unit-tested, including scripted playthroughs of both levels.
- **Drawing** (`src/render/`) is a Canvas 2D port of the approved prototype's style B art, drawn in 480×270 world units and scaled to device pixels.
- **Screens** are DOM panels over the canvas, and `src/main.ts` runs title → (intro → play → property card) × 2 → results.

**Tech Stack:** TypeScript, Vite, Vitest, yarn (classic), Canvas 2D, GitHub Actions + GitHub Pages, HubSpot Forms Submission API v3, Google Fonts (Press Start 2P, DM Sans).

**Spec:** `docs/superpowers/specs/2026-09-16-margin-mower-design.md`
**Look-and-feel reference:** `prototype/margin-mower-runner.html`, `prototype/sprites.js` and `prototype/sprite-gallery.html` (style B).

**Provenance:** Every file in this plan was written and checked in a scratch copy of this project before the plan was saved:
- `tsc --noEmit` is clean with TypeScript 7.0.2.
- All 91 Vitest tests pass.
- `vite build` succeeds (33 KB of JS).
- Headless-Chrome screenshots of both levels match the prototype.

Copy the code exactly. If a step's command produces something different from what the step expects, stop and investigate. Don't edit the tests to make them pass.

## Global Constraints

- Node v24. Use `yarn` for every package operation.
- No `as` type casts of any kind: no `as any`, and no `as const`. Narrow types with type guards (`instanceof`, `=== undefined`, `=== null`).
- No runtime dependencies. Dev dependencies are only `typescript`, `vite` and `vitest`.
- Vite `base: './'`.
- All numbers, level strings, copy text and colors are exactly as written below. They come from the approved prototype and spec.
- The results screen shows "Real crews using BomData improved labor efficiency 8–10%." This line must never appear in the share image or share text.
- HubSpot failures show "Couldn't save, try again", and the game never waits on HubSpot.
- Out of scope: leaderboard, sound, art styles A and C, more than two properties, analytics, accounts.

## File Map

| File | Responsibility |
|---|---|
| `package.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore`, `index.html` | Project setup and page shell (HUD, canvas, control buttons, overlay) |
| `src/config.ts` | URLs, HubSpot IDs, UTM and LinkedIn link builders |
| `src/rules/constants.ts` | World size, physics, budget and branch geometry |
| `src/rules/crews.ts` | Ride-on and push crew stats |
| `src/rules/levels.ts` | Level strings, the obstacle table, `parseLevel`, `PROPERTIES` |
| `src/rules/run.ts` | Run state; hop, duck and pull; `tickRun` (movement, mowing, collisions, weeds, effects); `resultOf` |
| `src/rules/scoring.ts` | Efficiency and quality stars, points, hours saved, titles, round summary |
| `src/rules/playthrough.test.ts` | Scripted players prove each level can be finished perfectly and can't be failed |
| `src/render/draw.ts` | Canvas helpers bound to one context |
| `src/render/canvas.ts` | Fitting the canvas to the window at device resolution |
| `src/render/sprites.ts` | Style B crews, obstacles, weeds and branch |
| `src/render/scenery.ts` | Sky, clouds, office and house backdrops, sidewalk and street, lawn |
| `src/render/scene.ts` | Full frame: scenery, actors, hints, effects, finish flag, progress bar |
| `src/game/input.ts` | Keyboard, on-screen buttons and canvas tap |
| `src/game/loop.ts` | Animation loop for one property |
| `src/share/text.ts` | Stars, number formatting, summary and share text |
| `src/share/card.ts` | 1200×627 score image |
| `src/share/share.ts` | Native share, or download plus LinkedIn link |
| `src/hubspot.ts` | Lead validation, payload, submission |
| `src/screens/dom.ts` | DOM helpers and the panel lifecycle |
| `src/screens/panels.ts` | Title, property intro, property card, fatal error |
| `src/screens/hud.ts` | HUD text and show/hide |
| `src/screens/results.ts` | Scorecard with demo, share and lead form |
| `src/style.css` | All styles |
| `src/main.ts` | Wires the game flow together |
| `dev/peek.html` | Dev-only still-frame viewer (not built) |
| `.github/workflows/deploy.yml` | Test, build and deploy to Pages |
| `README.md` | Develop, deploy, WordPress, HubSpot and launch checklist |

All commands run from the repo root (`margin-mower/`). The repo already contains `docs/` and `prototype/`.

---

### Task 1: Project scaffold and config

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore`, `index.html`, `src/style.css`, `src/main.ts`, `src/config.ts`
- Test: `src/config.test.ts`

**Interfaces:**
- Produces:
  - `config: { pageUrl; demoUrl; siteUrl; hubspotPortalId; hubspotFormGuid }` (all `string`)
  - `withUtm(url: string): string`
  - `linkedInShareUrl(pageUrl: string): string`
  - `index.html` element ids: `hud`, `hud-name`, `hud-clock`, `hud-cut`, `board`, `controls`, `hop-button`, `duck-button`, `overlay`

- [ ] **Step 1: Create the project files**

`package.json`:
```json
{
  "name": "margin-mower",
  "private": true,
  "version": "1.0.0",
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
      <div id="hud" hidden>
        <span id="hud-name"></span><span id="hud-clock"></span><span id="hud-cut"></span>
      </div>
      <canvas id="board"></canvas>
      <div id="controls" hidden>
        <button id="hop-button" type="button">⬆ HOP<small>↑ / Space / tap game</small></button>
        <button id="duck-button" type="button">⬇ DUCK · PULL<small>↓ key (hold to duck)</small></button>
      </div>
      <div id="overlay"></div>
    </div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`src/style.css` (placeholder; Task 9 replaces it):
```css
body { margin: 0; background: #23272f; }
```

`src/main.ts` (placeholder; Task 9 replaces it):
```ts
import './style.css';

const overlay = document.getElementById('overlay');
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

  it('adds campaign UTM tags and keeps existing params', () => {
    const url = new URL(withUtm('https://bomdata.io/contact/?ref=x'));
    expect(url.pathname).toBe('/contact/');
    expect(url.searchParams.get('ref')).toBe('x');
    expect(url.searchParams.get('utm_source')).toBe('linkedin');
    expect(url.searchParams.get('utm_medium')).toBe('game');
    expect(url.searchParams.get('utm_campaign')).toBe('margin-mower');
  });

  it('builds a LinkedIn share link for the page', () => {
    expect(linkedInShareUrl('https://bomdata.io/margin-mower/')).toBe(
      'https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fbomdata.io%2Fmargin-mower%2F',
    );
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `yarn test`
Expected: FAIL because `./config` cannot be resolved.

- [ ] **Step 4: Implement `src/config.ts`**

```ts
export const config = {
  pageUrl: 'https://bomdata.io/margin-mower/',
  demoUrl: 'https://bomdata.io/contact/',
  siteUrl: 'https://bomdata.io/',
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

- [ ] **Step 5: Verify**

Run: `yarn test && yarn build`
Expected: 3 tests pass, `tsc` is clean, and `dist/index.html` exists.

- [ ] **Step 6: Commit**

```bash
git add package.json yarn.lock tsconfig.json vite.config.ts .gitignore index.html src
git commit -m "chore: scaffold Vite + TypeScript project with config"
```

---

### Task 2: Constants, crews and levels

**Files:**
- Create: `src/rules/constants.ts`, `src/rules/crews.ts`, `src/rules/levels.ts`
- Test: `src/rules/levels.test.ts`

**Interfaces:**
- Produces:
  - From `constants.ts`: `WORLD_WIDTH`, `WORLD_HEIGHT`, `COL`, `GROUND`, `LAWN_TOP`, `LAWN_BOTTOM`, `MOWER_SCREEN_X`, `GRAVITY`, `HOP_VELOCITY`, `CREW_HALF_WIDTH`, `WEED_REACH`, `STALL_SECONDS`, `SLACK_SECONDS`, `BUDGET_HOURS`, `START_DIST`, `END_PADDING`, `MAX_FRAME_SECONDS`, `BRANCH_TOP`, `BRANCH_BOTTOM`, `BRANCH_WIDTH`
  - From `crews.ts`:
    - `type CrewId = 'rideOn' | 'push'`
    - `interface Crew { id; label; speed; canDuck; height; duckHeight }`
    - `CREWS: Record<CrewId, Crew>`
  - From `levels.ts`:
    - `HopKind`, `ObstacleKind`, `ColumnKind`
    - `interface Obstacle { kind; col; span; x; left; right; top; bottom; hit }`
    - `interface Weed { col; x; pulled; missed }`
    - `interface Level { columns; mowable; obstacles; weeds; lengthPx }`
    - `interface Property { id; name; shortName; crew; backdrop; tip; level }`
    - `parseLevel(level: string): Level`
    - `PROPERTIES: readonly Property[]`

- [ ] **Step 1: Write the failing tests**

`src/rules/levels.test.ts`:
```ts
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
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test src/rules/levels.test.ts`
Expected: FAIL because the modules are not found.

- [ ] **Step 3: Implement the three modules**

`src/rules/constants.ts`:
```ts
// World units. The canvas is WORLD_WIDTH x WORLD_HEIGHT logical units.
export const WORLD_WIDTH = 480;
export const WORLD_HEIGHT = 270;
export const COL = 24;
export const GROUND = 196;
export const LAWN_TOP = 160;
export const LAWN_BOTTOM = 216;
export const MOWER_SCREEN_X = 130;

export const GRAVITY = 930;
export const HOP_VELOCITY = 300;
export const CREW_HALF_WIDTH = 10;
export const WEED_REACH = 33;
export const STALL_SECONDS = 1;
export const SLACK_SECONDS = 1.5;
export const BUDGET_HOURS = 6;
export const START_DIST = 12;
export const END_PADDING = 36;
export const MAX_FRAME_SECONDS = 0.05;

export const BRANCH_TOP = 96;
export const BRANCH_BOTTOM = GROUND - 38;
export const BRANCH_WIDTH = 33;
```

`src/rules/crews.ts`:
```ts
export type CrewId = 'rideOn' | 'push';

export interface Crew {
  id: CrewId;
  label: string;
  speed: number;
  canDuck: boolean;
  height: number;
  duckHeight: number;
}

export const CREWS: Record<CrewId, Crew> = {
  rideOn: { id: 'rideOn', label: 'Ride-on crew', speed: 165, canDuck: false, height: 44, duckHeight: 44 },
  push: { id: 'push', label: 'Push crew', speed: 128, canDuck: true, height: 43, duckHeight: 34 },
};
```

`src/rules/levels.ts`:
```ts
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

export interface Property {
  id: 'northValley' | 'oakCreek';
  name: string;
  shortName: string;
  crew: CrewId;
  backdrop: 'office' | 'hoa';
  // `**text**` marks the bold crew name.
  tip: string;
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
    tip: 'Wide open turf, no trees. BomData matched a **ride-on crew** to this site so you can move fast.',
    level:
      '..........__s__........__r__......bwbb......__c__.........__s__....__D__........bbwb.....__s__..__r__.........__c__......bwbbwb.......__r__..........',
  },
  {
    id: 'oakCreek',
    name: 'Oak Creek HOA',
    shortName: 'Oak Creek',
    crew: 'push',
    backdrop: 'hoa',
    tip: 'Low branches, weedy beds, and neighbors out for a walk. BomData matched a **push crew** that can duck under trees and get into the beds.',
    level:
      '........_r_......BB.....bwbwb...._h_....BB.._L_.....bwbbw...BBB...._h_..bwb...._h_...BB..._r_....bbwbwb....BB.._h_........',
  },
];
```

- [ ] **Step 4: Verify**

Run: `yarn test src/rules/levels.test.ts && yarn typecheck`
Expected: 10 tests pass and there are no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/rules
git commit -m "feat: add world constants, crews and level parsing"
```

---

### Task 3: Scoring

**Files:**
- Create: `src/rules/scoring.ts`
- Test: `src/rules/scoring.test.ts`

**Interfaces:**
- Produces:
  - `interface PropertyInput { hoursUsed; budgetHours; mowedColumns; mowableColumns; weedsPulled; weedCount; hits }`
  - `interface PropertyScore extends PropertyInput { efficiency; efficiencyStars; cut; cutStar; weedStar; stars; points; hoursSaved }`
  - `MAX_STARS_PER_PROPERTY = 5`
  - `efficiencyPercent(hoursUsed, budgetHours): number`
  - `efficiencyStars(percent): number`
  - `scoreProperty(input): PropertyScore`
  - `type Title`
  - `titleFor(stars): Title`
  - `interface RoundSummary { stars; maxStars; efficiency; points; hoursSaved; title }`
  - `summarizeRound(scores): RoundSummary`

Scoring comes before the run state because `run.ts` imports the `PropertyInput` type from it.

- [ ] **Step 1: Write the failing tests**

`src/rules/scoring.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { efficiencyPercent, efficiencyStars, scoreProperty, summarizeRound, titleFor, type PropertyInput } from './scoring';

const perfect: PropertyInput = {
  hoursUsed: 5.6,
  budgetHours: 6,
  mowedColumns: 80,
  mowableColumns: 80,
  weedsPulled: 4,
  weedCount: 4,
  hits: 0,
};

describe('efficiency', () => {
  it.each([
    [5.6, 100],
    [6.2, 97],
    [6.3, 95],
    [7.4, 81],
    [7.5, 80],
    [8.5, 71],
    [8.6, 70],
  ])('%s hours of 6 is %i%%', (used, pct) => {
    expect(efficiencyPercent(used, 6)).toBe(pct);
  });

  it.each([
    [100, 3],
    [96, 3],
    [95, 2],
    [81, 2],
    [80, 1],
    [71, 1],
    [70, 0],
  ])('%i%% earns %i stars', (pct, stars) => {
    expect(efficiencyStars(pct)).toBe(stars);
  });
});

describe('scoreProperty', () => {
  it('gives 5 stars for a clean, weed-free, on-budget job', () => {
    const s = scoreProperty(perfect);
    expect(s).toMatchObject({ efficiency: 100, efficiencyStars: 3, cut: 100, cutStar: true, weedStar: true, stars: 5 });
  });

  it('needs every column for the cut star', () => {
    const s = scoreProperty({ ...perfect, mowedColumns: 79 });
    expect(s.cut).toBe(98);
    expect(s.cutStar).toBe(false);
    expect(s.stars).toBe(4);
  });

  it('needs every weed for the weed star', () => {
    expect(scoreProperty({ ...perfect, weedsPulled: 3 }).weedStar).toBe(false);
  });

  it('adds 10 points per tenth of an hour under budget when the cut is complete', () => {
    // 80*10 + 4*50 + 4 tenths * 10
    expect(scoreProperty(perfect).points).toBe(1040);
  });

  it('gives no under-budget bonus when grass was skipped', () => {
    // 79*10 + 4*50
    expect(scoreProperty({ ...perfect, mowedColumns: 79 }).points).toBe(990);
  });

  it('subtracts 10 points per whole tenth of an hour over budget', () => {
    // 800 + 200 - 3 tenths * 10
    expect(scoreProperty({ ...perfect, hoursUsed: 6.35 }).points).toBe(970);
  });

  it('counts hours saved only for on-budget jobs with both quality stars', () => {
    expect(scoreProperty(perfect).hoursSaved).toBeCloseTo(0.4);
    expect(scoreProperty({ ...perfect, weedsPulled: 3 }).hoursSaved).toBe(0);
    expect(scoreProperty({ ...perfect, mowedColumns: 79 }).hoursSaved).toBe(0);
    expect(scoreProperty({ ...perfect, hoursUsed: 6.5 }).hoursSaved).toBe(0);
  });

  it('always gives an idle full-cut run at least one star', () => {
    const s = scoreProperty({ ...perfect, hoursUsed: 11, weedsPulled: 0 });
    expect(s.efficiencyStars).toBe(0);
    expect(s.stars).toBe(1);
  });
});

describe('titles and rounds', () => {
  it.each([
    [0, 'Rookie'],
    [4, 'Rookie'],
    [5, 'Crew Lead'],
    [7, 'Crew Lead'],
    [8, 'Pro'],
    [9, 'Pro'],
    [10, 'Margin Master'],
  ])('%i stars is %s', (stars, title) => {
    expect(titleFor(stars)).toBe(title);
  });

  it('totals a round', () => {
    const a = scoreProperty(perfect);
    const b = scoreProperty({ ...perfect, hoursUsed: 6.9, weedsPulled: 6, weedCount: 7 });
    const summary = summarizeRound([a, b]);
    expect(b.stars).toBe(3); // 87% -> 2 stars, cut star, no weed star
    expect(summary).toEqual({
      stars: 8,
      maxStars: 10,
      efficiency: 96, // 12 / 12.5
      points: 1040 + (800 + 300 - 90),
      hoursSaved: 0.4,
      title: 'Pro',
    });
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test src/rules/scoring.test.ts`
Expected: FAIL because the module is not found.

- [ ] **Step 3: Implement `src/rules/scoring.ts`**

```ts
const EPSILON = 1e-9;

export interface PropertyInput {
  hoursUsed: number;
  budgetHours: number;
  mowedColumns: number;
  mowableColumns: number;
  weedsPulled: number;
  weedCount: number;
  hits: number;
}

export interface PropertyScore extends PropertyInput {
  efficiency: number;
  efficiencyStars: number;
  cut: number;
  cutStar: boolean;
  weedStar: boolean;
  stars: number;
  points: number;
  hoursSaved: number;
}

export const MAX_STARS_PER_PROPERTY = 5;

export function efficiencyPercent(hoursUsed: number, budgetHours: number): number {
  if (hoursUsed <= 0) return 100;
  return Math.round(Math.min(1, budgetHours / hoursUsed) * 100);
}

export function efficiencyStars(percent: number): number {
  if (percent > 95) return 3;
  if (percent > 80) return 2;
  if (percent > 70) return 1;
  return 0;
}

const tenths = (hours: number) => Math.floor(hours * 10 + EPSILON);

export function scoreProperty(input: PropertyInput): PropertyScore {
  const efficiency = efficiencyPercent(input.hoursUsed, input.budgetHours);
  const effStars = efficiencyStars(efficiency);
  const cut = input.mowableColumns === 0 ? 100 : Math.floor((input.mowedColumns / input.mowableColumns) * 100);
  const cutStar = cut === 100;
  const weedStar = input.weedsPulled === input.weedCount;
  const onBudget = input.hoursUsed <= input.budgetHours + EPSILON;

  let points = input.mowedColumns * 10 + input.weedsPulled * 50;
  if (onBudget) {
    if (cutStar) points += tenths(input.budgetHours - input.hoursUsed) * 10;
  } else {
    points -= tenths(input.hoursUsed - input.budgetHours) * 10;
  }

  return {
    ...input,
    efficiency,
    efficiencyStars: effStars,
    cut,
    cutStar,
    weedStar,
    stars: effStars + (cutStar ? 1 : 0) + (weedStar ? 1 : 0),
    points,
    hoursSaved: onBudget && cutStar && weedStar ? input.budgetHours - input.hoursUsed : 0,
  };
}

export type Title = 'Rookie' | 'Crew Lead' | 'Pro' | 'Margin Master';

export function titleFor(stars: number): Title {
  if (stars >= 10) return 'Margin Master';
  if (stars >= 8) return 'Pro';
  if (stars >= 5) return 'Crew Lead';
  return 'Rookie';
}

export interface RoundSummary {
  stars: number;
  maxStars: number;
  efficiency: number;
  points: number;
  hoursSaved: number;
  title: Title;
}

export function summarizeRound(scores: readonly PropertyScore[]): RoundSummary {
  const sum = (pick: (s: PropertyScore) => number) => scores.reduce((total, s) => total + pick(s), 0);
  const stars = sum((s) => s.stars);
  return {
    stars,
    maxStars: scores.length * MAX_STARS_PER_PROPERTY,
    efficiency: efficiencyPercent(sum((s) => s.hoursUsed), sum((s) => s.budgetHours)),
    points: sum((s) => s.points),
    hoursSaved: Math.round(sum((s) => s.hoursSaved) * 10) / 10,
    title: titleFor(stars),
  };
}
```

- [ ] **Step 4: Verify**

Run: `yarn test src/rules/scoring.test.ts && yarn typecheck`
Expected: 30 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/rules
git commit -m "feat: add efficiency and quality scoring"
```

---

### Task 4: Run state (movement, hop, duck, pull, bumps)

**Files:**
- Create: `src/rules/run.ts`
- Test: `src/rules/run.test.ts`

**Interfaces:**
- Consumes: Tasks 2–3
- Produces:
  - `type Rng = () => number`
  - `interface Particle`, `interface FloatText`
  - `interface Run { property; crew; level; hoursPerSecond; mowed; mowableCount; dist; y; vy; ducking; duckHeld; stall; shake; elapsed; hits; particles; floats; ended }`
  - `createRun(property): Run`
  - `hoursUsed(run): number`
  - `isGrounded(run): boolean`
  - `cutPercent(run): number`
  - `hop(run): boolean`
  - `pressDuck(run, rng): boolean` (true when a weed was pulled)
  - `releaseDuck(run): void`
  - `tickRun(run, dt, rng): void`
  - `resultOf(run): PropertyInput`

- [ ] **Step 1: Write the failing tests**

`src/rules/run.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { BUDGET_HOURS, END_PADDING, HOP_VELOCITY, START_DIST, STALL_SECONDS } from './constants';
import type { CrewId } from './crews';
import type { Property } from './levels';
import { createRun, cutPercent, hop, hoursUsed, isGrounded, pressDuck, releaseDuck, resultOf, tickRun, type Run } from './run';

const noEffects = () => 0.99; // never spawns clippings; bursts still work
const step = 1 / 60;

function testProperty(level: string, crew: CrewId = 'push'): Property {
  return { id: 'oakCreek', name: 'Test', shortName: 'Test', crew, backdrop: 'hoa', tip: '**push crew**', level };
}

function advanceUntil(run: Run, done: (r: Run) => boolean, maxSeconds = 30): void {
  for (let t = 0; t < maxSeconds && !done(run); t += step) tickRun(run, step, noEffects);
}

describe('createRun', () => {
  it('starts on the ground with a 6-hour budget', () => {
    const run = createRun(testProperty('..........'));
    expect(run.dist).toBe(START_DIST);
    expect(isGrounded(run)).toBe(true);
    expect(run.mowableCount).toBe(10);
    // budget seconds = 240 / 128 + 1.5
    expect(run.hoursPerSecond).toBeCloseTo(BUDGET_HOURS / (240 / 128 + 1.5));
  });
});

describe('movement and mowing', () => {
  it('moves at crew speed and mows the column under the crew', () => {
    const run = createRun(testProperty('..........', 'rideOn'));
    tickRun(run, 0.1, noEffects);
    expect(run.dist).toBeCloseTo(START_DIST + 16.5);
    expect([...run.mowed]).toEqual([1]);
    expect(hoursUsed(run)).toBeCloseTo(0.1 * run.hoursPerSecond);
  });

  it('does not mow pads, walkways or beds', () => {
    const run = createRun(testProperty('_=b.'));
    advanceUntil(run, (r) => r.ended);
    expect([...run.mowed]).toEqual([3]);
  });

  it('ends once past the level plus padding', () => {
    const run = createRun(testProperty('....'));
    advanceUntil(run, (r) => r.ended);
    expect(run.ended).toBe(true);
    expect(run.dist).toBeGreaterThanOrEqual(4 * 24 + END_PADDING);
    const elapsed = run.elapsed;
    tickRun(run, 1, noEffects);
    expect(run.elapsed).toBe(elapsed);
  });
});

describe('hop', () => {
  it('launches from the ground and lands about 0.65s later', () => {
    const run = createRun(testProperty('.'.repeat(40)));
    expect(hop(run)).toBe(true);
    expect(run.vy).toBe(HOP_VELOCITY);
    expect(hop(run)).toBe(true); // still on the ground until the next tick
    tickRun(run, step, noEffects);
    expect(isGrounded(run)).toBe(false);
    expect(hop(run)).toBe(false);
    let air = step;
    while (!isGrounded(run)) {
      tickRun(run, step, noEffects);
      air += step;
    }
    expect(air).toBeGreaterThan(0.6);
    expect(air).toBeLessThan(0.7);
  });

  it('skips mowing while in the air', () => {
    const run = createRun(testProperty('.'.repeat(40)));
    hop(run);
    tickRun(run, 0.05, noEffects);
    expect(run.mowed.size).toBe(0);
    advanceUntil(run, isGrounded);
    tickRun(run, step, noEffects);
    expect(run.mowed.size).toBe(1);
    expect(cutPercent(run)).toBe(2);
  });

  it('is refused while stalled', () => {
    const run = createRun(testProperty('..r....'));
    advanceUntil(run, (r) => r.hits > 0);
    expect(run.stall).toBeGreaterThan(0);
    expect(hop(run)).toBe(false);
  });
});

describe('bumps', () => {
  it('stalls for 1 second while the clock keeps running', () => {
    const run = createRun(testProperty('..r......'));
    advanceUntil(run, (r) => r.hits > 0);
    expect(run.hits).toBe(1);
    expect(run.stall).toBe(STALL_SECONDS);
    expect(run.floats.some((f) => f.text.startsWith('+') && f.text.endsWith('h'))).toBe(true);
    const dist = run.dist;
    const elapsed = run.elapsed;
    tickRun(run, 0.5, noEffects);
    expect(run.dist).toBe(dist);
    expect(run.elapsed).toBeCloseTo(elapsed + 0.5);
  });

  it('counts each obstacle once', () => {
    const run = createRun(testProperty('..r......'));
    advanceUntil(run, (r) => r.ended);
    expect(run.hits).toBe(1);
  });

  it('clears a hop obstacle with a well-timed hop', () => {
    const run = createRun(testProperty('.....r.....'));
    advanceUntil(run, (r) => run.level.obstacles[0].x - r.dist < 40);
    hop(run);
    advanceUntil(run, (r) => r.ended);
    expect(run.hits).toBe(0);
  });

  it('says sorry to the neighbor', () => {
    const run = createRun(testProperty('..L....'));
    advanceUntil(run, (r) => r.hits > 0);
    expect(run.floats.map((f) => f.text)).toContain('Sorry, ma’am!');
  });

  it('hits a standing push crew under a branch, once per branch group', () => {
    const run = createRun(testProperty('...BBB....'));
    advanceUntil(run, (r) => r.ended);
    expect(run.hits).toBe(1);
  });

  it('lets a ducking push crew pass under a branch and keep mowing', () => {
    const run = createRun(testProperty('...BBB....'));
    pressDuck(run, noEffects);
    advanceUntil(run, (r) => r.ended);
    expect(run.hits).toBe(0);
    expect(run.mowed.size).toBe(10);
  });

  it('never ducks a ride-on crew', () => {
    const run = createRun(testProperty('...BBB....', 'rideOn'));
    pressDuck(run, noEffects);
    tickRun(run, step, noEffects);
    expect(run.ducking).toBe(false);
    advanceUntil(run, (r) => r.ended);
    expect(run.hits).toBe(1);
  });

  it('stops ducking on release', () => {
    const run = createRun(testProperty('..........'));
    pressDuck(run, noEffects);
    tickRun(run, step, noEffects);
    expect(run.ducking).toBe(true);
    releaseDuck(run);
    tickRun(run, step, noEffects);
    expect(run.ducking).toBe(false);
  });
});

describe('weeds', () => {
  it('only pulls a weed within reach', () => {
    const run = createRun(testProperty('..w......'));
    expect(pressDuck(run, noEffects)).toBe(false); // weed at x=60, crew at 12
    releaseDuck(run);
    advanceUntil(run, (r) => r.dist >= 30);
    expect(pressDuck(run, noEffects)).toBe(true);
    expect(run.level.weeds[0].pulled).toBe(true);
    expect(run.floats.map((f) => f.text)).toContain('+50');
    expect(pressDuck(run, noEffects)).toBe(false);
  });

  it('marks a weed missed once it is out of reach behind the crew', () => {
    const run = createRun(testProperty('..w......'));
    advanceUntil(run, (r) => r.dist > 60 + 33);
    expect(run.level.weeds[0].missed).toBe(true);
    expect(run.floats.map((f) => f.text)).toContain('missed');
    advanceUntil(run, (r) => r.ended);
    expect(pressDuck(run, noEffects)).toBe(false);
  });

  it('pulling does not stall the crew', () => {
    const run = createRun(testProperty('..w......'));
    advanceUntil(run, (r) => r.dist >= 40);
    pressDuck(run, noEffects);
    const dist = run.dist;
    tickRun(run, 0.1, noEffects);
    expect(run.dist).toBeCloseTo(dist + 12.8);
  });
});

describe('resultOf', () => {
  it('summarizes the run for scoring', () => {
    const run = createRun(testProperty('..w..r..'));
    advanceUntil(run, (r) => r.ended);
    const result = resultOf(run);
    expect(result).toMatchObject({ budgetHours: 6, mowedColumns: 6, mowableColumns: 6, weedsPulled: 0, weedCount: 1, hits: 1 });
    expect(result.hoursUsed).toBeCloseTo(hoursUsed(run));
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test src/rules/run.test.ts`
Expected: FAIL because the module is not found.

- [ ] **Step 3: Implement `src/rules/run.ts`**

```ts
import {
  BUDGET_HOURS,
  COL,
  CREW_HALF_WIDTH,
  END_PADDING,
  GRAVITY,
  GROUND,
  HOP_VELOCITY,
  SLACK_SECONDS,
  STALL_SECONDS,
  START_DIST,
  WEED_REACH,
} from './constants';
import { CREWS, type Crew } from './crews';
import { parseLevel, type Level, type Property } from './levels';
import type { PropertyInput } from './scoring';

export type Rng = () => number;

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface FloatText {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

export interface Run {
  property: Property;
  crew: Crew;
  level: Level;
  hoursPerSecond: number;
  mowed: Set<number>;
  mowableCount: number;
  dist: number;
  y: number;
  vy: number;
  ducking: boolean;
  duckHeld: boolean;
  stall: number;
  shake: number;
  elapsed: number;
  hits: number;
  particles: Particle[];
  floats: FloatText[];
  ended: boolean;
}

export function createRun(property: Property): Run {
  const crew = CREWS[property.crew];
  const level = parseLevel(property.level);
  const budgetSeconds = level.lengthPx / crew.speed + SLACK_SECONDS;
  return {
    property,
    crew,
    level,
    hoursPerSecond: BUDGET_HOURS / budgetSeconds,
    mowed: new Set(),
    mowableCount: level.mowable.filter(Boolean).length,
    dist: START_DIST,
    y: 0,
    vy: 0,
    ducking: false,
    duckHeld: false,
    stall: 0,
    shake: 0,
    elapsed: 0,
    hits: 0,
    particles: [],
    floats: [],
    ended: false,
  };
}

export const hoursUsed = (run: Run): number => run.elapsed * run.hoursPerSecond;
export const isGrounded = (run: Run): boolean => run.y === 0;
export const cutPercent = (run: Run): number =>
  run.mowableCount === 0 ? 100 : Math.floor((run.mowed.size / run.mowableCount) * 100);

function burst(run: Run, x: number, y: number, color: string, count: number, rng: Rng): void {
  for (let i = 0; i < count; i++) {
    run.particles.push({ x, y, vx: (rng() - 0.5) * 120, vy: -60 - rng() * 90, life: 0.5, color });
  }
}

export function hop(run: Run): boolean {
  if (run.ended || !isGrounded(run) || run.stall > 0) return false;
  run.vy = HOP_VELOCITY;
  run.ducking = false;
  return true;
}

// Pressing duck also pulls the nearest weed in reach. Returns true when a weed was pulled.
export function pressDuck(run: Run, rng: Rng): boolean {
  if (run.ended) return false;
  run.duckHeld = true;
  const weed = run.level.weeds.find((w) => !w.pulled && !w.missed && Math.abs(w.x - run.dist) <= WEED_REACH);
  if (weed === undefined) return false;
  weed.pulled = true;
  run.floats.push({ x: weed.x, y: GROUND - 30, text: '+50', life: 0.8, color: '#ffffff' });
  burst(run, weed.x, GROUND - 8, '#6d8f2a', 10, rng);
  return true;
}

export function releaseDuck(run: Run): void {
  run.duckHeld = false;
}

function collide(run: Run, rng: Rng): void {
  const height = run.ducking ? run.crew.duckHeight : run.crew.height;
  const left = run.dist - CREW_HALF_WIDTH;
  const right = run.dist + CREW_HALF_WIDTH;
  const bottom = GROUND - run.y;
  const top = bottom - height;
  for (const o of run.level.obstacles) {
    if (o.hit || right <= o.left || left >= o.right) continue;
    if (bottom <= o.top || top >= o.bottom) continue;
    o.hit = true;
    run.hits += 1;
    run.stall = STALL_SECONDS;
    run.shake = 0.25;
    run.floats.push({
      x: run.dist, y: GROUND - 50, text: `+${(STALL_SECONDS * run.hoursPerSecond).toFixed(1)}h`, life: 1, color: '#ff7a6b',
    });
    if (o.kind === 'neighbor') run.floats.push({ x: o.x, y: GROUND - 70, text: 'Sorry, ma’am!', life: 1.2, color: '#ffffff' });
    const branch = o.kind === 'branch';
    burst(run, o.x, branch ? o.bottom : o.top, branch ? '#3f8a3a' : '#9a9a9a', 12, rng);
  }
}

export function tickRun(run: Run, dt: number, rng: Rng): void {
  if (run.ended) return;
  run.elapsed += dt;
  run.shake = Math.max(0, run.shake - dt);

  if (!isGrounded(run) || run.vy > 0) {
    run.y += run.vy * dt;
    run.vy -= GRAVITY * dt;
    if (run.y <= 0) {
      run.y = 0;
      run.vy = 0;
    }
  }
  run.ducking = run.duckHeld && isGrounded(run) && run.crew.canDuck;

  if (run.stall > 0) run.stall = Math.max(0, run.stall - dt);
  else run.dist += run.crew.speed * dt;

  const col = Math.floor(run.dist / COL);
  const onGrass = isGrounded(run) && col < run.level.mowable.length && run.level.mowable[col] === true;
  if (onGrass) {
    run.mowed.add(col);
    if (run.stall <= 0 && rng() < 0.7) {
      run.particles.push({
        x: run.dist - 14, y: GROUND - 4, vx: -60 - rng() * 60, vy: -40 - rng() * 60, life: 0.35,
        color: rng() < 0.5 ? '#9be07a' : '#5da94e',
      });
    }
  }

  collide(run, rng);

  for (const w of run.level.weeds) {
    if (!w.pulled && !w.missed && run.dist - w.x > WEED_REACH) {
      w.missed = true;
      run.floats.push({ x: w.x, y: GROUND - 30, text: 'missed', life: 0.8, color: '#ffd0c8' });
    }
  }

  for (const p of run.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 450 * dt;
  }
  run.particles = run.particles.filter((p) => p.life > 0);
  for (const f of run.floats) {
    f.life -= dt;
    f.y -= 30 * dt;
  }
  run.floats = run.floats.filter((f) => f.life > 0);

  if (run.dist >= run.level.lengthPx + END_PADDING) run.ended = true;
}

export function resultOf(run: Run): PropertyInput {
  return {
    hoursUsed: hoursUsed(run),
    budgetHours: BUDGET_HOURS,
    mowedColumns: run.mowed.size,
    mowableColumns: run.mowableCount,
    weedsPulled: run.level.weeds.filter((w) => w.pulled).length,
    weedCount: run.level.weeds.length,
    hits: run.hits,
  };
}
```

- [ ] **Step 4: Verify**

Run: `yarn test src/rules/run.test.ts && yarn typecheck`
Expected: 19 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/rules
git commit -m "feat: add run state with hop, duck, weed pulling and bumps"
```

---

### Task 5: Level playthrough tests

**Files:**
- Test: `src/rules/playthrough.test.ts`

These tests prove the real levels are fair:
- A scripted player with good timing finishes each property with no bumps and 5/5 stars, across a timing window at least 20 units wide.
- A player who does nothing still finishes, with at least one star.

They should pass as soon as they're written. If one fails, a level or a constant has drifted from the approved prototype: fix the level or constant, not the test.

- [ ] **Step 1: Write the tests**

`src/rules/playthrough.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { PROPERTIES, type Property } from './levels';
import { createRun, hop, pressDuck, releaseDuck, resultOf, tickRun } from './run';
import { scoreProperty } from './scoring';

const rng = () => 0.5;
const step = 1 / 60;

// A scripted player: hops when the next hop obstacle is `lead` units ahead,
// ducks under branches, and pulls each weed as it passes.
function play(property: Property, lead: number | null) {
  const run = createRun(property);
  for (let i = 0; i < 60 * 120 && !run.ended; i++) {
    if (lead !== null) {
      const next = run.level.obstacles.find((o) => !o.hit && o.right > run.dist - 10);
      if (next !== undefined && next.kind !== 'branch' && next.x - run.dist > 0 && next.x - run.dist < lead) hop(run);
      if (next !== undefined && next.kind === 'branch' && next.left - run.dist < 30) run.duckHeld = true;
      else if (run.duckHeld) releaseDuck(run);
      const weed = run.level.weeds.find((w) => !w.pulled && !w.missed && Math.abs(w.x - run.dist) <= 6);
      if (weed !== undefined) {
        pressDuck(run, rng);
        if (property.crew === 'rideOn') releaseDuck(run);
      }
    }
    tickRun(run, step, rng);
  }
  return { run, score: scoreProperty(resultOf(run)) };
}

describe.each(PROPERTIES.map((p) => ({ name: p.name, property: p })))('$name', ({ property }) => {
  it('can be finished perfectly: no bumps and 5 stars', () => {
    const perfectLeads: number[] = [];
    for (let lead = 10; lead <= 110; lead += 2) {
      const { score } = play(property, lead);
      if (score.hits === 0 && score.stars === 5) perfectLeads.push(lead);
    }
    // A window of at least 20 units (several frames) keeps it humanly possible.
    expect(perfectLeads.length).toBeGreaterThanOrEqual(10);
  });

  it('is always finished, with at least one star, by a player who does nothing', () => {
    const { run, score } = play(property, null);
    expect(run.ended).toBe(true);
    expect(score.stars).toBeGreaterThanOrEqual(1);
    expect(score.hits).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run them**

Run: `yarn test src/rules/playthrough.test.ts`
Expected: 4 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/rules/playthrough.test.ts
git commit -m "test: prove both levels are finishable perfectly and never failable"
```

---

### Task 6: Rendering (canvas, helpers, style B sprites, scenery, scene)

**Files:**
- Create: `src/render/draw.ts`, `src/render/canvas.ts`, `src/render/sprites.ts`, `src/render/scenery.ts`, `src/render/scene.ts`, `dev/peek.html`
- Test: `src/render/canvas.test.ts`

**Interfaces:**
- Consumes: Tasks 2 and 4
- Produces:
  - From `draw.ts`: `OUTLINE`, `Point`, `useContext(ctx)`, `context()`, `rect`, `box`, `poly`, `ellipse`, `roundRect`, `line`, `cap`, `arcStroke`, `withAlpha`, `text`, `shade`, `hash`, `bob`
  - From `canvas.ts`: `MAX_SCALE`, `CanvasFit`, `canvasFit(availableWidth, availableHeight, devicePixelRatio)`, `setupCanvas(canvas, onResize): CanvasRenderingContext2D`
  - From `sprites.ts`: `CrewPose`, `drawCrew(id, x, base, pose)`, `drawObstacle(kind, x, base, hit)`, `drawWeed(x, base, missed)`, `drawBranchTrunk(x, span)`, `drawBranch(x, leafBottom, span)`
  - From `scenery.ts`: `drawSky()`, `drawClouds(cam)`, `drawBackdrop(kind, cam)`, `drawSidewalkAndStreet(cam)`, `drawLawn(level, mowed, cam)`
  - From `scene.ts`: `HintKey`, `SeenHints`, `updateHints(run, seen)`, `drawScene(run, seen, showHints?)`

The drawing code is a line-for-line port of style B in `prototype/sprites.js` and the scenery in `prototype/margin-mower-runner.html`. Only `canvasFit` has unit tests; the rest is checked visually in Step 6.

- [ ] **Step 1: Write the failing canvas test**

`src/render/canvas.test.ts`:
```ts
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test src/render/canvas.test.ts`
Expected: FAIL because the module is not found.

- [ ] **Step 3: Implement `draw.ts` and `canvas.ts`**

`src/render/draw.ts`:
```ts
// Small drawing helpers shared by sprites and scenery. Call useContext() once before drawing.
export const OUTLINE = '#1b1b24';

export type Point = readonly [number, number];
type Fill = string | CanvasGradient;

let current: CanvasRenderingContext2D | null = null;

export function useContext(ctx: CanvasRenderingContext2D): void {
  current = ctx;
}

export function context(): CanvasRenderingContext2D {
  if (current === null) throw new Error('Drawing context has not been set');
  return current;
}

export function rect(x: number, y: number, w: number, h: number, fill: Fill): void {
  const c = context();
  c.fillStyle = fill;
  c.fillRect(x, y, w, h);
}

export function box(x: number, y: number, w: number, h: number, fill: Fill, outline = OUTLINE): void {
  rect(x - 1, y - 1, w + 2, h + 2, outline);
  rect(x, y, w, h, fill);
}

function finish(fill: Fill | null, stroke: string | null, lineWidth: number): void {
  const c = context();
  if (fill !== null) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke !== null) {
    c.lineWidth = lineWidth;
    c.lineJoin = 'round';
    c.strokeStyle = stroke;
    c.stroke();
  }
}

export function poly(points: readonly Point[], fill: Fill | null, stroke: string | null = OUTLINE, lineWidth = 1): void {
  const c = context();
  c.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? c.moveTo(x, y) : c.lineTo(x, y)));
  c.closePath();
  finish(fill, stroke, lineWidth);
}

export function ellipse(x: number, y: number, rx: number, ry: number, fill: Fill | null, stroke: string | null = null, lineWidth = 1): void {
  const c = context();
  c.beginPath();
  c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
  finish(fill, stroke, lineWidth);
}

export function roundRect(x: number, y: number, w: number, h: number, r: number, fill: Fill | null, stroke: string | null = null, lineWidth = 1): void {
  const c = context();
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  finish(fill, stroke, lineWidth);
}

export function line(x1: number, y1: number, x2: number, y2: number, color: string, lineWidth = 1): void {
  const c = context();
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.lineCap = 'round';
  c.lineWidth = lineWidth;
  c.strokeStyle = color;
  c.stroke();
}

// Top half-disc (a cap) centered at (x, y).
export function cap(x: number, y: number, r: number, fill: string, stroke: string | null = OUTLINE, lineWidth = 2): void {
  const c = context();
  c.beginPath();
  c.arc(x, y, r, Math.PI, 0);
  c.closePath();
  finish(fill, stroke, lineWidth);
}

export function arcStroke(x: number, y: number, r: number, start: number, end: number, color = OUTLINE, lineWidth = 1): void {
  const c = context();
  c.beginPath();
  c.arc(x, y, r, start, end);
  c.lineWidth = lineWidth;
  c.strokeStyle = color;
  c.stroke();
}

export function withAlpha(alpha: number, draw: () => void): void {
  const c = context();
  c.globalAlpha = alpha;
  draw();
  c.globalAlpha = 1;
}

export function text(value: string, x: number, y: number, font: string, fill: string, align: CanvasTextAlign = 'center'): void {
  const c = context();
  c.font = font;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillStyle = fill;
  c.fillText(value, x, y);
}

// Lighten (amount > 0) or darken (amount < 0) a #rrggbb color.
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + (amount < 0 ? v * amount : (255 - v) * amount))));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

// Deterministic pseudo-random bits for scenery details.
export function hash(n: number): number {
  const h = Math.imul(n + 7, 374761393) >>> 0;
  return Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
}

// Small idle animation offset.
export const bob = (period: number, amount: number): number => Math.round(Math.sin(performance.now() / period) * amount);
```

`src/render/canvas.ts`:
```ts
import { WORLD_HEIGHT, WORLD_WIDTH } from '../rules/constants';

export const MAX_SCALE = 2.2;
const SIDE_GUTTER = 22;
const RESERVED_HEIGHT = 56 + 150; // HUD bar + control buttons

export interface CanvasFit {
  cssWidth: number;
  cssHeight: number;
  pixelWidth: number;
  pixelHeight: number;
  scale: number;
}

export function canvasFit(availableWidth: number, availableHeight: number, devicePixelRatio: number): CanvasFit {
  const fit = Math.max(0.1, Math.min(availableWidth / WORLD_WIDTH, availableHeight / WORLD_HEIGHT, MAX_SCALE));
  const pixelWidth = Math.round(WORLD_WIDTH * fit * devicePixelRatio);
  return {
    cssWidth: WORLD_WIDTH * fit,
    cssHeight: WORLD_HEIGHT * fit,
    pixelWidth,
    pixelHeight: Math.round(WORLD_HEIGHT * fit * devicePixelRatio),
    scale: pixelWidth / WORLD_WIDTH,
  };
}

// Sizes the canvas to the window at device resolution and keeps drawing in world units.
export function setupCanvas(canvas: HTMLCanvasElement, onResize: () => void): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error('Canvas 2D is not supported');
  const apply = () => {
    const fit = canvasFit(window.innerWidth - SIDE_GUTTER, window.innerHeight - RESERVED_HEIGHT, window.devicePixelRatio || 1);
    canvas.style.width = `${fit.cssWidth}px`;
    canvas.style.height = `${fit.cssHeight}px`;
    canvas.width = fit.pixelWidth;
    canvas.height = fit.pixelHeight;
    ctx.setTransform(fit.scale, 0, 0, fit.scale, 0, 0);
    onResize();
  };
  apply();
  window.addEventListener('resize', apply);
  return ctx;
}
```

- [ ] **Step 4: Implement the sprites, scenery and scene**

`src/render/sprites.ts`:
```ts
// Style B ("bold cartoon") sprites, ported from prototype/sprites.js.
// Every sprite is drawn with its ground contact at (x, base).
import { COL } from '../rules/constants';
import type { CrewId } from '../rules/crews';
import type { HopKind } from '../rules/levels';
import {
  OUTLINE as OL,
  arcStroke,
  bob,
  cap,
  context,
  ellipse,
  line,
  poly,
  rect,
  roundRect,
  text,
  withAlpha,
  type Point,
} from './draw';

const LW = 2;
const SKIN = '#f1c27d';
const DENIM = '#35507a';
const BOOT = '#5a3a20';
const TIRE = '#262626';
const HUB = '#cfcfcf';
const BARK = '#6b4423';

const shadow = (x: number, base: number, w: number) => ellipse(x, base + 1, w, 3.5, 'rgba(0,0,0,.28)');

export interface CrewPose {
  air?: number;
  duck?: boolean;
}

// ---------------------------------------------------------------- crews

function head(hx: number, hy: number, capColor: string): void {
  ellipse(hx, hy, 6.5, 6.5, SKIN, OL, LW);
  cap(hx, hy - 1, 6.8, capColor);
  poly([[hx + 2, hy - 1.5], [hx + 11, hy - 0.5], [hx + 11, hy + 1], [hx + 2, hy + 0.5]], capColor, OL, 1.5);
  rect(hx - 3, hy - 6, 3, 2, 'rgba(255,255,255,.45)');
  ellipse(hx + 3, hy + 2, 1.1, 1.3, OL);
  arcStroke(hx + 2.5, hy + 3.5, 2, 0.2, 1.3);
  ellipse(hx - 2.5, hy + 2, 1.5, 2, '#e3a86b');
}

function rideOn(x: number, base: number, { air = 0, duck = false }: CrewPose): void {
  const y = base - air;
  ellipse(x + 1, base + 1, 17 - Math.min(7, air / 7), 4, 'rgba(0,0,0,.3)');
  roundRect(x - 15, y - 9, 34, 6, 2, '#6d1e16', OL, LW);
  poly([[x - 14, y - 9], [x - 14, y - 18], [x - 2, y - 18], [x + 3, y - 23], [x + 17, y - 21], [x + 19, y - 13], [x + 18, y - 9]], '#e0402d', OL, LW);
  poly([[x + 4, y - 21], [x + 15, y - 19.5], [x + 16, y - 17], [x + 5, y - 18.5]], '#ff8a78', null);
  roundRect(x + 13, y - 16, 5, 3, 1, '#fff3b0', OL, 1);
  rect(x - 12, y - 16, 10, 2, '#ff8a78');
  roundRect(x - 14, y - 27, 11, 10, 3, '#2b2b2b', OL, LW);
  line(x + 1, y - 18, x + 4, y - 30, OL, 2);
  ellipse(x + 4, y - 30, 4, 1.5, '#444', OL, 1.5);
  const d = duck ? 6 : 0;
  roundRect(x - 12, y - 36 + d, 11, 14, 3, '#127DB9', OL, LW);
  rect(x - 11, y - 34 + d, 3, 10, 'rgba(255,255,255,.25)');
  line(x - 4, y - 31 + d, x + 3, y - 30, '#127DB9', 3.5);
  ellipse(x + 3.5, y - 30, 2, 2, SKIN, OL, 1);
  roundRect(x - 10, y - 24, 9, 6, 2, DENIM, OL, LW);
  head(x - 6, y - 43 + d, '#f5c542');
  ellipse(x - 9, y - 5, 7.5, 7.5, TIRE, OL, LW);
  ellipse(x - 9, y - 5, 3, 3, HUB, OL, 1);
  ellipse(x + 13, y - 3, 4.5, 4.5, TIRE, OL, LW);
  ellipse(x + 13, y - 3, 1.8, 1.8, HUB);
}

function pushCrew(x: number, base: number, { air = 0, duck = false }: CrewPose): void {
  const y = base - air;
  const vest = '#c6e63a';
  ellipse(x + 2, base + 1, 17 - Math.min(7, air / 7), 4, 'rgba(0,0,0,.3)');
  roundRect(x + 4, y - 10, 18, 8, 3, '#e0402d', OL, LW);
  rect(x + 6, y - 9, 14, 2, '#ff8a78');
  roundRect(x - 2, y - 14, 8, 11, 2, '#3a3a3a', OL, LW);
  ellipse(x + 7, y - 2, 3, 3, TIRE, OL, 1.5);
  ellipse(x + 19, y - 2, 3, 3, TIRE, OL, 1.5);
  const [hx, hy] = duck ? [x - 1, y - 18] : [x - 3, y - 30];
  line(x + 6, y - 9, hx, hy, OL, 2.5);
  line(x + 6, y - 9, hx, hy, '#9a9a9a', 1);
  if (duck) {
    roundRect(x - 17, y - 9, 13, 8, 3, DENIM, OL, LW);
    roundRect(x - 17, y - 3, 6, 3, 1, BOOT, OL, 1);
    roundRect(x - 16, y - 21, 12, 13, 3, vest, OL, LW);
    rect(x - 16, y - 16, 12, 2, '#e8e8e8');
    line(x - 7, y - 17, hx, hy, vest, 3.5);
    ellipse(hx, hy, 2, 2, SKIN, OL, 1);
    head(x - 9, y - 27, '#127DB9');
  } else {
    roundRect(x - 15, y - 15, 5, 15, 2, DENIM, OL, LW);
    roundRect(x - 9, y - 15, 5, 15, 2, DENIM, OL, LW);
    roundRect(x - 16, y - 3, 7, 3, 1, BOOT, OL, 1);
    roundRect(x - 10, y - 3, 7, 3, 1, BOOT, OL, 1);
    roundRect(x - 17, y - 30, 14, 17, 3, vest, OL, LW);
    rect(x - 17, y - 24, 14, 2, '#e8e8e8');
    rect(x - 17, y - 19, 14, 2, '#e8e8e8');
    line(x - 7, y - 26, hx, hy, vest, 3.5);
    ellipse(hx, hy, 2, 2, SKIN, OL, 1);
    head(x - 10, y - 36, '#127DB9');
  }
}

export function drawCrew(id: CrewId, x: number, base: number, pose: CrewPose = {}): void {
  if (id === 'rideOn') rideOn(x, base, pose);
  else pushCrew(x, base, pose);
}

// ---------------------------------------------------------------- hop obstacles

function rock(x: number, base: number): void {
  shadow(x, base, 10);
  poly([[x - 9, base], [x - 8, base - 8], [x - 3, base - 13], [x + 5, base - 12], [x + 9, base - 5], [x + 9, base]], '#a3a3ab', OL, LW);
  poly([[x - 4, base - 11], [x + 2, base - 11.5], [x - 1, base - 8]], '#d4d4da', null);
  poly([[x + 3, base], [x + 8, base - 5], [x + 9, base]], '#7d7d86', null);
}

function sprinkler(x: number, base: number): void {
  shadow(x, base, 6);
  roundRect(x - 3.5, base - 10, 7, 10, 1.5, '#2b2b2b', OL, LW);
  roundRect(x - 5, base - 13, 10, 4, 1.5, '#4a4a4a', OL, 1.5);
  const c = context();
  c.strokeStyle = '#6cc4f5';
  c.lineWidth = 1.5;
  c.lineCap = 'round';
  for (const dir of [-1, 1]) {
    c.beginPath();
    c.moveTo(x, base - 13);
    c.quadraticCurveTo(x + dir * 7, base - 26, x + dir * 13, base - 12);
    c.stroke();
  }
  for (const [dx, dy] of [[-13, -10], [13, -10], [-10, -18], [10, -18]]) ellipse(x + dx, base + dy, 1.3, 1.3, '#a8defa');
}

function picnicTable(x: number, base: number): void {
  const wood = '#b0703a';
  const dark = '#8a5428';
  shadow(x, base, 11);
  line(x - 9, base, x + 1, base - 13, OL, 4.5);
  line(x - 9, base, x + 1, base - 13, dark, 2.5);
  line(x + 9, base, x - 1, base - 13, OL, 4.5);
  line(x + 9, base, x - 1, base - 13, dark, 2.5);
  roundRect(x - 14, base - 7, 28, 3, 1, wood, OL, 1.5);
  roundRect(x - 13, base - 16, 26, 4, 1, wood, OL, LW);
  rect(x - 12, base - 15.5, 24, 1, 'rgba(255,255,255,.3)');
  for (const gx of [-6, 1, 7]) rect(x + gx, base - 15, 0.8, 2.5, dark);
  roundRect(x - 8, base - 19, 6, 3, 0.8, '#e23b3b', OL, 1);
}

function shrub(x: number, base: number): void {
  shadow(x, base, 12);
  line(x - 3, base, x - 5, base - 5, BARK, 2);
  line(x + 3, base, x + 5, base - 5, BARK, 2);
  line(x, base, x, base - 6, BARK, 2);
  const c = context();
  c.beginPath();
  c.moveTo(x - 11, base - 3);
  const bumps: readonly Point[] = [[-12, -9], [-9, -15], [-4, -18], [2, -18.5], [7, -16], [11, -11], [11.5, -5]];
  for (const [bx, by] of bumps) c.quadraticCurveTo(x + bx - 3, base + by - 2, x + bx, base + by);
  c.lineTo(x + 10, base - 3);
  c.closePath();
  c.fillStyle = '#2f7a2f';
  c.fill();
  c.lineWidth = LW;
  c.strokeStyle = OL;
  c.stroke();
  for (let i = 0; i < 16; i++) {
    ellipse(x - 8 + ((i * 7) % 17), base - 5 - ((i * 5) % 12), 2.2, 1.4, i % 2 ? '#3f9a3c' : '#276a28');
  }
  ellipse(x - 3, base - 15, 3.5, 1.8, '#6cc25e');
  for (const [bx, by] of [[-6, -10], [-1, -7], [4, -12], [7, -7], [1, -14], [-8, -5]]) {
    ellipse(x + bx, base + by, 1.6, 1.6, '#d62828', OL, 0.6);
    ellipse(x + bx - 0.5, base + by - 0.6, 0.5, 0.5, '#ffb3b3');
  }
}

function neighbor(x: number, base: number): void {
  const b = bob(260, 1);
  shadow(x, base, 9);
  roundRect(x - 5, base - 5, 4, 5, 1, '#6b4a3a', OL, 1.5);
  roundRect(x + 1, base - 5, 4, 5, 1, '#6b4a3a', OL, 1.5);
  poly([[x - 8, base - 4], [x - 5, base - 19 + b], [x + 5, base - 19 + b], [x + 8, base - 4]], '#9b7fc4', OL, LW);
  roundRect(x - 6, base - 23 + b, 12, 7, 2, '#f0c8dc', OL, LW);
  for (let i = -3; i <= 3; i += 2) ellipse(x + i, base - 17 + b, 0.9, 0.9, '#ffffff');
  ellipse(x, base - 30 + b, 6, 6, '#f1c9a0', OL, LW);
  ellipse(x - 1, base - 35 + b, 6, 3.5, '#e4e4ec', OL, 1.5);
  ellipse(x - 6, base - 34 + b, 3, 3, '#e4e4ec', OL, 1.5);
  ellipse(x - 2, base - 30 + b, 2, 2, null, OL, 1);
  ellipse(x + 3, base - 30 + b, 2, 2, null, OL, 1);
  arcStroke(x + 1, base - 27 + b, 1.5, 0.2, 2.9);
  roundRect(x + 5, base - 16 + b, 6, 5, 1.5, '#c0392b', OL, 1.5);
  line(x + 11, base, x + 10, base - 18 + b, BARK, 2);
  line(x + 10, base - 18 + b, x + 7, base - 19 + b, BARK, 2);
}

function dogWalker(x: number, base: number): void {
  const b = Math.round(Math.sin(performance.now() / 120));
  const fur = '#c98a3c';
  shadow(x - 1, base, 17);
  // dog (leading, facing left)
  roundRect(x - 17, base - 11, 14, 7, 3, fur, OL, LW);
  roundRect(x - 16 + b, base - 5, 2.5, 5, 1, fur, OL, 1);
  roundRect(x - 7 - b, base - 5, 2.5, 5, 1, fur, OL, 1);
  ellipse(x - 18, base - 14, 4.5, 4, fur, OL, LW);
  ellipse(x - 22, base - 13, 2.5, 1.8, fur, OL, 1);
  ellipse(x - 23.5, base - 13.5, 1, 1, OL);
  ellipse(x - 17, base - 13, 2, 3, '#8a5a24', OL, 1);
  ellipse(x - 19, base - 15, 0.9, 0.9, OL);
  line(x - 3, base - 10, x + 1, base - 14 - b, fur, 2.5);
  roundRect(x - 16, base - 12, 2, 3, 0.5, '#e23b3b');
  // boy
  roundRect(x + 3, base - 9, 3.5, 9, 1, '#2f4f7f', OL, 1.5);
  roundRect(x + 8, base - 9, 3.5, 9, 1, '#2f4f7f', OL, 1.5);
  roundRect(x + 2, base - 3, 5, 3, 1, '#ffffff', OL, 1);
  roundRect(x + 7, base - 3, 5, 3, 1, '#ffffff', OL, 1);
  roundRect(x + 1, base - 20, 12, 12, 3, '#e23b3b', OL, LW);
  rect(x + 2, base - 15, 10, 2, '#ffffff');
  line(x + 3, base - 16, x - 2, base - 13, SKIN, 2.5);
  ellipse(x + 7, base - 26, 6, 6, SKIN, OL, LW);
  cap(x + 7, base - 27, 6.2, '#2d6cdf');
  poly([[x + 7, base - 28], [x + 15, base - 27.5], [x + 15, base - 26], [x + 7, base - 26]], '#2d6cdf', OL, 1.5);
  ellipse(x + 4, base - 25, 1.1, 1.3, OL);
  arcStroke(x + 4.5, base - 23.5, 1.8, 1.8, 2.9);
  // leash
  line(x - 1, base - 13, x - 15, base - 11, '#e23b3b', 0.8);
}

const HOP_SPRITES: Record<HopKind, (x: number, base: number) => void> = {
  rock,
  sprinkler,
  picnicTable,
  shrub,
  neighbor,
  dogWalker,
};

export function drawObstacle(kind: HopKind, x: number, base: number, hit: boolean): void {
  withAlpha(hit ? 0.35 : 1, () => HOP_SPRITES[kind](x, base));
}

// ---------------------------------------------------------------- weeds

export function drawWeed(x: number, base: number, missed: boolean): void {
  ellipse(x, base, 8, 3, '#4a2d18');
  const blade = (pts: readonly Point[]) => poly(pts, '#6d8f2a', '#3e5a14', 1.5);
  blade([[x, base], [x - 14, base - 6], [x - 10, base - 8], [x - 12, base - 11], [x - 6, base - 9], [x - 2, base - 4]]);
  blade([[x, base], [x + 14, base - 7], [x + 10, base - 9], [x + 13, base - 13], [x + 6, base - 10], [x + 2, base - 4]]);
  blade([[x - 1, base], [x - 6, base - 16], [x - 3, base - 14], [x - 3, base - 20], [x + 1, base - 13], [x + 1, base]]);
  blade([[x, base], [x + 4, base - 18], [x + 5, base - 13], [x + 9, base - 17], [x + 3, base - 4]]);
  // dandelion seed head
  const c = context();
  c.beginPath();
  c.moveTo(x + 1, base - 3);
  c.quadraticCurveTo(x + 3, base - 16, x + 1, base - 27);
  c.lineWidth = 1.2;
  c.strokeStyle = '#7fa33a';
  c.stroke();
  const hx = x + 1;
  const hy = base - 32;
  ellipse(hx, hy, 6.5, 6.5, 'rgba(255,255,255,.55)', 'rgba(27,27,36,.35)', 0.8);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    line(hx, hy, hx + Math.cos(a) * 6, hy + Math.sin(a) * 6, '#ffffff', 0.6);
    ellipse(hx + Math.cos(a) * 6.3, hy + Math.sin(a) * 6.3, 0.7, 0.7, '#ffffff');
  }
  ellipse(hx, hy, 1.4, 1.4, '#c9b27a');
  if (missed) {
    ellipse(x + 12, base - 38, 5, 5, '#e23b3b', OL);
    text('!', x + 12, base - 37, '6px "Press Start 2P"', '#ffffff');
  }
}

// ---------------------------------------------------------------- low branch

// A branch group covers `span` columns starting at the column centered on x.
const branchEdges = (x: number, span: number) => ({ left: x - 24, right: x + (span - 1) * COL + 22 });

function leaf(lx: number, ly: number, len: number, angle: number, fill: string): void {
  const c = context();
  c.save();
  c.translate(lx, ly);
  c.rotate(angle);
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(len * 0.5, -len * 0.38, len, 0);
  c.quadraticCurveTo(len * 0.5, len * 0.38, 0, 0);
  c.fillStyle = fill;
  c.fill();
  c.lineWidth = 0.8;
  c.strokeStyle = OL;
  c.stroke();
  c.beginPath();
  c.moveTo(len * 0.1, 0);
  c.lineTo(len * 0.8, 0);
  c.lineWidth = 0.5;
  c.strokeStyle = 'rgba(0,0,0,.25)';
  c.stroke();
  c.restore();
}

function leafCluster(lx: number, ly: number, dir: number, count: number, len: number): void {
  for (let i = 0; i < count; i++) {
    leaf(lx, ly, len, dir + (i - (count - 1) / 2) * 0.55, i % 2 ? '#3f9a3c' : '#2f7a2f');
  }
}

// Trunk and crown stand behind the fence: draw before the crew.
export function drawBranchTrunk(x: number, span: number): void {
  const { right } = branchEdges(x, span);
  roundRect(right + 16, 62, 12, 96, 3, BARK, OL, LW);
  rect(right + 19, 72, 2, 78, 'rgba(255,255,255,.15)');
  const cx = right + 22;
  const cy = 52;
  line(cx, 72, cx - 14, 50, BARK, 3);
  line(cx, 70, cx + 12, 46, BARK, 3);
  line(cx, 72, cx + 1, 36, BARK, 3);
  ellipse(cx, cy, 30, 22, '#2f7a2f');
  ellipse(cx - 4, cy - 6, 18, 11, '#3a8a37');
  const ring = 15;
  for (let i = 0; i < ring; i++) {
    const a = (i / ring) * Math.PI * 2 + 0.2;
    const wobble = 1 + ((i * 5) % 3) * 0.06;
    leafCluster(cx + Math.cos(a) * 26 * wobble, cy + Math.sin(a) * 18 * wobble, a, 3, 11);
  }
  for (const [dx, dy, a] of [[-12, -4, -2.2], [10, -8, -0.8], [-2, 6, 1.9], [14, 6, 0.4], [-16, 8, 2.6]]) {
    leafCluster(cx + dx, cy + dy, a, 3, 10);
  }
}

// The limb reaches over the lawn: draw after the crew. leafBottom is the branch hit box bottom.
export function drawBranch(x: number, leafBottom: number, span: number): void {
  const { left, right } = branchEdges(x, span);
  const tipY = leafBottom - 12;
  const pts: readonly Point[] = [
    [right + 20, tipY - 26], [right + 4, tipY - 15], [right - 18, tipY - 7],
    [(left + right) / 2, tipY - 1], [left + 4, tipY + 1], [left - 16, tipY - 2],
  ];
  const widths = [9, 8, 6.5, 5, 3.5, 2];
  const segments = (color: string, extra: number) => {
    for (let i = 0; i < pts.length - 1; i++) line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], color, widths[i] + extra);
  };
  const along = (t: number): Point => {
    const f = t * (pts.length - 1);
    const i = Math.min(pts.length - 2, Math.floor(f));
    const r = f - i;
    return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * r, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * r];
  };
  const twigs = [[0.45, -16, -13], [0.62, -13, 4], [0.8, -12, -10]].map(([t, dx, dy]) => {
    const [tx, ty] = along(t);
    return { x1: tx, y1: ty, x2: tx + dx, y2: ty + dy };
  });
  for (const t of twigs) line(t.x1, t.y1, t.x2, t.y2, OL, 4.5);
  segments(OL, 2.5);
  for (const t of twigs) line(t.x1, t.y1, t.x2, t.y2, BARK, 2.5);
  segments(BARK, 0);
  for (let i = 0; i < 3; i++) {
    line(pts[i][0], pts[i][1] - widths[i] / 4, pts[i + 1][0], pts[i + 1][1] - widths[i + 1] / 4, 'rgba(255,255,255,.18)', 1.2);
  }
  const [kx, ky] = along(0.3);
  ellipse(kx, ky, 1.6, 1.1, '#4a2e16');
  for (const t of [0.35, 0.55, 0.72, 0.9]) {
    const [lx, ly] = along(t);
    leafCluster(lx, ly - 1, -Math.PI / 2 - 0.5, 3, 7);
  }
  for (const t of [0.5, 0.85]) {
    const [lx, ly] = along(t);
    leafCluster(lx, ly + 1, Math.PI / 2 + 0.4, 2, 7);
  }
  for (const t of twigs) leafCluster(t.x2, t.y2, Math.atan2(t.y2 - t.y1, t.x2 - t.x1), 5, 8);
  const tip = pts[pts.length - 1];
  leafCluster(tip[0], tip[1], Math.PI, 5, 9);
}
```

`src/render/scenery.ts`:
```ts
// Background, street and lawn, ported from prototype/margin-mower-runner.html.
import { COL, LAWN_BOTTOM, LAWN_TOP, WORLD_HEIGHT as H, WORLD_WIDTH as W } from '../rules/constants';
import type { ColumnKind, Level, Property } from '../rules/levels';
import { OUTLINE as OL, box, context, ellipse, hash, poly, rect, roundRect, shade, text } from './draw';

const BAND = LAWN_BOTTOM - LAWN_TOP;

export function drawSky(): void {
  const g = context().createLinearGradient(0, 0, 0, LAWN_TOP);
  g.addColorStop(0, '#5fb4ea');
  g.addColorStop(1, '#bfe6f7');
  rect(0, 0, W, LAWN_TOP, g);
}

export function drawClouds(cam: number): void {
  for (let i = 0; i < 7; i++) {
    const x = (((i * 131 - cam * 0.1) % 640) + 640) % 640 - 80;
    const y = 16 + ((i * 29) % 50);
    ellipse(x, y, 22, 7, '#ffffff');
    ellipse(x + 14, y - 5, 14, 8, '#ffffff');
    ellipse(x - 12, y - 2, 10, 5, '#ffffff');
  }
}

const HOUSE_BODIES = ['#f2d7a6', '#bcd6ea', '#f3c0ae', '#d3e6b5', '#e8e2f2'];
const HOUSE_ROOFS = ['#9b3d31', '#4d5d7a', '#6b4a3a', '#3f6e4f', '#7a4f7f'];

// White picket fence standing on the back edge of the sidewalk, with a gap for the front walk.
function picketFence(from: number, to: number, base: number, gapFrom: number, gapTo: number): void {
  const top = base - 13;
  const segments: [number, number][] = [[from, gapFrom], [gapTo, to]];
  for (const [a, b] of segments) {
    rect(a, top + 4, b - a, 2, OL);
    rect(a, top + 9, b - a, 2, OL);
    rect(a, top + 4.5, b - a, 1, '#e6e3d8');
    rect(a, top + 9.5, b - a, 1, '#e6e3d8');
    for (let px = a + 1; px + 4 <= b; px += 8) {
      poly([[px, base], [px, top + 2], [px + 2, top], [px + 4, top + 2], [px + 4, base]], '#fbfbf5', OL, 0.8);
    }
  }
}

function house(x: number, base: number, variant: number): void {
  const body = HOUSE_BODIES[variant % 5];
  const roof = HOUSE_ROOFS[variant % 5];
  const w = 96;
  const h = 46;
  const depth = 18;
  const top = base - h;
  // tree behind
  rect(x + 108, base - 58, 6, 58, '#6b4423');
  ellipse(x + 111, base - 66, 22, 18, '#3c7f35', OL);
  ellipse(x + 104, base - 72, 10, 8, '#4f9a44');
  // 3/4 side face, front face, roof
  poly([[x + w, top], [x + w + depth, top - 10], [x + w + depth, base - 10], [x + w, base]], shade(body, -0.22));
  box(x, top, w, h, body);
  for (let i = 1; i < 6; i++) rect(x, top + i * 8, w, 1, shade(body, -0.08));
  poly([[x - 8, top + 1], [x + w / 2, top - 30], [x + w + 8, top + 1]], roof);
  poly([[x + w / 2, top - 30], [x + w / 2 + depth, top - 40], [x + w + 8 + depth, top - 9], [x + w + 8, top + 1]], shade(roof, -0.25));
  rect(x - 8, top, w + 16, 2, shade(roof, -0.35));
  const windowAt = (wx: number, wy: number) => {
    box(wx, wy, 16, 13, '#a8d8f0');
    rect(wx + 7, wy, 2, 13, '#ffffff');
    rect(wx, wy + 6, 16, 1, '#ffffff');
    rect(wx - 2, wy - 1, 3, 15, shade(roof, 0.1));
    rect(wx + 15, wy - 1, 3, 15, shade(roof, 0.1));
  };
  windowAt(x + 10, top + 12);
  windowAt(x + 70, top + 12);
  box(x + 40, top + 18, 16, 28, shade(roof, 0.15));
  rect(x + 52, top + 32, 2, 2, '#f5c542');
  rect(x + 34, base - 3, 28, 3, '#d9d4c7');
  picketFence(x - 37, x + 133, base, x + 32, x + 64);
  // mailbox
  rect(x + 124, base - 4, 2, 14, '#5a4030');
  box(x + 119, base - 10, 12, 7, '#2f5fa8');
  rect(x + 131, base - 12, 1, 5, '#e23b3b');
}

function officeBuilding(x: number, base: number, variant: number): void {
  const w = 120 + (variant % 3) * 16;
  const h = 70 + (variant % 4) * 14;
  const depth = 22;
  const top = base - h;
  poly([[x + w, top], [x + w + depth, top - 12], [x + w + depth, base - 12], [x + w, base]], '#5d6f86');
  poly([[x, top], [x + depth, top - 12], [x + w + depth, top - 12], [x + w, top]], '#9fb0c4');
  box(x, top, w, h, '#7f95ad');
  for (let wy = top + 6; wy < base - 18; wy += 12) {
    const g = context().createLinearGradient(0, wy, 0, wy + 8);
    g.addColorStop(0, '#d6ecfa');
    g.addColorStop(1, '#6fa8d0');
    rect(x + 4, wy, w - 8, 8, g);
    for (let wx = x + 4; wx < x + w - 4; wx += 18) rect(wx, wy, 1, 8, '#51677f');
  }
  box(x + w / 2 - 14, base - 16, 28, 16, '#a8d8f0');
  rect(x + w / 2, base - 16, 1, 16, '#51677f');
  if (variant % 2 === 0) {
    box(x + 8, top - 10, 44, 9, '#127DB9');
    text('N.VALLEY', x + 10, top - 5, '6px "Press Start 2P"', '#ffffff', 'left');
  }
  for (let hx = x - 10; hx < x + w + 20; hx += 14) ellipse(hx + 7, base + 3, 8, 6, '#3f8a3a', OL);
}

export function drawBackdrop(kind: Property['backdrop'], cam: number): void {
  const base = LAWN_TOP - 10;
  const span = kind === 'office' ? 190 : 170;
  const parallax = 0.85;
  const start = Math.floor((cam * parallax - 200) / span);
  for (let i = start; i < start + 5; i++) {
    const x = i * span - cam * parallax;
    if (kind === 'office') officeBuilding(x, base, Math.abs(i));
    else house(x, base, Math.abs(i));
  }
}

const CAR_COLORS = ['#d64533', '#2f5fa8', '#f5c542', '#3f8a3a'];

export function drawSidewalkAndStreet(cam: number): void {
  rect(0, LAWN_TOP - 10, W, 10, '#d7d3c9');
  rect(0, LAWN_TOP - 10, W, 1, '#f1eee6');
  rect(0, LAWN_TOP - 1, W, 1, '#b5b0a4');
  for (let x = -(((cam % 40) + 40) % 40); x < W; x += 40) rect(x, LAWN_TOP - 10, 1, 10, '#b5b0a4');
  rect(0, LAWN_BOTTOM, W, 7, '#c9c5bb');
  rect(0, LAWN_BOTTOM, W, 2, '#ecebe4');
  rect(0, LAWN_BOTTOM + 7, W, 1, OL);
  rect(0, LAWN_BOTTOM + 8, W, H - LAWN_BOTTOM - 8, '#4a4b55');
  for (let x = -(((cam % 60) + 60) % 60); x < W; x += 60) rect(x, 248, 30, 3, '#f1c232');
  for (let i = Math.floor((cam - 300) / 420); i < Math.floor((cam + W) / 420) + 1; i++) {
    const x = i * 420 + 260 - cam;
    const color = CAR_COLORS[((i % 4) + 4) % 4];
    ellipse(x + 30, 262, 32, 4, 'rgba(0,0,0,.3)');
    poly([[x, 258], [x + 4, 246], [x + 14, 246], [x + 20, 236], [x + 44, 236], [x + 52, 246], [x + 60, 247], [x + 60, 258]], color);
    poly([[x + 22, 238], [x + 30, 238], [x + 30, 245], [x + 17, 245]], '#bfe3f5', null);
    poly([[x + 33, 238], [x + 43, 238], [x + 49, 245], [x + 33, 245]], '#bfe3f5', null);
    for (const wx of [x + 14, x + 48]) {
      ellipse(wx, 258, 6, 6, '#222222', OL);
      ellipse(wx, 258, 2, 2, '#aaaaaa');
    }
  }
}

function drawGrassColumn(x: number, col: number, mowed: boolean): void {
  if (mowed) {
    rect(x, LAWN_TOP, COL, BAND, col % 2 ? '#7cc85a' : '#93d872');
    rect(x, LAWN_TOP, 1, BAND, 'rgba(0,0,0,.05)');
    return;
  }
  rect(x, LAWN_TOP, COL, BAND, '#4b9a37');
  const h = hash(col);
  for (let k = 0; k < 10; k++) {
    const tx = x + ((h >>> (k * 3)) % COL);
    const ty = LAWN_TOP + 4 + ((h >>> (k * 2 + 5)) % (BAND - 6));
    rect(tx, ty - 4, 1, 4, '#357a27');
    rect(tx + 2, ty - 3, 1, 3, '#5fb046');
    rect(tx - 2, ty - 2, 1, 2, '#357a27');
  }
}

export function drawLawn(level: Level, mowed: ReadonlySet<number>, cam: number): void {
  const kindAt = (col: number): ColumnKind => (col >= 0 && col < level.columns.length ? level.columns[col] : 'walkway');
  const weedCols = new Set(level.weeds.map((w) => w.col));
  const first = Math.floor(cam / COL) - 1;
  const last = Math.floor((cam + W) / COL) + 1;

  for (let col = first; col <= last; col++) {
    const x = col * COL - cam;
    const kind = kindAt(col);
    if (kind === 'pad') rect(x, LAWN_TOP, COL, BAND, '#b08a5a');
    else if (kind === 'grass') drawGrassColumn(x, col, mowed.has(col));
    else if (kind === 'bed') drawGrassColumn(x, col, false);
    else rect(x, LAWN_TOP, COL, BAND, '#4b9a37');
    if (kind === 'walkway') {
      poly([[x + 2, LAWN_TOP], [x + 22, LAWN_TOP], [x + 24, LAWN_BOTTOM], [x, LAWN_BOTTOM]], '#dcd8ce', null);
      rect(x, LAWN_TOP + 26, COL, 1, '#bdb8ad');
    }
  }

  // Beds and dirt pads are drawn once per run of adjacent columns.
  let col = first;
  while (col <= last) {
    const kind = kindAt(col);
    if (kind !== 'bed' && kind !== 'pad') {
      col++;
      continue;
    }
    let end = col;
    while (end + 1 < level.columns.length && kindAt(end + 1) === kind) end++;
    const x0 = col * COL - cam;
    const x1 = (end + 1) * COL - cam;
    const count = end - col + 1;
    if (kind === 'bed') {
      roundRect(x0 + 1, LAWN_TOP + 8, x1 - x0 - 2, BAND - 12, 10, '#7a4b2a', '#c8c0b0', 2);
      for (let k = 0; k < count * 8; k++) {
        const hh = hash(col * 31 + k);
        rect(x0 + 4 + (hh % Math.max(1, x1 - x0 - 8)), LAWN_TOP + 12 + ((hh >>> 8) % (BAND - 20)), 2, 1, '#5c3620');
      }
      for (let k = col; k <= end; k++) {
        if (!weedCols.has(k) && hash(k) & 1) {
          const bx = k * COL - cam + 12;
          ellipse(bx, LAWN_TOP + 20, 8, 6, '#3f8a3a', OL);
          ellipse(bx - 2, LAWN_TOP + 18, 3, 2, '#5fb046');
        }
      }
    } else {
      rect(x0, LAWN_TOP, x1 - x0, BAND, '#b08a5a');
      rect(x0, LAWN_TOP, 2, BAND, '#8f6a3e');
      rect(x1 - 2, LAWN_TOP, 2, BAND, '#8f6a3e');
      roundRect(x0 + 6, LAWN_TOP + 6, x1 - x0 - 12, BAND - 12, 8, '#c29c6a');
      for (let k = 0; k < count * 6; k++) {
        const hh = hash(col * 17 + k);
        rect(x0 + 4 + (hh % Math.max(1, x1 - x0 - 8)), LAWN_TOP + 4 + ((hh >>> 8) % (BAND - 8)), 2, 2, '#9a7648');
      }
    }
    col = end + 1;
  }
}
```

`src/render/scene.ts`:
```ts
import { GROUND, MOWER_SCREEN_X, WORLD_WIDTH as W } from '../rules/constants';
import type { Obstacle } from '../rules/levels';
import type { Run } from '../rules/run';
import { OUTLINE as OL, context, poly, rect, roundRect } from './draw';
import { drawBackdrop, drawClouds, drawLawn, drawSidewalkAndStreet, drawSky } from './scenery';
import { drawBranch, drawBranchTrunk, drawCrew, drawObstacle, drawWeed } from './sprites';

export type HintKey = 'hop' | 'duck' | 'weed';

// Hints already passed in this session, keyed by property id + hint.
export type SeenHints = Set<string>;

const hintId = (run: Run, key: HintKey) => `${run.property.id}:${key}`;

interface HintTarget {
  key: HintKey;
  x: number;
  y: number;
  label: string;
  active: boolean;
}

function hintTargets(run: Run): HintTarget[] {
  const targets: HintTarget[] = [];
  const firstHop = run.level.obstacles.find((o) => o.kind !== 'branch');
  const firstBranch = run.level.obstacles.find((o) => o.kind === 'branch');
  const firstWeed = run.level.weeds[0];
  if (firstHop !== undefined) targets.push({ key: 'hop', x: firstHop.x, y: GROUND - 22, label: '⬆ HOP', active: true });
  if (firstBranch !== undefined) targets.push({ key: 'duck', x: firstBranch.x, y: 88, label: '⬇ DUCK', active: true });
  if (firstWeed !== undefined) targets.push({ key: 'weed', x: firstWeed.x, y: GROUND - 44, label: '⬇ PULL', active: !firstWeed.pulled });
  return targets;
}

// Marks hints as seen once the crew has passed them.
export function updateHints(run: Run, seen: SeenHints): void {
  for (const t of hintTargets(run)) if (run.dist > t.x + 10) seen.add(hintId(run, t.key));
}

function bubble(x: number, y: number, label: string): void {
  const c = context();
  c.font = '8px "Press Start 2P"';
  const w = Math.ceil(c.measureText(label).width) + 12;
  const b = Math.round(Math.sin(performance.now() / 150) * 2);
  roundRect(x - w / 2, y - 16 + b, w, 15, 4, '#fffdf5', OL, 1.5);
  poly([[x - 4, y - 1 + b], [x + 4, y - 1 + b], [x, y + 4 + b]], '#fffdf5');
  c.fillStyle = OL;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(label, x, y - 8 + b);
}

function finishFlag(x: number): void {
  rect(x, GROUND - 46, 2, 46, OL);
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 4; j++) rect(x + 2 + i * 4, GROUND - 46 + j * 4, 4, 4, (i + j) % 2 ? '#ffffff' : OL);
  }
}

const visible = (x: number, margin = 60) => x > -margin && x < W + margin;
const isBranch = (o: Obstacle) => o.kind === 'branch';

// Draws one full frame for the run. `showHints` is false for the preview behind the intro panel.
export function drawScene(run: Run, seen: SeenHints, showHints = true): void {
  const c = context();
  const cam = run.dist - MOWER_SCREEN_X;
  const shake = run.shake > 0 ? (Math.random() - 0.5) * 5 : 0;
  c.save();
  c.translate(shake, 0);

  drawSky();
  drawClouds(cam);
  drawBackdrop(run.property.backdrop, cam);
  drawSidewalkAndStreet(cam);
  drawLawn(run.level, run.mowed, cam);

  const branches = run.level.obstacles.filter(isBranch);
  for (const o of branches) if (visible(o.x - cam, 120)) drawBranchTrunk(o.x - cam, o.span);
  for (const w of run.level.weeds) if (!w.pulled && visible(w.x - cam)) drawWeed(w.x - cam, GROUND, w.missed);
  for (const o of run.level.obstacles) {
    if (o.kind !== 'branch' && visible(o.x - cam)) drawObstacle(o.kind, o.x - cam, GROUND, o.hit);
  }
  const flagX = run.level.lengthPx - cam;
  if (visible(flagX)) finishFlag(flagX);

  drawCrew(run.crew.id, MOWER_SCREEN_X, GROUND, { air: run.y, duck: run.ducking });
  for (const o of branches) if (visible(o.x - cam, 120)) drawBranch(o.x - cam, o.bottom, o.span);

  for (const p of run.particles) rect(p.x - cam, p.y, 2, 2, p.color);

  if (showHints) {
    for (const t of hintTargets(run)) {
      const sx = t.x - cam;
      if (t.active && !seen.has(hintId(run, t.key)) && sx > MOWER_SCREEN_X - 10 && sx < W - 20) bubble(sx, t.y, t.label);
    }
  }

  c.font = '9px "Press Start 2P"';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  for (const f of run.floats) {
    const sx = f.x - cam;
    c.fillStyle = OL;
    c.fillText(f.text, sx + 1, f.y + 1);
    c.fillStyle = f.color;
    c.fillText(f.text, sx, f.y);
  }

  rect(10, 8, W - 20, 5, 'rgba(0,0,0,.35)');
  rect(10, 8, Math.min(1, run.dist / run.level.lengthPx) * (W - 20), 5, '#f5c542');
  c.restore();
}
```

- [ ] **Step 5: Add the dev scene viewer**

`dev/peek.html`:
```html
<!doctype html>
<!--
  Dev-only scene viewer (not part of the build). With `yarn dev` running, open:
    /dev/peek.html?p=0&at=1440         North Valley at distance 1440
    /dev/peek.html?p=1&at=380&duck=1   Oak Creek, crew ducking
-->
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Margin Mower peek</title>
    <link
      href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&family=Press+Start+2P&display=swap"
      rel="stylesheet"
    />
  </head>
  <body style="margin: 0; background: #23272f">
    <canvas id="peek"></canvas>
    <script type="module">
      import { useContext } from '/src/render/draw.ts';
      import { drawScene } from '/src/render/scene.ts';
      import { PROPERTIES } from '/src/rules/levels.ts';
      import { createRun } from '/src/rules/run.ts';

      await document.fonts.load('8px "Press Start 2P"');
      const q = new URLSearchParams(location.search);
      const canvas = document.getElementById('peek');
      canvas.width = 960;
      canvas.height = 540;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(2, 0, 0, 2, 0, 0);
      useContext(ctx);
      const run = createRun(PROPERTIES[Number(q.get('p') ?? 0)]);
      run.dist = Number(q.get('at') ?? 12);
      for (let c = 0; c < Math.floor(run.dist / 24); c++) if (run.level.mowable[c]) run.mowed.add(c);
      run.ducking = q.has('duck');
      const frame = () => {
        drawScene(run, new Set());
        requestAnimationFrame(frame);
      };
      frame();
    </script>
  </body>
</html>
```

- [ ] **Step 6: Verify, including visually**

Run: `yarn test && yarn build`
Expected: all tests pass, `tsc` is clean, and the build succeeds.

Then run `yarn dev`, and compare each of these against the same view in `prototype/margin-mower-runner.html?peek=...`:
- `/dev/peek.html?p=0&at=1440`: North Valley office buildings with "N.VALLEY" signs and hedges. The ride-on crew is on a dirt pad, and the boy walking the dog is on the next pad. No grass shows on the pads.
- `/dev/peek.html?p=1&at=380&duck=1`: Oak Creek houses with white picket fences above the sidewalk and mailboxes. The push crew is ducking under a leafy branch whose tree trunk and leaf-cluster crown stand behind the sidewalk. A bed holds two dandelion weeds. The "⬇ DUCK" and "⬇ PULL" hint bubbles are showing.

Stop the dev server when you're done.

- [ ] **Step 7: Commit**

```bash
git add src/render dev
git commit -m "feat: port style B sprites, scenery and scene renderer"
```

---

### Task 7: Input and game loop

**Files:**
- Create: `src/game/input.ts`, `src/game/loop.ts`
- Test: `src/game/input.test.ts`

**Interfaces:**
- Consumes: Task 4
- Produces:
  - `HOP_KEYS`, `DUCK_KEYS`
  - `type KeyAction = 'hop' | 'duck' | null`
  - `keyAction(key: string): KeyAction`
  - `interface ControlElements { canvas; hopButton; duckButton }`
  - `interface Controls { setRun(run: Run | null): void }`
  - `setupControls(elements, rng): Controls`
  - `playProperty(run, rng, onFrame): Promise<void>`

- [ ] **Step 1: Write the failing test**

`src/game/input.test.ts`:
```ts
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test src/game/input.test.ts`
Expected: FAIL because the module is not found.

- [ ] **Step 3: Implement**

`src/game/input.ts`:
```ts
import { hop, pressDuck, releaseDuck, type Rng, type Run } from '../rules/run';

export const HOP_KEYS: readonly string[] = ['ArrowUp', ' ', 'w', 'W'];
export const DUCK_KEYS: readonly string[] = ['ArrowDown', 's', 'S'];

export type KeyAction = 'hop' | 'duck' | null;

export function keyAction(key: string): KeyAction {
  if (HOP_KEYS.includes(key)) return 'hop';
  if (DUCK_KEYS.includes(key)) return 'duck';
  return null;
}

export interface ControlElements {
  canvas: HTMLCanvasElement;
  hopButton: HTMLButtonElement;
  duckButton: HTMLButtonElement;
}

export interface Controls {
  // The run that receives input, or null between properties (keys then do nothing).
  setRun(run: Run | null): void;
}

export function setupControls({ canvas, hopButton, duckButton }: ControlElements, rng: Rng): Controls {
  let active: Run | null = null;
  const pressed = (button: HTMLButtonElement, on: boolean) => button.classList.toggle('active', on);
  const doHop = () => {
    if (active !== null) hop(active);
  };
  const duckOn = () => {
    if (active !== null) pressDuck(active, rng);
  };
  const duckOff = () => {
    if (active !== null) releaseDuck(active);
  };

  window.addEventListener('keydown', (event) => {
    if (active === null) return;
    const action = keyAction(event.key);
    if (action === null) return;
    event.preventDefault();
    if (event.repeat) return;
    if (action === 'hop') {
      doHop();
      pressed(hopButton, true);
    } else {
      duckOn();
      pressed(duckButton, true);
    }
  });
  window.addEventListener('keyup', (event) => {
    const action = keyAction(event.key);
    if (action === 'hop') pressed(hopButton, false);
    if (action === 'duck') {
      duckOff();
      pressed(duckButton, false);
    }
  });

  hopButton.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    doHop();
    pressed(hopButton, true);
  });
  for (const type of ['pointerup', 'pointerleave', 'pointercancel']) {
    hopButton.addEventListener(type, () => pressed(hopButton, false));
  }

  duckButton.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    duckButton.setPointerCapture(event.pointerId);
    duckOn();
    pressed(duckButton, true);
  });
  for (const type of ['pointerup', 'pointercancel']) {
    duckButton.addEventListener(type, () => {
      duckOff();
      pressed(duckButton, false);
    });
  }

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    doHop();
  });
  window.addEventListener('contextmenu', (event) => {
    if (active !== null) event.preventDefault();
  });

  return {
    setRun(run) {
      active = run;
      pressed(hopButton, false);
      pressed(duckButton, false);
    },
  };
}
```

`src/game/loop.ts`:
```ts
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
```

- [ ] **Step 4: Verify**

Run: `yarn test && yarn typecheck`
Expected: all tests pass, including 11 input tests.

- [ ] **Step 5: Commit**

```bash
git add src/game
git commit -m "feat: add keyboard, button and tap controls plus the game loop"
```

---

### Task 8: Share text, score card, sharing and HubSpot

**Files:**
- Create: `src/share/text.ts`, `src/share/card.ts`, `src/share/share.ts`, `src/hubspot.ts`
- Test: `src/share/text.test.ts`, `src/hubspot.test.ts`

**Interfaces:**
- Consumes: `RoundSummary`, `config`, `linkedInShareUrl`
- Produces:
  - From `text.ts`: `starString(earned, total)`, `formatPoints(points)`, `formatHours(hours)`, `summaryLine(summary)`, `shareText(summary, pageUrl)`
  - From `card.ts`: `CARD_WIDTH`, `CARD_HEIGHT`, `renderCardBlob(summary): Promise<Blob>`
  - From `share.ts`: `type ShareOutcome = 'shared' | 'downloaded' | 'cancelled'`, `downloadBlob(blob, filename)`, `shareResult(blob, summary): Promise<ShareOutcome>`
  - From `hubspot.ts`: `LeadFields`, `HubSpotTarget`, `PageContext`, `HubSpotSubmission`, `hubspotEnabled`, `isValidEmail`, `buildSubmission`, `submissionUrl`, `submitLead(target, submission, fetchFn?)`

- [ ] **Step 1: Write the failing tests**

`src/share/text.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import type { RoundSummary } from '../rules/scoring';
import { formatHours, formatPoints, shareText, starString, summaryLine } from './text';

const summary: RoundSummary = { stars: 8, maxStars: 10, efficiency: 97, points: 2330, hoursSaved: 0.8, title: 'Pro' };

describe('share text', () => {
  it('draws filled and empty stars', () => {
    expect(starString(2, 5)).toBe('★★☆☆☆');
    expect(starString(0, 3)).toBe('☆☆☆');
  });

  it('formats numbers', () => {
    expect(formatPoints(2330)).toBe('2,330');
    expect(formatPoints(-30)).toBe('-30');
    expect(formatHours(0.84)).toBe('0.8');
    expect(formatHours(6)).toBe('6.0');
  });

  it('builds the scorecard summary line', () => {
    expect(summaryLine(summary)).toBe('⭐ 8/10 · 97% efficiency · 2,330 pts · 0.8 hrs saved');
  });

  it('builds share text with the page link and no BomData stat', () => {
    const text = shareText(summary, 'https://bomdata.io/margin-mower/');
    expect(text).toBe(
      'I scored 8/10 stars with 97% efficiency in Margin Mower. Can you mow on budget? https://bomdata.io/margin-mower/',
    );
    expect(text).not.toContain('8–10%');
  });
});
```

`src/hubspot.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
import { buildSubmission, hubspotEnabled, isValidEmail, submissionUrl, submitLead } from './hubspot';
import type { RoundSummary } from './rules/scoring';

const target = { portalId: '123', formGuid: 'abc-def' };
const summary: RoundSummary = { stars: 8, maxStars: 10, efficiency: 97, points: 2330, hoursSaved: 0.8, title: 'Pro' };
const page = { pageUri: 'https://bomdata.io/margin-mower/', pageName: 'Margin Mower' };
const lead = { firstName: 'Pat', company: 'GreenCo', email: 'pat@greenco.com' };

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
  it('maps trimmed lead fields and the score to HubSpot contact fields', () => {
    expect(buildSubmission({ firstName: ' Pat ', company: 'GreenCo', email: 'pat@greenco.com ' }, summary, page)).toEqual({
      fields: [
        { objectTypeId: '0-1', name: 'firstname', value: 'Pat' },
        { objectTypeId: '0-1', name: 'company', value: 'GreenCo' },
        { objectTypeId: '0-1', name: 'email', value: 'pat@greenco.com' },
        { objectTypeId: '0-1', name: 'margin_mower_score', value: '2330' },
        { objectTypeId: '0-1', name: 'margin_mower_stars', value: '8' },
      ],
      context: page,
    });
  });
});

describe('submitLead', () => {
  const submission = buildSubmission(lead, summary, page);

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

  it('encodes the IDs in the URL', () => {
    expect(submissionUrl({ portalId: '1 2', formGuid: 'a/b' })).toBe(
      'https://api.hsforms.com/submissions/v3/integration/submit/1%202/a%2Fb',
    );
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test src/share src/hubspot.test.ts`
Expected: FAIL because the modules are not found.

- [ ] **Step 3: Implement**

`src/share/text.ts`:
```ts
import type { RoundSummary } from '../rules/scoring';

export function starString(earned: number, total: number): string {
  return '★'.repeat(earned) + '☆'.repeat(Math.max(0, total - earned));
}

export function formatPoints(points: number): string {
  return points.toLocaleString('en-US');
}

export function formatHours(hours: number): string {
  return hours.toFixed(1);
}

export function summaryLine(s: RoundSummary): string {
  return `⭐ ${s.stars}/${s.maxStars} · ${s.efficiency}% efficiency · ${formatPoints(s.points)} pts · ${formatHours(s.hoursSaved)} hrs saved`;
}

export function shareText(s: RoundSummary, pageUrl: string): string {
  return `I scored ${s.stars}/${s.maxStars} stars with ${s.efficiency}% efficiency in Margin Mower. Can you mow on budget? ${pageUrl}`;
}
```

`src/share/card.ts`:
```ts
import type { RoundSummary } from '../rules/scoring';
import { formatHours, formatPoints, starString } from './text';

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 627;

const INK = '#1d2b36';
const BRAND = '#127DB9';
const CENTER = CARD_WIDTH / 2 - 6;

function drawCard(ctx: CanvasRenderingContext2D, s: RoundSummary): void {
  const stripe = 48;
  for (let y = 0; y < CARD_HEIGHT; y += stripe) {
    ctx.fillStyle = (y / stripe) % 2 === 0 ? '#7cc85a' : '#93d872';
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
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = INK;
  ctx.font = '44px "Press Start 2P"';
  ctx.fillText('MARGIN MOWER', CENTER, 150);

  ctx.fillStyle = BRAND;
  ctx.font = '28px "Press Start 2P"';
  ctx.fillText(s.title.toUpperCase(), CENTER, 215);

  ctx.fillStyle = '#e0a800';
  ctx.font = '72px "DM Sans", sans-serif';
  ctx.fillText(starString(s.stars, s.maxStars), CENTER, 310);

  ctx.fillStyle = INK;
  ctx.font = '22px "Press Start 2P"';
  ctx.fillText(`${s.efficiency}% EFFICIENCY | ${formatPoints(s.points)} PTS`, CENTER, 385);
  ctx.fillText(`${formatHours(s.hoursSaved)} HRS SAVED`, CENTER, 425);

  ctx.font = 'bold 32px "DM Sans", sans-serif';
  ctx.fillText('Can you mow on budget?', CENTER, 480);

  ctx.fillStyle = BRAND;
  ctx.font = '26px "DM Sans", sans-serif';
  ctx.fillText('bomdata.io/margin-mower', CENTER, 522);
}

export async function renderCardBlob(summary: RoundSummary): Promise<Blob> {
  await Promise.all([document.fonts.load('44px "Press Start 2P"'), document.fonts.load('bold 32px "DM Sans"')]);
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

`src/share/share.ts`:
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
      // Any other failure (for example sharing blocked inside the iframe) falls back to download.
    }
  }
  downloadBlob(blob, FILE_NAME);
  window.open(linkedInShareUrl(config.pageUrl), '_blank', 'noopener');
  return 'downloaded';
}
```

`src/hubspot.ts`:
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

- [ ] **Step 4: Verify**

Run: `yarn test && yarn typecheck`
Expected: all tests pass, including 4 text tests and 7 HubSpot tests.

- [ ] **Step 5: Commit**

```bash
git add src/share src/hubspot.ts src/hubspot.test.ts
git commit -m "feat: add share card, native share with LinkedIn fallback, and HubSpot lead submission"
```

---

### Task 9: Screens, styles and the full game flow

**Files:**
- Create: `src/screens/dom.ts`, `src/screens/panels.ts`, `src/screens/hud.ts`, `src/screens/results.ts`
- Replace: `src/style.css`, `src/main.ts`

**Interfaces:**
- Consumes: everything above
- Produces:
  - `showTitle`, `showIntro`, `showPropertyCard`, `showFatal`
  - `showHud`, `updateHud`, `hideHud`, `HudElements`
  - `showResults`, `ResultsActions`
  - The playable game

- [ ] **Step 1: Implement the screens**

`src/screens/dom.ts`:
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

export function row(label: Child, value: string): HTMLDivElement {
  return el('div', { className: 'row' }, [el('span', {}, [label]), el('span', { className: 's', text: value })]);
}

// Replaces the overlay with a panel and focuses its first button so Enter/Space works.
export function showPanel(overlay: HTMLElement, children: Child[]): HTMLDivElement {
  const panel = el('div', { className: 'panel' }, children);
  overlay.replaceChildren(panel);
  panel.querySelector('button')?.focus();
  return panel;
}

// Resolves when a button inside `panel` created with `onClick: done` is pressed; clears the overlay.
export function waitFor<T>(overlay: HTMLElement, build: (done: (value: T) => void) => Child[]): Promise<T> {
  return new Promise((resolve) => {
    showPanel(
      overlay,
      build((value) => {
        overlay.replaceChildren();
        resolve(value);
      }),
    );
  });
}

// Renders "a **bold** b" as text with a <b> element.
export function withBold(value: string): Child[] {
  return value.split('**').map((part, i) => (i % 2 === 1 ? el('b', { text: part }) : part));
}
```

`src/screens/panels.ts`:
```ts
import { config, withUtm } from '../config';
import { BUDGET_HOURS } from '../rules/constants';
import type { Crew } from '../rules/crews';
import type { Property } from '../rules/levels';
import { MAX_STARS_PER_PROPERTY, type PropertyScore } from '../rules/scoring';
import { formatHours, formatPoints, starString } from '../share/text';
import { button, el, link, row, showPanel, waitFor, withBold } from './dom';

export function showTitle(overlay: HTMLElement): Promise<void> {
  return waitFor<void>(overlay, (done) => [
    el('h1', { text: 'Margin Mower' }),
    el('p', {}, [el('b', { text: 'Can you mow on budget?' })]),
    el('p', {
      text: 'Two properties. Hop the obstacles, duck the branches, pull the weeds, and cross the finish line before your 6 hours run out.',
    }),
    button('Start shift', 'primary', () => done()),
    el('p', { className: 'proof' }, ['A game by ', link('BomData', 'inline-link', withUtm(config.siteUrl))]),
  ]);
}

function controlsHelp(crew: Crew): HTMLDivElement {
  const line = (label: string, rest: string) => el('div', {}, [el('b', { text: label }), rest]);
  return el('div', { className: 'keys' }, [
    line('⬆ Hop', ` over ${crew.canDuck ? 'rocks, shrubs and neighbors' : 'sprinklers, picnic tables and dog walkers'}: ↑, Space, or tap the game`),
    ...(crew.canDuck ? [line('⬇ Duck', ' under low branches: hold ↓')] : []),
    line('⬇ Pull', ' weeds as you pass over them: press ↓'),
    el('div', { className: 'keys-note', text: 'Only hop when you need to: grass you fly over doesn’t get cut.' }),
  ]);
}

export function showIntro(overlay: HTMLElement, property: Property, crew: Crew, index: number, total: number): Promise<void> {
  return waitFor<void>(overlay, (done) => [
    el('h2', { text: `Property ${index + 1} of ${total}` }),
    el('h1', { text: property.name }),
    el('div', { className: 'tip' }, [el('b', { className: 'label', text: 'BomData heads-up' }), ...withBold(property.tip)]),
    controlsHelp(crew),
    el('p', { text: `Budget: ${formatHours(BUDGET_HOURS)} hrs` }),
    button('Go!', 'primary', () => done()),
  ]);
}

function bumpNote(score: PropertyScore, hoursPerBump: number): string {
  const bumps =
    score.hits === 0
      ? 'No bumps. Smooth driving.'
      : `${score.hits} bump${score.hits > 1 ? 's' : ''} cost you ${formatHours(score.hits * hoursPerBump)} hrs.`;
  return score.cutStar ? bumps : `${bumps} Hopping over grass left it uncut.`;
}

export function showPropertyCard(
  overlay: HTMLElement,
  property: Property,
  score: PropertyScore,
  hoursPerBump: number,
  isLast: boolean,
): Promise<void> {
  const star = (earned: boolean) => (earned ? '★' : '☆');
  return waitFor<void>(overlay, (done) => [
    el('h1', { text: property.name }),
    el('div', { className: 'stars', text: starString(score.stars, MAX_STARS_PER_PROPERTY) }),
    el('div', { className: 'section', text: 'EFFICIENCY' }),
    row(
      el('span', {}, [`${score.efficiency}% `, el('small', { text: `(${formatHours(score.hoursUsed)} of ${formatHours(score.budgetHours)} hrs)` })]),
      starString(score.efficiencyStars, 3),
    ),
    el('div', { className: 'section', text: 'QUALITY' }),
    row(`Grass cut: ${score.cut}%`, star(score.cutStar)),
    row(`Weeds pulled: ${score.weedsPulled}/${score.weedCount}`, star(score.weedStar)),
    el('p', { className: 'proof note', text: bumpNote(score, hoursPerBump) }),
    el('p', {}, [el('b', { text: `${formatPoints(score.points)} pts` })]),
    button(isLast ? 'See my scorecard' : 'Next property', 'primary', () => done()),
  ]);
}

export function showFatal(overlay: HTMLElement): void {
  showPanel(overlay, [
    el('h2', { text: 'Something went wrong' }),
    el('p', { text: 'Reload to start a new shift.' }),
    button('Reload', 'primary', () => window.location.reload()),
  ]);
}
```

`src/screens/hud.ts`:
```ts
import { BUDGET_HOURS } from '../rules/constants';
import { cutPercent, hoursUsed, type Run } from '../rules/run';
import { formatHours } from '../share/text';

export interface HudElements {
  hud: HTMLElement;
  name: HTMLElement;
  clock: HTMLElement;
  cut: HTMLElement;
  controls: HTMLElement;
}

export function showHud(els: HudElements, run: Run): void {
  els.name.textContent = `${run.property.shortName} · ${run.crew.label}`;
  els.hud.hidden = false;
  els.controls.hidden = false;
  updateHud(els, run);
}

export function updateHud(els: HudElements, run: Run): void {
  const used = hoursUsed(run);
  els.clock.textContent = `${formatHours(used)}/${formatHours(BUDGET_HOURS)}h`;
  els.clock.classList.toggle('over', used > BUDGET_HOURS + 1e-9);
  els.cut.textContent = `${cutPercent(run)}% cut`;
}

export function hideHud(els: HudElements): void {
  els.hud.hidden = true;
  els.controls.hidden = true;
}
```

`src/screens/results.ts`:
```ts
import { isValidEmail, type LeadFields } from '../hubspot';
import type { RoundSummary } from '../rules/scoring';
import type { ShareOutcome } from '../share/share';
import { starString, summaryLine } from '../share/text';
import { button, el, link, waitFor } from './dom';

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

// Resolves when the player chooses Play again.
export function showResults(overlay: HTMLElement, summary: RoundSummary, actions: ResultsActions): Promise<void> {
  return waitFor<void>(overlay, (done) => {
    const shareStatus = el('p', { className: 'form-status' });
    const shareButton = button('Share my score', 'secondary', async () => {
      shareButton.disabled = true;
      shareStatus.textContent = SHARE_MESSAGES[await actions.onShare()];
      shareButton.disabled = false;
    });
    return [
      el('h2', { text: 'Weekly scorecard' }),
      el('h1', { text: summary.title }),
      el('div', { className: 'stars', text: starString(summary.stars, summary.maxStars) }),
      el('p', {}, [el('b', { text: summaryLine(summary) })]),
      el('p', { className: 'proof', text: 'Real crews using BomData improved labor efficiency 8–10%.' }),
      link('Book a demo', 'btn primary', actions.demoUrl),
      shareButton,
      shareStatus,
      ...(actions.showLeadForm ? [leadForm(actions.onSubmitLead)] : []),
      button('Play again', 'secondary', () => done()),
    ];
  });
}
```

- [ ] **Step 2: Replace `src/style.css`**

```css
:root {
  --brand: #127db9;
  --ink: #1d2b36;
  --paper: #fffdf5;
  --gold: #f5c542;
  --pixel: 'Press Start 2P', monospace;
  --body: 'DM Sans', Arial, sans-serif;
}

* { box-sizing: border-box; }
[hidden] { display: none !important; }

html,
body {
  margin: 0;
  height: 100%;
  background: #23272f;
  color: var(--ink);
  font-family: var(--body);
  overflow: hidden;
  overscroll-behavior: none;
}

#app {
  position: relative;
  height: 100%;
  padding-top: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

#board {
  margin-top: 8px;
  border: 3px solid #111;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

#hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 12px;
  background: rgba(15, 18, 24, 0.95);
  color: #fff;
  font: 10px var(--pixel);
}
#hud-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#hud-clock.over { color: #ff7a6b; }

#controls {
  display: flex;
  gap: 12px;
  margin-top: 14px;
  width: min(calc(100vw - 32px), 560px);
}
#controls button {
  flex: 1;
  padding: 18px 8px;
  font: 12px/1.5 var(--pixel);
  border: 3px solid #111;
  box-shadow: 3px 3px 0 #111;
  background: var(--gold);
  color: var(--ink);
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
#controls button.active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 #111; }
#controls small { display: block; margin-top: 4px; font: 11px var(--body); opacity: 0.7; }

#overlay:empty { display: none; }

.panel {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
  width: min(calc(100vw - 32px), 420px);
  max-height: calc(100vh - 32px);
  overflow: auto;
  padding: 20px 16px;
  text-align: center;
  background: var(--paper);
  border: 4px solid var(--ink);
  box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.45);
}
.panel h1,
.panel h2 { margin: 0 0 12px; font-family: var(--pixel); line-height: 1.5; }
.panel h1 { font-size: 16px; }
.panel h2 { font-size: 11px; color: var(--brand); }
.panel p { margin: 0 0 12px; line-height: 1.4; }

.tip { margin: 12px 0; padding: 10px 12px; text-align: left; background: #e8f3fa; border-left: 4px solid var(--brand); }
.tip .label { display: block; margin-bottom: 6px; color: var(--brand); font: 9px var(--pixel); }

.keys { margin: 12px 0; padding: 10px 12px; text-align: left; font-size: 14px; background: #f3efe0; }
.keys div { margin: 4px 0; }
.keys .keys-note { margin-top: 8px; font-size: 13px; opacity: 0.8; }

.btn {
  display: block;
  width: 100%;
  margin-top: 10px;
  padding: 14px 12px;
  font: 11px/1.4 var(--pixel);
  color: var(--ink);
  text-align: center;
  text-decoration: none;
  background: var(--gold);
  border: 3px solid var(--ink);
  box-shadow: 3px 3px 0 var(--ink);
  cursor: pointer;
}
.btn:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 var(--ink); }
.btn:disabled { opacity: 0.6; cursor: default; }
.btn.primary { background: var(--brand); color: #fff; }
.btn.secondary { background: #fff; }

.stars { margin: 4px 0 8px; font-size: 26px; letter-spacing: 3px; color: #e0a800; }
.row { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 7px 0; text-align: left; border-bottom: 2px dashed #d8d2bf; }
.row .s { white-space: nowrap; font-size: 18px; color: #e0a800; }
.section { margin: 14px 0 2px; text-align: left; font: 9px var(--pixel); color: #4d5b66; }
.proof { font-size: 13px; color: #4d5b66; }
.note { margin-top: 10px; }
.inline-link { font-weight: 700; color: var(--brand); }

form.lead { margin-top: 18px; padding-top: 14px; border-top: 3px solid var(--ink); }
form.lead input { display: block; width: 100%; margin-top: 8px; padding: 10px; font: inherit; font-size: 16px; background: #fff; border: 2px solid var(--ink); }
.form-status { min-height: 1em; margin-top: 6px; font-size: 13px; }
```

- [ ] **Step 3: Replace `src/main.ts`**

```ts
import './style.css';
import { config, withUtm } from './config';
import { setupControls } from './game/input';
import { playProperty } from './game/loop';
import { buildSubmission, hubspotEnabled, submitLead } from './hubspot';
import { setupCanvas } from './render/canvas';
import { useContext } from './render/draw';
import { drawScene, updateHints, type SeenHints } from './render/scene';
import { STALL_SECONDS } from './rules/constants';
import { PROPERTIES } from './rules/levels';
import { createRun, resultOf, type Run } from './rules/run';
import { scoreProperty, summarizeRound, type PropertyScore, type RoundSummary } from './rules/scoring';
import { hideHud, showHud, updateHud, type HudElements } from './screens/hud';
import { showFatal, showIntro, showPropertyCard, showTitle } from './screens/panels';
import { showResults } from './screens/results';
import { renderCardBlob } from './share/card';
import { downloadBlob, shareResult } from './share/share';

function byId<T extends HTMLElement>(id: string, type: { new (): T; prototype: T }): T {
  const node = document.getElementById(id);
  if (!(node instanceof type)) throw new Error(`Missing #${id}`);
  return node;
}

const overlay = byId('overlay', HTMLDivElement);
const canvas = byId('board', HTMLCanvasElement);
const hud: HudElements = {
  hud: byId('hud', HTMLDivElement),
  name: byId('hud-name', HTMLSpanElement),
  clock: byId('hud-clock', HTMLSpanElement),
  cut: byId('hud-cut', HTMLSpanElement),
  controls: byId('controls', HTMLDivElement),
};

window.addEventListener('error', () => showFatal(overlay));
window.addEventListener('unhandledrejection', () => showFatal(overlay));

const rng = Math.random;
const seenHints: SeenHints = new Set();
let shown: Run | null = null;
const redraw = () => {
  if (shown !== null) drawScene(shown, seenHints, !shown.ended);
};
useContext(setupCanvas(canvas, redraw));

const controls = setupControls(
  { canvas, hopButton: byId('hop-button', HTMLButtonElement), duckButton: byId('duck-button', HTMLButtonElement) },
  rng,
);
const hubspotTarget = { portalId: config.hubspotPortalId, formGuid: config.hubspotFormGuid };
const SAMPLE_SUMMARY: RoundSummary = { stars: 8, maxStars: 10, efficiency: 97, points: 2330, hoursSaved: 0.8, title: 'Pro' };

async function playRound(): Promise<RoundSummary> {
  const scores: PropertyScore[] = [];
  for (const [index, property] of PROPERTIES.entries()) {
    const run = createRun(property);
    shown = run;
    redraw();
    await showIntro(overlay, property, run.crew, index, PROPERTIES.length);

    showHud(hud, run);
    controls.setRun(run);
    await playProperty(run, rng, () => {
      updateHints(run, seenHints);
      drawScene(run, seenHints);
      updateHud(hud, run);
    });
    controls.setRun(null);
    hideHud(hud);

    const score = scoreProperty(resultOf(run));
    scores.push(score);
    await showPropertyCard(overlay, property, score, STALL_SECONDS * run.hoursPerSecond, index === PROPERTIES.length - 1);
  }
  return summarizeRound(scores);
}

async function main(): Promise<void> {
  await document.fonts.ready;
  if (new URLSearchParams(window.location.search).has('og')) {
    downloadBlob(await renderCardBlob(SAMPLE_SUMMARY), 'margin-mower-og.png');
    return;
  }
  shown = createRun(PROPERTIES[0]);
  redraw();
  await showTitle(overlay);
  for (;;) {
    const summary = await playRound();
    await showResults(overlay, summary, {
      demoUrl: withUtm(config.demoUrl),
      showLeadForm: hubspotEnabled(hubspotTarget),
      onShare: async () => shareResult(await renderCardBlob(summary), summary),
      onSubmitLead: (lead) =>
        submitLead(hubspotTarget, buildSubmission(lead, summary, { pageUri: config.pageUrl, pageName: 'Margin Mower' })),
    });
  }
}

main().catch(() => showFatal(overlay));
```

- [ ] **Step 4: Verify**

Run: `yarn test && yarn build`
Expected: 91 tests pass and the build succeeds.

- [ ] **Step 5: Play it**

Run `yarn dev`. Open the Local URL on desktop, and the Network URL on a phone on the same Wi-Fi.

Check that:

- **Title screen:** North Valley shows behind the panel. Enter or clicking **Start shift** opens the North Valley intro, which has the bold "ride-on crew" tip, the hop and pull help (no duck line), "Budget: 6.0 hrs" and **Go!**.
- **Playing:**
  - The HUD shows "North Valley · Ride-on crew", the clock and the cut %, and the HOP and DUCK·PULL buttons appear.
  - ↑, Space, a canvas tap and the HOP button all hop. ↓ and the DUCK·PULL button pull a weed in reach.
  - A bump stalls the crew for 1 second, shows "+0.Xh" and shakes the screen. The clock turns red over 6.0h.
- **Property card:** shows EFFICIENCY with 0–3 stars and QUALITY with the cut and weeds stars, the bump note, points and **Next property**.
- **Oak Creek:** the intro includes the duck line. Holding ↓ ducks under branches, and hitting the neighbor shows "Sorry, ma’am!".
- **Results:** the title, stars out of 10, the summary line, the 8–10% line, **Book a demo** (opens `bomdata.io/contact/?utm_…` in a new tab), **Share my score** and **Play again**. The lead form is hidden because HubSpot IDs are empty.
- **Share:** on desktop, it downloads `margin-mower-score.png` (1200×627, no 8–10% line) and opens a LinkedIn tab, or the system share sheet opens. On a phone, the share sheet opens with the image.
- **`/?og`:** downloads `margin-mower-og.png`.
- **Lead form:** temporarily set `hubspotPortalId: '1'` and `hubspotFormGuid: 'test'`.
  - The form appears after a round.
  - A bad email shows "Please enter a valid email."
  - A valid email shows "Couldn't save, try again" (the fake IDs are rejected).
  - **Revert both to `''`.**
- **Play again:** returns to the North Valley intro.

Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add index.html src
git commit -m "feat: add screens, styles and the full game flow"
```

---

### Task 10: Deploy workflow and README

**Files:**
- Create: `.github/workflows/deploy.yml`, `README.md`

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

**Can you mow on budget?** This is a cartoon side-scrolling mowing game from BomData, built to share on LinkedIn. It is hosted on GitHub Pages and embedded at https://bomdata.io/margin-mower/.

- **Design:** `docs/superpowers/specs/2026-09-16-margin-mower-design.md`
- **Approved prototype (the look-and-feel reference):** `prototype/margin-mower-runner.html` and `prototype/sprite-gallery.html`

## Develop

Requires Node 24 and yarn.

```sh
yarn          # install
yarn dev      # play locally; the "Network" URL works on your phone on the same Wi-Fi
yarn test     # rules, scoring, level playthrough and helper tests
yarn build    # typecheck and build to dist/
```

- `/dev/peek.html?p=1&at=380&duck=1` on the dev server shows a still frame of a level, which is handy for art changes.
- `/?og` downloads a sample score image to use as the social preview image.

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

- [ ] ↑ / Space / tap hops; ↓ ducks (hold) and pulls weeds; the on-screen buttons do the same
- [ ] Pressing the game controls never scrolls the page
- [ ] Both properties, their property cards and the scorecard appear; Play again restarts
- [ ] Share opens the phone share sheet (or downloads the image and opens LinkedIn on desktop)
- [ ] A lead form submission appears in HubSpot with score and stars
- [ ] Book a demo opens `bomdata.io/contact/` with `utm_campaign=margin-mower`
- [ ] LinkedIn Post Inspector shows the preview image and title
````

- [ ] **Step 3: Verify**

Run: `yarn test && yarn build`
Expected: everything passes.

- [ ] **Step 4: Commit**

```bash
git add .github README.md
git commit -m "chore: add GitHub Pages deploy workflow and launch README"
```

---

### Task 11: Device playtest and launch handoff (with the user)

- [ ] **Step 1: Playtest.** With `yarn dev`, have the user play both properties on a phone (Network URL) and on desktop. Watch for these:
  - control lag or accidental page scrolling
  - hint bubbles covering obstacles
  - text that's too small at phone width
- [ ] **Step 2: Tune only if asked.** Adjust speeds, the hop and levels in `src/rules/`.
  - Re-run `yarn test` after every change.
  - The playthrough tests must stay green. If a level change breaks them, fix the level.
  - Commit with `tune: …`.
- [ ] **Step 3: Hand off.** Point the user to the README sections "Publish to GitHub Pages", "Add it to bomdata.io" and "HubSpot lead form". Pushing to GitHub, publishing the WordPress page and creating the HubSpot form are the user's actions, or need their explicit go-ahead first.
