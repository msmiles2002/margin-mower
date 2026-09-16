# Margin Mower — Design

**Tagline:** Can you mow on budget?
**Goal:** A cute, pixel-art browser game posted on LinkedIn that gets commercial landscapers (Aspire users) to bomdata.io, captures leads in HubSpot, and drives demo bookings.
**Page:** `bomdata.io/margin-mower` (WordPress), embedding the game hosted on GitHub Pages.

## Why this game

It mirrors what landscape managers actually do. BomData shows which properties are over or under hours so managers can plan the week:

| Real problem | In the game |
|---|---|
| Over hours: crew needs coaching on sequencing and equipment use | Messy paths and re-mowing tiles burn the hours budget |
| Way under hours: crew is skipping weeding or services | The site walk flags missed turf and weeds; skipped work earns no "hours saved" |
| Wrong crew for a complex property | Crew pick before each property; the wrong crew goes over budget or can't reach tight areas |
| BomData gives clarity before the week starts | "BomData heads-up" tip before each property |

## Gameplay

A round is three properties, about 30 seconds each, roughly 2 minutes in total including the screens between properties.

1. **Office Park:** mostly open turf, few beds. The ride-on crew is the right pick.
2. **HOA:** many beds, more weeds.
3. **Hospital Campus:** many narrow strips. The push crew is the right pick.

### Board

- Portrait grid, 12 columns × 16 rows, scaled by whole-number multiples to fit the screen (pixel-perfect).
- Tile types:
  - **turf:** must be mowed
  - **narrow turf:** must be mowed; the ride-on crew can't enter it
  - **bed:** can't be mowed; weeds can appear here
  - **obstacle:** trees and buildings; can't be entered
  - **path:** can be driven on; nothing to mow
- Mowed turf shows alternating stripes.
- Each property is a hand-built layout stored as data.

### Controls

- **Drag:** the mower moves one tile at a time toward the tile under the finger, in 4 directions, taking the greedy axis first, at the crew's speed. It stops when blocked.
- **Tap a weed (finger lifted):** pulls the weed. The mower pauses for 1 second.
- **Done button:** ends the property early.
- The canvas sets `touch-action: none` so dragging never scrolls the page.

### Crews (chosen before each property)

| Crew | Speed | Limitation |
|---|---|---|
| Ride-on | 12 tiles/sec | Can't enter narrow turf |
| Push | 6 tiles/sec | None |

Speeds, budgets and weed rates are starting values to tune during playtesting.

### Clock

- Each property has a budget of 6.0 displayed hours = 30 real seconds (1 second = 0.2 hr).
- Once the budget is used up, the clock turns red and counts overtime.
- The property ends automatically at +50% of budget (9.0 hrs), or when the player taps Done.

### Weeds

- Weeds spawn on random bed tiles over time. The rate is set per property; the HOA has the highest.
- Weeds still unpulled at the end count against the player.

### Site walk

- A 2–3 second animation: a manager sprite walks the property and drops flags on unmowed turf and unpulled weeds.
- Then a mini scorecard: hours used / budget, and the stars earned.

### BomData heads-up

Shown before each property's crew pick, in a BomData-branded card. Each tip is one line naming the property's key risk and hinting at the right crew. Examples:
- "Hospital Campus: tight strips; push crew recommended."
- "HOA: beds get weedy; save time for them."

## Scoring

### Stars (per property, maximum 3; maximum 9 per round)

- ⭐ **On budget:** finished with hours used ≤ budget.
- ⭐ **Clean cut:** at least 95% of mowable tiles are mowed.
- ⭐ **No weeds:** no weeds left unpulled when the property ends.

### Points

- **+10** per tile mowed (first time only).
- **+50** per weed pulled.
- **+10** per 0.1 budget hour left over. **Only awarded if Clean cut was earned.**
- **−10** per 0.1 hour of overtime.

### Hours saved (round total)

Sum of (budget − hours used) over the properties that finished on budget **and** earned Clean cut.

### Final title (by total stars)

| Stars | Title |
|---|---|
| 0–3 | Rookie |
| 4–6 | Crew Lead |
| 7–8 | Pro |
| 9 | Margin Master |

