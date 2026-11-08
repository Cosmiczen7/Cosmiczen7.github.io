/* ==========================================================================
   ash777.me — Webamp Audio Player Initialization
   Uses official captbaritone/webamp API from unpkg.com/webamp@1.4.2
   ========================================================================== */

(function () {
  'use strict';

  function initWebampPlayer() {
    // Check if Webamp library is loaded
    if (typeof window.Webamp === 'undefined') {
      console.warn('Webamp library not yet ready, retrying in 250ms...');
      setTimeout(initWebampPlayer, 250);
      return;
    }

    const appContainer = document.getElementById('webamp-app');
    if (!appContainer) return;

    // Position Webamp in top-right corner (aligned with header space, avoiding nav overlap)
    const screenWidth = window.innerWidth;
    const posX = screenWidth > 640 ? Math.max(16, screenWidth - 295) : 10;
    const posY = 16;

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
        // Set exact top-right window positions and keep only main player open by default
        try {
          if (webamp.store && typeof webamp.store.dispatch === 'function') {
            webamp.store.dispatch({
              type: "UPDATE_WINDOW_POSITIONS",
              positions: {
                main: { x: posX, y: posY },
                equalizer: { x: posX, y: posY + 116 },
                playlist: { x: posX, y: posY + 232 }
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

        // Unmute / Maximize audio volume
        try {
          if (webamp.media && typeof webamp.media.setVolume === 'function') {
            webamp.media.setVolume(100);
          }
        } catch (volErr) {}

        // Global AudioContext unlocker: on modern browsers, AudioContext must be resumed by user gesture
        const unlockAudio = () => {
          if (webamp && webamp.media && webamp.media._context) {
            if (webamp.media._context.state === 'suspended') {
              webamp.media._context.resume().then(() => {
                console.log('Webamp AudioContext resumed successfully!');
              }).catch(() => {});
            }
          }
        };

        window.addEventListener('click', unlockAudio, true);
        window.addEventListener('keydown', unlockAudio, true);
        window.addEventListener('touchstart', unlockAudio, true);
        window.addEventListener('pointerdown', unlockAudio, true);

        // Ensure Track 0 (Young Girl A) is explicitly buffered and active
        try {
          if (webamp.store && typeof webamp.store.dispatch === 'function') {
            webamp.store.dispatch({ type: "BUFFER_TRACK", id: 0 });
          }
        } catch (bufErr) {}

        // Attempt autoplay per user request
        attemptAutoplay(webamp);
      }).catch(err => {
        console.error('Webamp renderWhenReady error:', err);
      });

    } catch (e) {
      console.error('Error instantiating Webamp:', e);
    }
  }

  function attemptAutoplay(webamp) {
    if (!webamp || typeof webamp.play !== 'function') return;

    // First attempt to resume context if possible
    if (webamp.media && webamp.media._context && webamp.media._context.state === 'suspended') {
      webamp.media._context.resume().catch(() => {});
    }

    const playPromise = webamp.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.then(() => {
        console.log('Webamp playing successfully!');
      }).catch(err => {
        console.log('Browser autoplay policy deferred playback. Playing on first user interaction:', err);

        const startOnInteraction = () => {
          if (webamp.media && webamp.media._context && webamp.media._context.state === 'suspended') {
            webamp.media._context.resume().catch(() => {});
          }
          webamp.play().catch(() => {});
          window.removeEventListener('click', startOnInteraction);
          window.removeEventListener('keydown', startOnInteraction);
          window.removeEventListener('touchstart', startOnInteraction);
          window.removeEventListener('pointerdown', startOnInteraction);
        };

        window.addEventListener('click', startOnInteraction, { once: true });
        window.addEventListener('keydown', startOnInteraction, { once: true });
        window.addEventListener('touchstart', startOnInteraction, { once: true });
        window.addEventListener('pointerdown', startOnInteraction, { once: true });
      });
    }
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWebampPlayer);
  } else {
    initWebampPlayer();
  }
})();
