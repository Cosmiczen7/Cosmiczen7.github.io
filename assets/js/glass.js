/* ==========================================================================
   ash777.me — Glass refraction (opt-in)

   Real refraction on the nav buttons: the wallpaper behind each button bends near its
   rim like a slab of thick glass, and a baked rim light catches the edge.

   How it works: per button we draw a displacement map on a <canvas> (R = x shift,
   B = y shift, 128 = none), wrap it in an SVG <filter> (feImage + feDisplacementMap) and
   point the button's ::before layer at it with `backdrop-filter: url(#filter)`.
   Chromium only; elsewhere the toggle is hidden and this file does nothing.

   Technique and maths adapted from liqui-design —
   https://github.com/leefanv/liqui-design — packages/glass/src/LiquiGlass.tsx and
   filterRegistry.ts. Vanilla/compact port: one profile, buttons only, no dispersion.

   liqui-design is MIT licensed. Copyright (c) 2026 Fan Li. Permission is granted, free of
   charge, to use, copy, modify and distribute it, provided this copyright and permission
   notice is included in copies or substantial portions. Full text:
   https://github.com/leefanv/liqui-design/blob/main/LICENSE

   ON by default (unless the OS asks for reduced transparency); a visitor's saved choice always
   wins. While off we do ZERO canvas / filter work (that is the point of the toggle).
   Choice is remembered in localStorage.
   ========================================================================== */

