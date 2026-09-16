# Margin Mower — Design

**Tagline:** Can you mow on budget?
**Goal:** A cartoon browser game posted on LinkedIn that gets commercial landscapers (Aspire users) to bomdata.io, captures leads in HubSpot and drives demo bookings.
**Page:** `bomdata.io/margin-mower` (WordPress), embedding the game hosted on GitHub Pages.
**Reference implementation:** `prototype/margin-mower-runner.html` and `prototype/sprites.js` (style B). Both were approved through playtesting. Where this spec and the prototype disagree, the spec wins. Otherwise the prototype's look and feel is the target.

## Why this game

It mirrors what landscape managers actually deal with. BomData shows which properties run over or under hours so managers can plan the week.

| Real problem | In the game |
|---|---|
| Over hours (crew slowed by obstacles, poor sequencing) | Bumping an obstacle stalls the crew while the clock runs |
| Under hours from skipped work | Hopping over grass leaves it uncut; unpulled weeds are flagged |
| Wrong crew for the site | BomData assigns the crew: a ride-on for open turf, a push crew for tight, treed sites |
| BomData gives clarity before the week starts | A "BomData heads-up" card before each property |

## Gameplay

It's a side-scrolling runner. The crew drives right automatically, and the camera follows. A round is two properties, each ending at a checkered finish flag. There's no time cap: every run reaches the finish.

