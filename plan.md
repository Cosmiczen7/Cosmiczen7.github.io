# ash777.me — November Update Plan

> Written for future coding agents and for the site owner (Ash). Read this before
> changing the site's look or structure. It records **what was decided, why, and
> how it's built**, so nobody has to re-derive it. Decisions came from a design
> interview ("grilling") on 2026-11-09. If you change a decision, update this file.

Working branch for this update: `November-updates-2`.
Do **not** commit or push unless the owner asks.

---

## 1. What the site is

A personal GitHub Pages site (`ash777.me`, see `CNAME`): a **Windows 7 Aero /
Frutiger Aero nostalgia playground**. It is **aesthetic-first**; projects/resume are
secondary. Plain static HTML + CSS + vanilla JS. **No build step, no framework,
no package manager.** Keep it that way unless the owner says otherwise.

The Frutiger Aero *imagery* already lives in the five wallpapers
(`assets/*.jpg|webp`). Do **not** add bubbles, lens flares, grass, etc. The job is to
refine the **glass**, not to add new motifs.

### File map

| Path | Role |
| --- | --- |
| `index.html` | Home. Real (short) content in a frosted card. |
| `about.html`, `projects.html`, `resume.html`, `fun.html` | **Stubs.** Identical shell, only the card differs. Stay stubs (see §3). |
| `old.html` | Orphaned earlier green "Harmony" design. Unreferenced. **Keep** (owner's call). |
| `assets/css/style.css` | All styling. Single file. |
| `assets/js/slideshow.js` | Wallpaper crossfade (60 s) + footer clock + wallpaper button. |
| `assets/js/ribbon-cutout.js` | Canvas alpha-mask so the nav ribbon's frosted pane is cut out under the buttons. |
| `assets/js/webamp-init.js` | Loads + configures Webamp (player, tracks, skin, autoplay). |
| `assets/js/webamp.bundle.min.js`, `assets/skins/*` | Vendored Webamp + XMMS Turquoise skin. |
| `assets/audio/*.mp3` | Tracks. Large (7–10 MB each). Not touched this round. |
| `assets/js/glass.js` | **New.** Refraction toggle + per-button displacement map + rim light. |
| `assets/js/nav-swap.js` | **New.** Navigates without reloading so Webamp/wallpaper keep running. |
| `assets/fonts/` | **New.** Selawik (Segoe UI lookalike, SIL OFL 1.1) woff2: regular, semibold, bold + license. |

Every page carries a **full copy** of header + ribbon + footer (deliberate, see §3).
When you change shared markup, **edit all five pages**.

---

## 2. Design decisions (the interview results)

| # | Question | Decision | Why |
| --- | --- | --- | --- |
| 1 | Purpose | Aesthetic-first playground | Vibe is the point; readability only needs to be good enough. |
| 2 | Visual push | Keep look; make the glass "slightly better". No new Aero motifs. | Wallpapers already supply the Frutiger Aero imagery. |
| 3 | Glass upgrades | Subtle hover + focus states; richer edges/depth; real refraction on buttons | Owner picked these three. **Card readability was NOT selected — leave the card's transparency alone.** |
| 4 | Refraction default | ~~Off, opt-in~~ → **ON by default** (owner changed this in round 2). Toggle stays in the taskbar; a visitor's saved choice wins; default is off only if the OS asks for reduced transparency. | Owner wants the effect seen. Still zero work when off, and still hidden where unsupported. |
| 5 | Refraction look | **Edge-lens** (canvas displacement map), not full-area noise | Reads as thick glass; the old unused turbulence filter looked like heat haze. |
| 6 | Page transitions | **Swap content without reload** (fetch + history API) | Webamp keeps playing; wallpaper doesn't reset. Pages stay real files (direct links + no-JS still work). |
| 7 | Webamp spot | **Bottom-right, docked above a fixed taskbar** | Clears title/nav. Footer becomes a *fixed* taskbar (reverses the old "non-persistent footer" choice). |
| 8 | Autoplay | On first click, at **~50% volume** (was 100%) | Keeps the intended vibe without blasting speakers. |
| 9 | Phones (≤720 px) | **Hide Webamp entirely** (don't even download it) | Small screens; mobile browsers block audio anyway. |
| 10 | Stub pages | **Stay stubs, polish only.** Consistent icons instead of emoji. | Don't build layouts for content that doesn't exist. Owner writes content later. |
| 11 | Homepage header | Keep owner's text verbatim; badge "Personal Blog" → truthful status badge | There is no blog. Default wording: **"Under construction"** (owner may change). Same header-bar + badge on stubs. |
| 12 | Shared shell | **Keep full copies in every page** | Works without JS, no build. Cost: edit 5 files for nav/footer changes. |
| 13 | Font | **Bundle Selawik** locally | Segoe UI only exists on Windows; Selawik is its open (SIL OFL 1.1) metric-compatible twin. Windows users still get real Segoe UI first. ~14 KB per weight (regular/semibold/bold = ~44 KB). Keep `Selawik-OFL-LICENSE.txt` next to the fonts (OFL requires the license ship with them) and don't modify/rename the font files' internals. |
| 14 | Cleanup | Keep `old.html` and the `.m4a` | Owner's call. |

### Round 2 decisions (owner feedback after trying round 1, 2026-11-09)

| # | Topic | Decision | Why / root cause |
| --- | --- | --- | --- |
| 15 | Autoplay | Music must start without pressing Webamp's play button. A browser **cannot** play sound with zero interaction on a first visit, so: try at load, and arm a first-interaction fallback (click / key / tap anywhere) that actually starts playback. Keep 50% volume. | Round 1 was broken: Webamp's store reports `PLAYING` even when the browser blocked the audio (AudioContext `suspended`, `timeElapsed` stuck at 0), and `webamp.play()` returns no promise, so the old "play on first click" fallback was never armed. After a click only the context resumed; the track never restarted. |
| 16 | Top bar glass | Bar background = **textured frosted glass** (visible fine grain/etched texture + frost), *not* smooth blur. The **clear refracting buttons stay exactly as they are** (cut out of the frost). | Owner request. Grain must live on `.ribbon-glass-pane` so the existing button cutout mask carries over. |
| 17 | Top bar layout | **Sleeker:** compact floating capsule that hugs its buttons (not a full-width slab), slimmer, pill-shaped buttons. Phones: 2×2 grid. | Owner asked for sleeker layout. Pill radius is read from CSS by `ribbon-cutout.js` and `glass.js` (no hard-coded radius). |
| 18 | Title | Text becomes **"Welcome to Ash777's Website!"** (capital A and W, matching the owner's "Ash777" sign-off), set in a lighter, sleeker type (Selawik/Segoe UI **Light**, two-weight: name in semibold). Tab titles follow. | Owner request. Light weight is authentic Win7 (Segoe UI Light headings). |
| 19 | Wallpaper fade | The crossfade must actually fade. **Root cause:** this machine (and likely the owner's) reports `prefers-reduced-motion: reduce`, and round 1's reduced-motion block set `transition: none` on the wallpaper, so it snapped. Fix: a slow opacity dissolve is *not* motion, so wallpaper/hover colour fades are no longer disabled; reduced-motion now only removes real movement (hover lifts). Also fixed the mid-fade dark dip: the new image fades in over a still-solid old one instead of both fading at once. | Owner noticed abrupt switching. |
| 20 | `plan.md` visibility | `plan.md` stays in the repo for agents but must **not** be served by GitHub Pages. `_config.yml` lists it under Jekyll `exclude`. | Owner didn't intend to publish it. See §3.8 for the caveat (works only for branch-based Pages builds; **don't add `.nojekyll`**). |
| 21 | Process | Every change round must update this file (decisions, spec, checklist, verification log) as part of the work. | Owner instruction. |

---

## 3. Implementation spec

### 3.1 Glass refinements (CSS, `style.css`)
- **Nav buttons**: hover = gentle brighten + glow (colour/shadow only, `transition` ≤ 0.15 s,
  **no transform, no movement** — the owner removed hover movement on purpose).
  `:focus-visible` = clear 2 px ring + cyan glow (previously `outline: none` with no replacement).
  Active page = stronger tint/glow; also set `aria-current="page"`.
- **Richer edges**: layered inset highlights/shadows on ribbon, card and taskbar; a faint top
  gloss band on the card. Keep it subtle.
- **Taskbar**: `position: fixed; bottom: 0`. `.page-wrapper` gets bottom padding so content is
  never hidden under it.
- `@media (prefers-reduced-transparency: reduce)` → panes become more opaque.
  `@media (prefers-reduced-motion: reduce)` → only removes real **movement** (hover lifts on
  `.back-home-btn` / `.footer-icon-link`). It must NOT touch the wallpaper dissolve or colour fades
  (see decision 19: that mistake made the wallpaper snap on machines that report reduced motion).
- Tokens: new colours should go through `:root` custom properties, not new hard-coded `rgba()`s.

### 3.2 Refraction (`glass.js`, ported from liqui-design — see §5)
- Chromium-only (`backdrop-filter: url(#svg-filter)`). Detect support; if unsupported, **hide the
  toggle and never enable**. State lives in `localStorage['ash777.refraction']` (`on`/`off`) and as
  `data-refraction="on"` on `<html>`. **Default is ON** (round 2): no saved value → on, unless
  `prefers-reduced-transparency: reduce`. A saved value always wins.
- When **off**: do **zero** canvas/filter work (that's the whole point of the toggle).
- When **on**, per `.liquid-raised-btn`: generate (canvas) a displacement map + a rim-light PNG sized
  to the button's `clientWidth/clientHeight` (layout sizes — **never `getBoundingClientRect`**,
  it's transform-sensitive), register an SVG `<filter>` with an `feImage` of the map in one hidden
  persistent `<svg>`, and expose `--lq-refract: url(#id)` / `--lq-specular: url(...)` on the button.
  CSS applies them on the button's `::before` / `::after`. Cache by size. Rebuild via `ResizeObserver`.
- Pitfalls (from liqui's handbook; learned the hard way upstream):
  - Build the map on a **canvas**, not an SVG data URI (Chromium rasterises `feImage` SVG with CSS
    features disabled → corrupted map).
  - Keep `backdrop-filter: url(#…)` on its **own layer**, don't chain with `blur()`.
  - Glass needs something to refract: buttons sit over a *cut-out* in the ribbon pane so the
    wallpaper is directly behind them. Don't remove the cutout.
- Tunable dials live in one `CONFIG` object at the top of `glass.js` (bezel, refraction strength,
  specular). Tune by eye per wallpaper.

### 3.3 Navigation without reload (`nav-swap.js`)
- Intercept plain left-clicks on same-origin `.html` links (`.liquid-raised-btn`, `.back-home-btn`,
  title link). `fetch` → `DOMParser` → swap `.content-wrapper` innerHTML, `document.title`, and the
  active ribbon button; `history.pushState`; handle `popstate`; scroll to top.
- **Any failure → fall back to a normal navigation** (`location.href`). Modifier-clicks / new-tab /
  `target` links are left alone.
- Because only the card swaps, header/ribbon/taskbar/Webamp/wallpaper persist.
- Every page must load the same scripts so landing directly on `about.html` also gets Webamp.

### 3.4 Webamp (`webamp-init.js`)
- If `matchMedia('(max-width: 720px)')` matches → do nothing and **don't load the bundle**.
  (`webamp-init.js` now loads `xmms_turquoise_data.js` + `webamp.bundle.min.js` itself, so each page
  needs just that one script tag.)
- Dock bottom-right: main window `275×116`; `x = innerWidth − 275 − 16`, `y = innerHeight − 52 − 116 − 12`
  (52 = taskbar height). Equalizer/playlist stay closed by default.
- Volume: `store.dispatch({ type: 'SET_VOLUME', volume: 50 })` (0–100; keeps the slider in sync).
- **Autoplay (round 2 rewrite).** Don't trust `store.media.status`: it says `PLAYING` even when the
  browser blocked audio. The truth is `webamp.media._context.state` (`suspended` = blocked) and
  whether `timeElapsed` advances. Logic: call `webamp.play()` at load; if the context is still
  `suspended`, listen for the first real user activation (`pointerdown`, `pointerup`, `keydown`,
  `touchend`: touch only counts on up/end), then `context.resume()` **and call `webamp.play()`
  again** (resume alone leaves the track silent). Disarm only once the context is `running`
  (a touch `pointerdown` isn't an activation, so don't disarm on it). Ignore interactions inside
  `#webamp` (the visitor is already driving the player). If the browser allowed autoplay, do nothing.
  Honest limit: with zero interaction on a first visit, Chrome/Edge will not play sound. Repeat
  visits may autoplay by the browser's engagement score; the owner can also set Site settings →
  Sound/Autoplay → Allow for the site.

### 3.5 Pages
- Remove the unused `#button-liquid-filter` `<svg>` from every page (replaced by `glass.js`'s registry).
- Footer gains `#footer-refraction-toggle` (`button.wallpaper-toggle-btn`, `aria-pressed`).
  On phones the taskbar drops the brand text and wallpaper name.
- Stub icons: replace emoji (👤💻📄🎮🖼️) with inline SVG in a glossy orb, same on all pages.
- Card header bar (title + status badge) appears on every page.
- Fonts: `@font-face` for Selawik (woff2, `font-display: swap`); stack stays
  `'Segoe UI', Selawik, …` so Windows uses the real thing.
- Bump the `style.css?v=` cache-buster on every page when CSS changes.

### 3.6 Top bar and title (round 2)
- **Frosted texture** on `.ribbon-glass-pane` only: three tiled, seamless `feTurbulence` layers (inline
  SVG data-URIs, `stitchTiles`) over the frost gradient: **white grain + a faint blue grain + soft
  mottling**, with blur 22px / saturate 190%. The two-tone grain was chosen from four variants compared
  at 3× zoom: white-only grain either glitters (strong) or nearly vanishes (matte), and the blue grain
  adds the "acid-etched" depth. It sits on the pane so the canvas cutout mask (`ribbon-cutout.js`) still
  punches the buttons out: **buttons stay clear and refracting, the bar around them is textured**.
  The texture is static. `prefers-reduced-transparency` replaces it with a solid pane. Tuning notes are
  in the CSS comment above `.ribbon-glass-pane`.
- **Sleeker layout:** `.ribbon-container` centres a content-width capsule (`.dense-glass-ribbon`,
  fully rounded, 8 px padding and gap, ≈554×58 px) instead of a full-width slab; buttons are equal-width
  (128 px) pills. Phones (≤720 px): 2×2 grid, ≈340×98 px, 28 px radius.
- Corner radius is **never hard-coded**: `ribbon-cutout.js` and `glass.js` read each button's computed
  `border-radius` (pill = 999px; both clamp to half the height).
- **Title:** `Welcome to <strong>Ash777's</strong> Website!`: Selawik Light (weight 300 → real Segoe UI Light
  on Windows) with the name in semibold, modest glow so thin strokes stay crisp. `assets/fonts/` gains
  `selawik-light.woff2`. Update `<title>` on all pages to match ("Ash777's Website").
- The footer brand `ash777.me` is a domain and stays lowercase.

### 3.7 Wallpaper crossfade (round 2)
- Incoming layer fades in **on top** (z 2, opacity 0 → 1 over 1.8 s) while the outgoing layer stays at
  opacity 1 underneath (class `leaving`), and is retired to `inactive` only after the fade. (Before, both
  faded at once, which dipped to the dark base colour mid-fade.)
- A manual switch pressed mid-fade is ignored (simple, no half-states).
- Do **not** put `.wallpaper-slide` back inside a `prefers-reduced-motion` rule (decision 19).

### 3.8 Keeping `plan.md` off the public site (round 2)
- GitHub Pages (branch deploy) serves every file in the repo. `_config.yml` has
  `exclude: [plan.md]` so Jekyll leaves it out of the published site while it stays in the repo.
- **Don't add a `.nojekyll` file**: that turns Jekyll off and the exclusion stops working.
- If the site is ever switched to a GitHub Actions deploy, re-check that `/plan.md` is not served.
- After merging to `main`, confirm `https://ash777.me/plan.md` returns 404.

---

## 4. Checklist

Update the boxes as work lands. **Status as of 2026-11-09: rounds 1 and 2 are implemented on
`November-updates-2`, uncommitted.**

Round 2 (owner feedback):
- [x] Autoplay actually starts music on the first click / key / tap (§3.4)
- [x] Textured frosted pane behind clear refracting buttons (§3.6)
- [x] Sleeker capsule top bar, pill buttons, 2×2 on phones (§3.6)
- [x] Title → "Welcome to Ash777's Website!" in Light + semibold, `<title>`s updated (§3.6)
- [x] Wallpaper really crossfades; reduced-motion no longer kills it (§3.7)
- [x] `plan.md` excluded from the published site via `_config.yml` (§3.8)
- [x] Refraction on by default (§3.2)
- [x] This file updated
- [ ] Owner: after merging to `main`, confirm `https://ash777.me/plan.md` is a 404 (can't be tested locally)

Round 1:

- [x] Selawik woff2 in `assets/fonts/` + `@font-face`
- [x] CSS: tokens, hover/focus/active, richer edges, fixed taskbar, reduced-* queries, phone taskbar
- [x] `glass.js` (toggle, map, specular, registry, support detection, persistence)
- [x] `nav-swap.js`
- [x] `webamp-init.js` (phone skip, self-loading scripts, dock bottom-right, 50% volume)
- [x] All 5 pages: remove dead filter, toggle button, scripts, status badge/header bar, SVG icons, `aria-current`
- [x] Visual check in Chromium (Edge), toggle off *and* on, plus a 390 px phone viewport
- [~] Non-Chromium: **simulated only** (Firefox user-agent override → toggle stays hidden, nothing built,
      no errors). Not yet tried in a real Firefox/Safari. Worth a manual look.
- [ ] Owner review: tune the dials (§3.2) by eye; pick final badge wording (currently "Under construction")

### Verification log (what was actually checked, and how)

Driven with `puppeteer-core` + the installed Edge against a local static server (scripts were throwaway,
not kept in the repo). Confirmed: refraction map is symmetric (neutral centre, mirrored rim values);
off = zero filters built; on = visibly bent wallpaper streaks + rim light (checked on 3 wallpapers);
nav swap keeps the *same* `#webamp` DOM node and doesn't reload; Back button works; direct load of a
stub page still gets Webamp; phones get no `#webamp` and never request the bundle; no horizontal
overflow at 390 px; Webamp docks 12 px above the taskbar; volume starts at 50; storage-blocked
(private mode) doesn't crash; `prefers-reduced-transparency` drops the backdrop blur.

### Verification log, round 2

Same method (`puppeteer-core` + Edge, throwaway scripts, local server), but with the browser's
**default autoplay policy** (no flags). Confirmed: before any gesture `ctx` is `suspended` and `t=0`;
after ONE trusted click, ONE key press, or a click on a nav link, `ctx` is `running` and `timeElapsed`
advances (~2.8 s after 3 s). Wallpaper: transition is `1.8s` even with `prefers-reduced-motion: reduce`;
incoming opacity rises 0 → 1 while the outgoing layer stays 1 (`leaving`), then retires. Refraction: fresh
profile → on; saved "off" respected across reload; `prefers-reduced-transparency` → default off. All five
pages at 1440 px and two at 390 px: no JS errors, correct titles, no horizontal overflow, Webamp only on
desktop; Tab order = title link → About me; nav swap keeps the same `#webamp` node.

### Things learned the hard way (so you don't repeat them)

- **The owner's machine (and this one) reports `prefers-reduced-motion: reduce`** (Windows "Show
  animations" is off). Anything gated on that media query is what they actually see. Round 1 used it to
  disable the wallpaper fade, which is why the wallpaper "abruptly" switched. Test with
  `matchMedia('(prefers-reduced-motion: reduce)').matches`, not assumptions.
- **Webamp's `store.media.status` lies about autoplay**: it says `PLAYING` while the browser has blocked
  audio. Use `webamp.media._context.state` and whether `timeElapsed` advances. `webamp.play()` returns
  nothing (not a promise), so `.catch()`-based fallbacks silently never arm. Re-dispatching `play()`
  works because every `PLAY` action calls the media layer's real `play()`.
- A first-time visitor can't be autoplayed with zero interaction in Chrome/Edge; "first click, key or tap
  anywhere" is the earliest possible. Don't promise more.
- Light-weight (300) title text on the brightest wallpapers has less contrast than bold did; the drop
  shadow carries it. If it ever reads poorly, raise `font-weight` to 400 before touching the glow.

- **Webamp steals keyboard focus ~2 s after load** (it focuses a hidden playlist row once the first
  track is selected). Without the guard in `webamp-init.js › keepFocusOnPage()`, a keyboard user's first
  Tab presses wander through the player. Blurring isn't enough: Chrome continues Tab from the element
  that lost focus, so the guard also briefly focuses `<body>` to reset the starting point.
- Webamp's DOM root is `#webamp`, **not** inside `#webamp-app`. Don't test focus/containment against the latter.
- All four nav buttons are the same size, so `glass.js` builds **one** filter, not four (cache is keyed by size).
- Selawik's release zip already ships woff2 (no conversion needed). Its license is **SIL OFL 1.1**, not MIT.
- A local `python -m http.server` doesn't support HTTP Range, so audio requests show `net::ERR_ABORTED`
  in tests. That's the test server, not a bug; GitHub Pages serves Range fine.

---

## 5. References

- **liqui-design** — https://github.com/leefanv/liqui-design (MIT). React library; we do **not**
  depend on it. `glass.js` is a compact vanilla port of the technique in
  `packages/glass/src/LiquiGlass.tsx` (displacement map from a signed-distance field + a
  Snell's-law lookup table, specular rim from the surface normal) and `filterRegistry.ts`
  (one persistent hidden `<svg>` holding `<filter>`s with `feImage` maps). Handbook:
  `apps/www/content/docs/handbook/glass.mdx`. Credit it in `glass.js`'s header.
- **Webamp** — https://github.com/captbaritone/webamp. The vendored bundle in
  `assets/js/webamp.bundle.min.js` exposes the Redux store as `webamp.store`; actions used here:
  `UPDATE_WINDOW_POSITIONS`, `CLOSE_WINDOW`, `SET_VOLUME`, `BUFFER_TRACK`.

---

## 6. Out of scope (don't do without asking)

- Card readability/contrast changes (owner declined).
- Real content for About / Projects / Resume / Fun (owner writes it).
- Static-site generator, JS-injected shell, or any build tooling.
- Compressing/replacing audio files; deleting `old.html` or the `.m4a`.
- Committing, pushing, merging to `main`. (GitHub Pages serves `main`.)
- Note: any file in the repo root, including this one, is publicly served by GitHub Pages.