## Screens

1. **Title:** "Margin Mower: Can you mow on budget?" with a Start button. Nothing to fill in before play.
2. **Heads-up and crew pick:** shows a preview of the property, the budget, the BomData tip, and the two crew buttons.
3. **Mowing:** top bar shows property name, the hours clock, coverage %, and the Done button.
4. **Site walk and mini scorecard:** then continue to the next property.
5. **Results:** styled like a BomData weekly scorecard:
   - `⭐ 7/9 · 4,820 pts · 1.4 hrs saved · Pro`
   - One line that is never included in the share image: "Real crews using BomData improved labor efficiency 8–10%."
   - **Share:** on phones, the native share sheet (`navigator.share` with the PNG). On desktop, download the PNG and open a LinkedIn share link for the page URL.
   - **Optional form:** first name, company, email, sent to HubSpot.
   - **Book a demo** (always visible) and **Play again**.

## Build

### Repo and stack

- New repo `margin-mower` on the user's personal GitHub.
- TypeScript, Vite, and an HTML canvas. No game engine. Tests use Vitest; packages are managed with yarn.

### Code layout

- `src/rules/`: pure game logic with no DOM access.
  - `grid.ts`: tiles, movement, coverage
  - `crews.ts`
  - `weeds.ts`
  - `scoring.ts`: stars, points, hours saved, title
  - `properties.ts`: the three layouts, budgets, weed rates, tips
- `src/game/`: game loop and input. Turns pointer events into mower movement and weed taps, and advances the rules on each tick.
- `src/render/`: canvas drawing and sprites.
- `src/screens/`: title, crew pick, mowing HUD, site walk, results. Built as DOM overlays on top of the canvas.
- `src/share/`: draws the result card to a PNG; share and download.
- `src/hubspot.ts`: form submission.
- `src/config.ts`:
  - HubSpot portal ID and form GUID
  - demo URL
  - page URL

### Art

- Pixel sprites for mower, crews, weeds, trees, buildings, beds, manager and flags.
- Sources: CC0 packs (for example Kenney) or simple sprites made for this game.
- Brand colors are taken from bomdata.io.
- Sound: none in v1.

### Hosting

- A GitHub Actions workflow builds the game and deploys it to GitHub Pages on every push to `main`.
- The WordPress page `bomdata.io/margin-mower` uses:
  - a full-width template
  - a Custom HTML block containing an iframe of the Pages URL (full width, `height: 100vh`, `allow="web-share"`)
  - a social preview image and title set for LinkedIn.
- Note: sharing from inside the iframe requires the `web-share` permission. If the phone's share sheet is still blocked, the download fallback is used.

### HubSpot

- A new form with fields `firstname`, `company`, `email`, plus hidden custom contact properties `margin_mower_score` and `margin_mower_stars`.
- Submitted from the browser to the public Forms API: `api.hsforms.com/submissions/v3/integration/submit/{portalId}/{formGuid}`.
- The submission includes `pageUri` and `pageName`.
- On failure, show "Couldn't save, try again". The game never blocks on this.

### Demo link

The bomdata.io demo page with `utm_source=linkedin&utm_medium=game&utm_campaign=margin-mower`.

### Asset loading errors

If sprites fail to load, show a plain "Reload" message rather than a blank canvas.

## Testing

- **Unit tests (Vitest)** for `src/rules/`:
  - movement blocking, including ride-on vs narrow turf
  - coverage counting with no double counting
  - clock and overtime auto-end
  - each star rule
  - points, including the Clean cut gate on the leftover-hours bonus
  - hours saved and title thresholds
  - each property layout is valid: every mowable tile can be reached by the push crew
- **Manual pass** on iPhone Safari, Android Chrome and desktop Chrome/Safari, both on the standalone Pages URL and inside the WordPress page. Check:
  - dragging doesn't scroll the page
  - share or download works
  - the HubSpot submission arrives
  - the demo link carries the UTM tags

## Out of scope (v1)

- Leaderboard
- Sound
- More than 3 properties or randomized layouts
- Extra analytics beyond HubSpot page tracking
- Accounts or saved progress