| # | Property | Crew | Obstacles | Weeds | Backdrop |
|---|---|---|---|---|---|
| 1 | North Valley Office Park | Ride-on (can't duck) | Hop: sprinkler, rock, picnic table, boy walking a dog. No trees. | 4 | Office buildings, hedges |
| 2 | Oak Creek HOA | Push crew | Hop: rock, shrub, neighbor with a cane. Duck: low branches. | 7 | Houses, white picket fences, mailboxes, trees |

### Controls

| Action | Keyboard | Touch | Mouse |
|---|---|---|---|
| **Hop** | ↑, Space, W | Tap or flick up anywhere on the game, or tap **⬆ HOP** | Click the game or **⬆ HOP** |
| **Duck** | ↓, S | Flick down anywhere on the game, or tap **⬇ DUCK · PULL** | **⬇ DUCK · PULL** |
| **Pull weed** | ↓ or S while passing a weed | The same flick or tap, while passing a weed | The same button |

- **Duck timing:** every duck press lasts 1.2 s (`DUCK_SECONDS`), which is enough to clear the longest branch. Holding the key, button or finger keeps the crew ducked longer. Hopping cancels a timed duck.
- **Touch gestures:**
  - A mostly vertical swipe of at least 18 CSS px is a flick.
  - A touch that moves less than that and ends within 250 ms is a tap.
  - Gestures work anywhere on the page except on the two control buttons.
  - While playing, `body.playing` sets `touch-action: none` and turns off the iOS long-press callout, so flicks never scroll the page, including the WordPress page around the embed.
- Hop only works on the ground and not while stalled.
- Duck only works for the push crew.
- Pulling works for both crews. It pulls the nearest unpulled weed within reach and never stalls the crew.

### World (logical units; the canvas is 480 × 270)

- **Level format:** a string where each character is one 24-unit column.
  - `.` grass
  - `_` dirt pad
  - `=` walkway
  - `b` bed
  - `w` bed with a weed
  - `r` rock
  - `s` sprinkler
  - `c` picnic table
  - `h` shrub
  - `L` neighbor with a cane
  - `D` boy walking a dog
  - `B` low branch over grass
- **Ground line:** y = 196. The lawn strip runs from y 160 to 216, with a sidewalk above and a street below.
- **Mowable columns:** `.` and `B`. A column is mowed when the crew is on the ground while its center is over that column.
- **Hop obstacles** sit on dirt pads. The whole column from the sidewalk to the curb is dirt, with no grass.
- **Consecutive `B` columns** form a single branch: one obstacle, one possible bump.
- **Levels (exact):**
  - North Valley: `..........__s__........__r__......bwbb......__c__.........__s__....__D__........bbwb.....__s__..__r__.........__c__......bwbbwb.......__r__..........`
  - Oak Creek: `........_r_......BB.....bwbwb...._h_....BB.._L_.....bwbbw...BBB...._h_..bwb...._h_...BB..._r_....bbwbwb....BB.._h_........`

### Physics and tuning

| Constant | Value |
|---|---|
| Gravity | 930 units/s² |
| Hop launch speed | 300 units/s (about 0.65 s in the air, about 48 units high) |
| Ride-on speed | 165 units/s; hit box height 44 |
| Push crew speed | 128 units/s; hit box height 43 standing, 34 ducking |
| Crew hit box width | 20 (±10 around the crew's position) |
| Weed reach | ±33 |
| Bump stall | 1 s. The crew stops, the clock keeps running, and "+x.x hrs" floats up. |
| Start / end | Starts at position 12; ends at level length + 36 |
| Frame step cap | 0.05 s |

Obstacle hit boxes (width × height, sitting on the ground):

| Obstacle | Width × height |
|---|---|
| Rock | 15 × 12 |
| Sprinkler | 9 × 9 |
| Picnic table | 28 × 17 |
| Shrub | 21 × 18 |
| Neighbor with a cane | 15 × 27 |
| Boy walking a dog | 30 × 26 |

- **Branch hit box:** 33 wide per column, spanning the whole group, from y 96 to y 158. A standing push crew hits it; a ducking crew clears it.
- **Hitting the neighbor** also shows "Sorry, ma'am!"
- **Budget:** 6.0 hours per property. Budget seconds = level length ÷ crew speed + 1.5, and displayed hours = elapsed seconds × (6 ÷ budget seconds). A perfect run finishes about 0.4 hours under budget.

### Feedback

- **First-time hint bubbles** ("⬆ HOP", "⬇ DUCK", "⬇ PULL") bob above the first obstacle of each kind and the first weed. They stop showing once the crew passes them.
- **Grass clippings** fly while mowing, and bumps shake the screen and scatter debris.
- **Weed feedback:** "+50" when a weed is pulled. A weed that passes out of reach shows "missed" and a red "!".
- **HUD:** short property name · crew, and `NN% cut`.
- **Labor budget gauge:** drawn at the top of the canvas during play only (hidden behind the title and intro screens).
  - It reads "LABOR HOURS LEFT" with "x.x of 6.0" (the same tenths of an hour as the property card), and the bar drains as hours are used.
  - The bar is green while more than 25% of the budget remains, and yellow after that.
  - Once over budget, it reads "OVER BUDGET +x.x hrs" with a full coral bar.
  - It replaces the old route-progress bar.

## Scoring (per property, maximum 5 stars; round maximum 10)

- **Efficiency %** = round(budget ÷ hours used × 100), not capped, so finishing early scores over 100% (6.0 budgeted in 5.6 actual is 107%).
  - Stars: above 95 → ★★★, above 80 → ★★, above 70 → ★, otherwise none.
- **Quality:**
  - ★ for a 100% cut (floor of mowed ÷ mowable × 100 equals 100).
  - ★ for pulling every weed.
- **Points:**
  - +10 per mowed column.
  - +50 per pulled weed.
  - When on budget and the cut is 100%: +10 per whole 0.1 hour under budget.
  - When over budget: −10 per whole 0.1 hour over.
  - Clean run bonus: +100 when there were no collisions.
- **Hours saved:** budget − hours used, counted only when on budget and both quality stars were earned.
- **Round totals:**
  - Stars and points are summed across the properties.
  - Hours saved is summed and rounded to 0.1.
  - Overall efficiency = round(total budget ÷ total hours used × 100).
- **Titles by total stars:** 10 Margin Master, 8–9 Pro, 5–7 Crew Lead, 0–4 Rookie.
- **Minimum star:** a player who never hops always cuts 100%, so every finished property earns at least one star.

## Screens

1. **Title:** the BomData logo, "Margin Mower", "You’ve got 6 hours. Don’t blow the labor budget." (bold), "Two properties. One crew. / Finish the route before your hours run out." and **Start shift**. The first property is drawn behind the panel with no hint bubbles.
2. **Property intro** (copy lives in each property's `intro` in `levels.ts`):
   - "Property N of 2" and the property name.
   - A pitch box with no label.
     - North Valley: "Open turf + no trees = a good ride-on job." / "Move cleanly and this property should come in under budget."
     - Oak Creek: "Low branches, weedy beds, and neighbors out for a walk." / "BomData matched a push crew that can duck under trees and get into the beds."
   - Control lines with the key in bold:
     - North Valley: "**↑ HOP** obstacles" and "**↓ PULL WEEDS** as you pass".
     - Oak Creek: adds "**↓ DUCK** under low branches", and its HOP line reads "rocks, shrubs and neighbors".
   - The warning "Don’t overdo the jumping." / "Airborne mowers don’t cut grass."
   - "6.0 hrs budgeted" and a **LET’S MOW** button.
   - The level is drawn behind the panel.
3. **Playing:** HUD, canvas and the two control buttons.
4. **Property card** (wording in `src/screens/cardCopy.ts`):
   - Property name.
   - **ON BUDGET. FULL QUALITY.**: a tilted yellow badge that pops in when the property is on budget with both quality stars.
   - Stars out of 5.
   - **LABOR PERFORMANCE:**
     - "NNN% efficiency" with 0–3 stars.
     - Budget and Actual (in hours).
     - A variance line:
       - green "0.4 hrs saved"
       - amber "0.4 hrs under budget, but work was skipped" when a quality star is missing
       - coral "0.9 hrs over budget"
       - "Right on budget" when within a tenth of an hour
   - **QUALITY:**
     - "Grass cut: N%" ★, with "Hopping over grass left it uncut." under it when it isn't 100%.
     - "Weeds pulled: x/y" ★.
     - "No collisions ✓" with "Clean run bonus: +100", or "N collisions (+X hrs) ✗".
   - **Payoff:** a large headline ("0.4 labor hours saved" / "0.9 labor hours over budget" / "No labor hours saved" / "Right on budget"), then smaller "+1,140 pts".
   - **HEAD TO PROPERTY 2 →**, or **See my scorecard** after the last property.
5. **Results** (wording in `shiftCardCopy`, `src/screens/cardCopy.ts`):
   - "Weekly scorecard", the title, the **ON BUDGET. FULL QUALITY.** badge (when every property earned it), and stars out of 10.
   - **LABOR PERFORMANCE:**
     - Overall efficiency with 0–3 stars.
     - Budget 12.0 hrs and the actual total.
     - A net variance line: "0.8 hrs saved", "0.5 hrs over budget", "0.8 hrs under budget, 0.4 hrs saved", "… but work was skipped", or "Right on budget".
   - **QUALITY:** combined grass cut %, weeds pulled and collisions, each with ✓ or ✗.
   - **BY PROPERTY:** each property's short name, its efficiency and its stars out of 5.
   - **Payoff:** the labor-hours headline, then smaller "+2,280 pts".
   - "Real crews using BomData improved labor efficiency 8–10%." This line never appears on the share image.
   - The small logo, **Book a demo** (always visible), **Share my score** with a status line, the optional HubSpot form, and **Play again**.
   - `RoundSummary` also carries `budgetHours` and `hoursUsed`, so the summary line and the share image can say "N hrs over budget" (net across the shift) instead of hours saved. Otherwise they show hours saved, "right on budget" or "no hours saved".
   - Summary line: `⭐ 8/10 · 97% efficiency · 0.8 hrs saved · 2,330 pts`.
   - Share image: "97% EFFICIENCY | 0.8 HRS SAVED", with a smaller "2,330 PTS" line under it.

Focus moves to each panel's first button, so Enter or Space works on a keyboard. The coral focus outline shows only after a key is pressed (`body.using-keyboard`), and pointer input hides it again. Game keys are only handled while playing.

## Visual style (style B, "bold cartoon")

- **Scene:** a Paperboy-like 3/4 lawn strip with a sidewalk behind and a street with parked cars in front.
  - The backdrop scrolls at 0.85× speed: 3/4-view glass office buildings with "N.VALLEY" signs and hedges, or 3/4-view houses with white picket fences along the back edge of the sidewalk (a gap at each front walk), mailboxes and trees behind.
  - Clouds scroll at 0.1×.
- **Art style:** 2-unit dark outlines (`#1b1b24`), big heads with caps and faces, and highlights.
- **Sprites:** all art is drawn in code with no image files. It must match `prototype/sprites.js` style B:
  - ride-on crew
  - push crew (walking and ducking)
  - rock
  - sprinkler with water arcs
  - picnic table with basket
  - berry shrub
  - neighbor with a cane
  - boy walking a dog
  - dandelion weed (plus the missed marker)
  - low branch with a leaf-cluster tree crown
- **Lawn:**
  - Unmowed grass is dark with tufts; mowed columns alternate between two light-green stripes.
  - Beds are rounded mulch patches with stone edging and small shrubs.
  - Pads are full-height dirt with pebbles.
- **Scaling:** the canvas fills the space available (up to 2.2×) at device-pixel resolution, so edges stay smooth rather than pixelated.
- **Fonts:** Press Start 2P for headings and the HUD; DM Sans for body text.
- **Brand colors (from the BomData logo):** green `#6FC062`, yellow `#FFCC49`, coral `#F47D6D`, ink `#231F20`.
  - Primary buttons are green with ink text; secondary buttons, control buttons and the progress bar use yellow.
  - Text accents on light panels use a darker green, `#2F7A2A`, so they stay readable.
  - Coral is for warnings (overtime clock, bump cost) and focus outlines.
  - The crew wear green and yellow.
- **Logo:** `src/assets/bomdata-logo.png` (the bomdata.io logo with dark text on a transparent background) appears:
  - at the top of the title panel, linking to bomdata.io
  - above **Book a demo** on the scorecard
  - in the top-left corner of the share image

## Build

### Stack

- A new repo, `margin-mower`, on the user's personal GitHub.
- TypeScript, Vite and an HTML canvas. No game engine and no runtime dependencies.
- Tests use Vitest, and packages are managed with yarn.
- Vite `base: './'`.

### Code layout

- `src/rules/` (pure, no DOM, unit-tested):
  - `constants.ts`
  - `crews.ts`
  - `levels.ts` (level strings, obstacle table, parsing)
  - `run.ts` (run state, hop / duck / pull, tick)
  - `scoring.ts`
- `src/render/` (drawing):
  - `canvas.ts` (fit and scale)
  - `draw.ts` (helpers)
  - `sprites.ts` (style B only)
  - `scenery.ts` (sky, clouds, backdrops, sidewalk and street, lawn)
  - `scene.ts` (the full frame, including hints, floats, particles, flag and progress bar)
- `src/game/`:
  - `input.ts` (keys, buttons, canvas tap)
  - `loop.ts` (the animation loop for one property)
- `src/screens/`: title, intro, HUD, property card, results, fatal error.
- `src/share/`: summary text, the 1200×627 score card, share or download.
- `src/hubspot.ts`, `src/config.ts`, `src/main.ts`.

Particles and floating text are visual effects. They stay in `run.ts` state so the loop stays simple, but their random values come from an injected random-number function so tests are deterministic.

### Hosting, sharing and HubSpot (unchanged from the approved plan)

- **Hosting:** GitHub Actions tests, builds and deploys to GitHub Pages on every push to `main`.
- **WordPress:** a full-width page with a Custom HTML block containing an iframe (`allow="web-share"`, `height: 100vh`), plus a social preview image.
- **Share:**
  - Phones use the native share sheet with a PNG.
  - Desktop downloads the PNG and opens a LinkedIn share link for `https://bomdata.io/margin-mower/`.
  - `?og` downloads a sample card for the social preview image.
  - Share text: "I scored 8/10 stars with 97% efficiency in Margin Mower. Can you mow on budget? https://bomdata.io/margin-mower/"
- **HubSpot:**
  - An optional form (first name, company, email) sent to the public Forms API, with hidden `margin_mower_score` and `margin_mower_stars` fields.
  - It's hidden until the portal ID and form GUID are set in `config.ts`.
  - If sending fails, the form shows "Couldn't save, try again".
- **Demo link:** `https://bomdata.io/contact/?utm_source=linkedin&utm_medium=game&utm_campaign=margin-mower`.
- **Errors:** any uncaught error shows a "Something went wrong / Reload" panel.

## Testing

- **Unit tests** for:
  - level parsing, including branch grouping and pad handling
  - the hop arc, and that hop and duck are refused when they shouldn't work
  - pull reach and missed weeds
  - bumps (stall, one hit per obstacle, ducking clears a branch, standing hits it)
  - mowing only while on the ground
  - the end condition
  - scoring: efficiency star thresholds, quality stars, points, hours saved, titles and round totals
- **Level tests using a scripted player:**
  - For each property there is a timing window where a scripted player finishes with no bumps and 5/5 stars.
  - A player who does nothing still finishes, with at least one star.
- **Manual pass** on iPhone Safari, Android Chrome and desktop Chrome/Safari, both standalone and inside the WordPress page: controls, share, HubSpot submission, demo link and UTM tags.

## Out of scope (v1)

- Leaderboard
- Sound
- Diagonal (true Paperboy) scrolling
- Styles A and C
- More than two properties
- Analytics beyond HubSpot page tracking
- Accounts