(function () {
  'use strict';

  // ---- Dials: tune by eye over each wallpaper ------------------------------------------------
  const CONFIG = {
    selector: '.liquid-raised-btn',
    bezel: 13,       // px: width of the refracting rim. Bigger = thicker-looking glass.
    refraction: 20,  // px: displacement scale. How hard the rim bends the wallpaper.
    specular: 1,     // 0–1: strength of the baked rim light
  };
  const STORE_KEY = 'ash777.refraction'; // 'on' | 'off' (absent = the default below)
  const CACHE_MAX = 32;

  // ---- Support detection -----------------------------------------------------------------------
  // ponytail: UA sniff, because Safari/Firefox accept `backdrop-filter: url(#x)` in CSS.supports()
  // and then silently ignore it, so real feature detection isn't possible. Revisit when WebKit
  // bug 245510 ships.
  const supported = (function () {
    if (!window.CSS || !CSS.supports('backdrop-filter', 'blur(1px)')) return false;
    const ua = navigator.userAgent;
    if (/firefox\//i.test(ua)) return false;
    if (/^((?!chrome|chromium|edg|android).)*safari/i.test(ua)) return false;
    return true; // Chromium
  })();

  // ---- Refraction profile ------------------------------------------------------------------------
  // How strongly light bends at depth t into the rim (0 = outer edge, 1 = inner end of the bezel).
  // Models a glass slab with a squircle top surface: slope -> incident angle -> Snell's law
  // (n = 1.5) -> lateral shift. Normalised to 0..1. Result: sharp peak near the rim, smooth fade.
  const LUT_N = 128;
  const LUT = (function () {
    const mag = new Float32Array(LUT_N);
    const n = 1.5, T = 0.6, eps = 1 / 1024;
    const h = (t) => Math.pow(1 - Math.pow(1 - t, 4), 0.25);
    let max = 0;
    for (let i = 0; i < LUT_N; i++) {
      const t = Math.max(i / (LUT_N - 1), eps);
      const hi = Math.min(t + eps, 1), lo = Math.max(t - eps, 0);
      const slope = ((h(hi) - h(lo)) / (hi - lo)) * T;
      const thetaI = Math.atan(Math.abs(slope));
      mag[i] = h(t) * T * Math.tan(thetaI - Math.asin(Math.sin(thetaI) / n));
      max = Math.max(max, mag[i]);
    }
    if (max > 0) for (let i = 0; i < LUT_N; i++) mag[i] /= max;
    return mag;
  })();

  // Signed distance (negative inside) + outward normal for a rounded rectangle centred on 0,0.
  // bx/by = half-size minus the corner radius r.
  function field(px, py, bx, by, r, out) {
    const qx = Math.abs(px) - bx, qy = Math.abs(py) - by;
    const ox = Math.max(qx, 0), oy = Math.max(qy, 0);
    const len = Math.hypot(ox, oy);
    out.sd = len + Math.min(Math.max(qx, qy), 0) - r;
    if (len > 0) {            // corner region
      out.nx = Math.sign(px) * ox / len;
      out.ny = Math.sign(py) * oy / len;
    } else if (qx > qy) {     // straight left/right edge
      out.nx = Math.sign(px); out.ny = 0;
    } else {                  // straight top/bottom edge
      out.nx = 0; out.ny = Math.sign(py);
    }
  }

  const sat = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

  // Displacement map. Pixels sample TOWARD the centre (convex-lens magnification); sampling
  // outward would hit Chromium's backdrop edge-clamp and smear instead of refract.
  function drawMap(w, h, r, bezel) {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(w, h);
    const d = img.data;
    const rr = Math.min(r, w / 2, h / 2), bx = w / 2 - rr, by = h / 2 - rr;
    const f = { sd: 0, nx: 0, ny: 0 };
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        field(x + 0.5 - w / 2, y + 0.5 - h / 2, bx, by, rr, f);
        const depth = -f.sd / bezel;
        const m = depth >= 0 && depth < 1 ? LUT[Math.min(Math.round(depth * (LUT_N - 1)), LUT_N - 1)] : 0;
        const i = (y * w + x) * 4;
        d[i] = Math.round(128 - f.nx * m * 127);     // R -> x displacement
        d[i + 1] = 128;
        d[i + 2] = Math.round(128 - f.ny * m * 127); // B -> y displacement
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvas.toDataURL();
  }

  // Rim light: a crisp ~1px highlight hugging the top/bottom edges (lit from above and below),
  // a few px of diffuse glow inside it, and a hairline of shade on the left/right flanks so the
  // bright arcs read as a lit glass rim rather than a painted white line.
  const COS_LIGHT = Math.cos(1.08);
  const COS_DIFFUSE = Math.cos(1.08 * 0.65);
  const COS_SIDE = Math.cos(0.98);

  function drawSpecular(w, h, r, bezel) {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(w, h);
    const d = img.data;
    const rr = Math.min(r, w / 2, h / 2), bx = w / 2 - rr, by = h / 2 - rr;
    const reach = 4.5 + bezel * 0.15;
    const f = { sd: 0, nx: 0, ny: 0 };
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        field(x + 0.5 - w / 2, y + 0.5 - h / 2, bx, by, rr, f);
        const sd = f.sd;
        if (sd > 1 || sd < -(reach + 1)) continue; // everything lives within a hair of the edge

        const coverage = sat(0.5 - sd);
        const vertical = Math.abs(f.ny);
        const directional = Math.pow(sat((vertical - COS_LIGHT) / (1 - COS_LIGHT)), 1.25);
        const diffuseDir = Math.pow(sat((vertical - COS_DIFFUSE) / (1 - COS_DIFFUSE)), 1.25);
        const stroke = sat(sd + 1.4) * sat(0.5 - sd);
        let spec = directional * stroke;
        spec = spec / (1 + 0.5 * (1 - spec));
        const glow = 1 - sat(-sd / reach);
        const diffuse = diffuseDir * 0.18 * glow * glow * coverage;

        const wL = sat((f.nx - COS_SIDE) / (1 - COS_SIDE)) * stroke;
        const wR = sat((-f.nx - COS_SIDE) / (1 - COS_SIDE)) * stroke;
        const shade = (wL / (1 + 0.4 * (1 - wL)) + wR / (1 + 0.4 * (1 - wR))) * 0.48;

        const highlight = sat(spec + diffuse);
        const alpha = highlight + shade * (1 - highlight);
        if (alpha <= 0) continue;
        const v = Math.round(Math.min(highlight / alpha, 1) * 255);
        const i = (y * w + x) * 4;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = Math.round(Math.min(alpha, 1) * 255 * CONFIG.specular);
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvas.toDataURL();
  }

  // ---- Filter registry -----------------------------------------------------------------------------
  // `backdrop-filter: url(#id)` resolves by id across the document, so every filter lives in one
  // hidden <svg>. Cached by size+optics, bounded LRU. Eviction is safe because a button always
  // re-requests (and so freshens) its own entry on every rebuild; only stale sizes get dropped.
  const NS = 'http://www.w3.org/2000/svg';
  const cache = new Map(); // key -> { id, specular }
  let host = null;
  let nextId = 0;

  function el(name, attrs) {
    const node = document.createElementNS(NS, name);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function ensureHost() {
    if (host && host.isConnected) return host;
    host = el('svg', { width: 0, height: 0, 'aria-hidden': 'true' });
    host.style.cssText = 'position:absolute;pointer-events:none';
    document.body.appendChild(host);
    return host;
  }

  function glassFor(w, h, r) {
    const key = w + 'x' + h + 'r' + r + 'b' + CONFIG.bezel + 'k' + CONFIG.refraction;
    const hit = cache.get(key);
    if (hit) {
      cache.delete(key); cache.set(key, hit); // mark most-recently-used
      return hit;
    }
    const id = 'ash-refract-' + nextId++;
    const filter = el('filter', {
      id, x: 0, y: 0, width: w, height: h,
      filterUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB',
    });
    const image = el('feImage', { x: 0, y: 0, width: w, height: h, result: 'map' });
    image.setAttribute('href', drawMap(w, h, r, CONFIG.bezel));
    filter.appendChild(image);
    filter.appendChild(el('feDisplacementMap', {
      in: 'SourceGraphic', in2: 'map', scale: CONFIG.refraction,
      xChannelSelector: 'R', yChannelSelector: 'B',
    }));
    ensureHost().appendChild(filter);

    const entry = { id, specular: drawSpecular(w, h, r, CONFIG.bezel) };
    cache.set(key, entry);
    if (cache.size > CACHE_MAX) {
      const [oldKey, old] = cache.entries().next().value;
      cache.delete(oldKey);
      host.querySelector('#' + old.id)?.remove();
    }
    return entry;
  }

  // ---- Wiring ----------------------------------------------------------------------------------------
  function build(btn) {
    // clientWidth/Height are layout sizes (padding box = the ::before layer's box). Never use
    // getBoundingClientRect here: it's transform-sensitive and would bake a wrong-sized map.
    const w = btn.clientWidth, h = btn.clientHeight;
    if (!w || !h) return;
    const r = Math.round(parseFloat(getComputedStyle(btn).borderTopLeftRadius)) || 10;
    const g = glassFor(w, h, r);
    btn.style.setProperty('--lq-refract', 'url(#' + g.id + ')');
    btn.style.setProperty('--lq-specular', 'url(' + g.specular + ')');
  }

  function buildAll() {
    document.querySelectorAll(CONFIG.selector).forEach(build);
  }

  let observer = null;
  let timer = 0;
  function startObserving() {
    if (!window.ResizeObserver || observer) return;
    // Debounced: dragging the window edge fires per frame; rebuild once it settles.
    observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(buildAll, 100);
    });
    document.querySelectorAll(CONFIG.selector).forEach((b) => observer.observe(b));
  }
  function stopObserving() {
    clearTimeout(timer);
    if (observer) observer.disconnect();
    observer = null;
  }

  function init() {
    // The toggle ships `hidden` in the HTML: it only appears where refraction can work
    // (and never without JS), so there's no flash of a dead button in Firefox/Safari.
    const toggle = document.getElementById('footer-refraction-toggle');
    if (!supported) return;
    if (toggle) toggle.hidden = false;

    // Default ON, unless the OS asks for reduced transparency. A saved choice always wins.
    let on = !(window.matchMedia && matchMedia('(prefers-reduced-transparency: reduce)').matches);
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved === 'on' || saved === 'off') on = saved === 'on';
    } catch (e) { /* storage blocked (private mode): just use the default */ }

    const label = document.getElementById('footer-refraction-label');
    function set(next, persist) {
      on = next;
      document.documentElement.dataset.refraction = on ? 'on' : 'off';
      if (toggle) toggle.setAttribute('aria-pressed', String(on));
      if (label) label.textContent = on ? 'Refraction: On' : 'Refraction: Off';
      if (persist) { try { localStorage.setItem(STORE_KEY, on ? 'on' : 'off'); } catch (e) { /* ignore */ } }
      if (on) { buildAll(); startObserving(); } else { stopObserving(); }
    }

    if (toggle) toggle.addEventListener('click', () => set(!on, true));
    set(on, false);
    // Fonts swap in after first paint and change button widths; the ResizeObserver covers that
    // once on, and this covers the first build.
    if (on && document.fonts && document.fonts.ready) document.fonts.ready.then(buildAll);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
