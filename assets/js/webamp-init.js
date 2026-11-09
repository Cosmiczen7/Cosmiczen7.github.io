/* ==========================================================================
   ash777.me — Webamp Audio Player Initialization
   Uses official captbaritone/webamp API (vendored bundle in assets/js/).

   This file loads Webamp itself, so every page needs only this one <script> tag.
   Phones (<= 720px) get no player and don't download it at all.
   ========================================================================== */

(function () {
  'use strict';

  // Keep in sync with --taskbar-h in style.css and the 720px breakpoint there.
  const TASKBAR_H = 52;
  const PHONE = window.matchMedia('(max-width: 720px)');
  const WEBAMP_W = 275, WEBAMP_H = 116; // Webamp's main window size
  const MARGIN = 16;
  const START_VOLUME = 50; // 0-100. Not 100: a surprise track shouldn't blast speakers.

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('failed to load ' + src));
      document.head.appendChild(s);
    });
  }

  // Webamp moves keyboard focus into its (hidden) playlist about 2 s after load, once its first
  // track is selected. That makes a keyboard user's first Tab presses wander through the player
  // before reaching the page. For the first 10 s, hand back any focus the visitor didn't cause
  // (no pointer/key within 300 ms), so deliberately tabbing into the player still works.
  function keepFocusOnPage() {
    const t0 = performance.now();
    let lastInput = -Infinity;
    const stamp = () => { lastInput = performance.now(); };
    window.addEventListener('pointerdown', stamp, true);
    window.addEventListener('keydown', stamp, true);

    const giveBack = (target) => {
      target.blur();
      // Chrome continues Tab from the element that just lost focus (i.e. inside the player).
      // Briefly focusing <body> resets that starting point to the top of the page.
      const b = document.body;
      b.tabIndex = -1;
      b.focus({ preventScroll: true });
      b.removeAttribute('tabindex');
    };
    const root = document.getElementById('webamp'); // Webamp's own root; not necessarily inside #webamp-app
    if (root && root.contains(document.activeElement)) giveBack(document.activeElement);

    document.addEventListener('focusin', (e) => {
      const now = performance.now();
      if (now - t0 < 10000 && now - lastInput > 300 && e.target.closest && e.target.closest('#webamp')) {
        giveBack(e.target);
      }
    });
  }

  function initWebampPlayer() {
    const appContainer = document.getElementById('webamp-app');
    if (!appContainer || typeof window.Webamp === 'undefined') return;

    // Dock bottom-right, just above the fixed taskbar. Visitors can still drag it anywhere.
    const posX = Math.max(MARGIN, window.innerWidth - WEBAMP_W - MARGIN);
    const posY = Math.max(MARGIN, window.innerHeight - TASKBAR_H - WEBAMP_H - 12);

    const tracks = [
      {
        metaData: {
          artist: "椎名もた (siinamota)",
          title: "Young Girl A (少女A)"
        },
        url: "assets/audio/young_girl_a.mp3",
        duration: 242.079
      },
      {
        metaData: {
          artist: "DJ Mike Llama",
          title: "Llama Whippin' Intro"
        },
        url: "assets/audio/llama-2.91.mp3",
        duration: 5.322286
      },
      {
        metaData: {
          artist: "Kevin MacLeod",
          title: "Wallpaper (Frutiger Aero Mix)"
        },
        url: "assets/audio/wallpaper.mp3",
        duration: 219
      },
      {
        metaData: {
          artist: "Kevin MacLeod",
          title: "Deliberate Thought (Ambient)"
        },
        url: "assets/audio/deliberate_thought.mp3",
        duration: 180
      }
    ];

    const skinUrl = window.__XMMS_TURQUOISE_SKIN || "assets/skins/XMMS-Turquoise.wsz";

    try {
      const webamp = new window.Webamp({
        initialTracks: tracks,
        initialSkin: {
          url: skinUrl
        },
        availableSkins: [
          { url: skinUrl, name: "XMMS Turquoise" },
          { url: "https://unpkg.com/webamp@1.4.2/built/skins/base-2.91.wsz", name: "Winamp Classic" }
        ],
        zIndex: 99999
      });
      window.__webamp = webamp;

      // Render Webamp into designated container
      webamp.renderWhenReady(appContainer).then(() => {
        keepFocusOnPage();

        // Set exact top-right window positions and keep only main player open by default
        try {
          if (webamp.store && typeof webamp.store.dispatch === 'function') {
            // Equalizer / playlist (closed by default) stack ABOVE the player, since it sits at the bottom.
            webamp.store.dispatch({
              type: "UPDATE_WINDOW_POSITIONS",
              positions: {
                main: { x: posX, y: posY },
                equalizer: { x: posX, y: Math.max(0, posY - WEBAMP_H) },
                playlist: { x: posX, y: Math.max(0, posY - WEBAMP_H * 2) }
              },
              absolute: true
            });
            // Close equalizer and playlist by default so they don't cover content
            webamp.store.dispatch({ type: "CLOSE_WINDOW", windowId: "equalizer" });
            webamp.store.dispatch({ type: "CLOSE_WINDOW", windowId: "playlist" });
          }
        } catch (posErr) {
          console.warn('Could not set custom position:', posErr);
        }

        // Start at a moderate volume. Dispatching the store action (not media.setVolume) keeps
        // Webamp's own volume slider in sync with the real level.
        try {
          webamp.store.dispatch({ type: "SET_VOLUME", volume: START_VOLUME });
        } catch (volErr) {}

        // Ensure Track 0 (Young Girl A) is explicitly buffered and active
        try {
          if (webamp.store && typeof webamp.store.dispatch === 'function') {
            webamp.store.dispatch({ type: "BUFFER_TRACK", id: 0 });
          }
        } catch (bufErr) {}

        setupAutoplay(webamp);
      }).catch(err => {
        console.error('Webamp renderWhenReady error:', err);
      });

    } catch (e) {
      console.error('Error instantiating Webamp:', e);
    }
  }

  // Autoplay. Browsers refuse to play sound until the visitor has interacted with the page, and
  // Webamp's own store can't tell us whether that happened: it reports PLAYING even when the
  // browser blocked the audio. The truth is the AudioContext: 'suspended' = blocked.
  // So: try now; if the context is still suspended, start on the first real user activation.
  // Resuming the context alone leaves the track silent, so play() must be sent again as well.
  // (With zero interaction a first-time visitor can't be autoplayed; this is as early as browsers allow.)
  function setupAutoplay(webamp) {
    webamp.play(); // succeeds outright when the browser allows autoplay (e.g. high site engagement)
    const ctx = webamp.media && webamp.media._context;
    if (!ctx || ctx.state === 'running') return;

    // Touch only counts as an activation on pointerup/touchend, not pointerdown.
    const EVENTS = ['pointerdown', 'pointerup', 'keydown', 'touchend'];
    const disarm = () => {
      EVENTS.forEach((t) => window.removeEventListener(t, onActivate, true));
      ctx.removeEventListener('statechange', onState);
    };
    const onState = () => { if (ctx.state === 'running') disarm(); };
    function onActivate(e) {
      // The visitor is already driving the player: leave it to them.
      if (e.target && e.target.closest && e.target.closest('#webamp')) return disarm();
      ctx.resume().catch(() => {});
      webamp.play();
    }
    EVENTS.forEach((t) => window.addEventListener(t, onActivate, true));
    ctx.addEventListener('statechange', onState);
  }

  function boot() {
    if (PHONE.matches) return; // no player on phones: skip the ~1 MB bundle entirely
    // The skin data script is optional (falls back to the .wsz URL); the bundle is not.
    loadScript('assets/skins/xmms_turquoise_data.js')
      .catch(() => {})
      .then(() => loadScript('assets/js/webamp.bundle.min.js'))
      .then(initWebampPlayer)
      .catch((err) => console.error('Webamp could not start:', err));
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
