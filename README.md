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
   git remote add origin https://github.com/msmiles2002/margin-mower.git
   git push -u origin main
   ```
3. In the repository, open **Settings → Pages**. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Open the **Actions** tab and wait for **Deploy to GitHub Pages** to finish. The game is then live at `https://msmiles2002.github.io/margin-mower/`.

Every later push to `main` re-runs the tests and redeploys.

## Add it to bomdata.io (WordPress)

1. In WordPress, go to **Pages → Add New** and give the page the title **Margin Mower**. Set the permalink slug to `margin-mower`.
2. Choose a full-width template with no sidebar. On Divi, that's **Page Attributes → Template → Blank Page**, or **Full Width** if you want to keep the site header.
3. Add a **Custom HTML** block containing:
   ```html
   <iframe
     src="https://msmiles2002.github.io/margin-mower/"
     title="Margin Mower: Can you mow on budget?"
     allow="web-share; clipboard-write"
     style="display:block;width:100%;height:100vh;border:0;"
   ></iframe>
   ```
4. Set the page's social sharing image to `docs/margin-mower-og.png` (or download a fresh one from `/?og`). Use your SEO plugin's **Social** tab, or the page's featured image. Title: *Margin Mower: Can you mow on budget?*
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

check both `https://msmiles2002.github.io/margin-mower/` and `https://bomdata.io/margin-mower/`:

- [ ] ↑ / Space / tap hops; ↓ ducks (hold) and pulls weeds; the on-screen buttons do the same
- [ ] On a phone held upright, the game fills the top of the screen, the thumb pad fills the bottom, and panels open as bottom sheets
- [ ] Pressing the game controls never scrolls the page
- [ ] Both properties, their property cards and the scorecard appear; Play again restarts
- [ ] Share opens the phone share sheet (or, on desktop, downloads the image, copies the caption and shows an Open LinkedIn button)
- [ ] A lead form submission appears in HubSpot with score and stars
- [ ] See how BomData works opens `bomdata.io` with `utm_campaign=margin-mower`
- [ ] LinkedIn Post Inspector shows the preview image and title
