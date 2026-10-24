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

    // Position Webamp in top-right corner
    const screenWidth = window.innerWidth;
    const posX = screenWidth > 640 ? Math.max(16, screenWidth - 290) : 10;
    const posY = 70;

    const tracks = [
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

    try {
      const webamp = new window.Webamp({
        initialTracks: tracks,
        zIndex: 99999
      });

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

    const playPromise = webamp.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.then(() => {
        console.log('Webamp playing successfully!');
      }).catch(err => {
        console.log('Browser blocked unprompted autoplay. Webamp will play on first interaction:', err);

        // Standard browser policy fallback: play on first user interaction anywhere on page
        const startOnInteraction = () => {
          webamp.play().catch(() => {});
          window.removeEventListener('click', startOnInteraction);
          window.removeEventListener('keydown', startOnInteraction);
          window.removeEventListener('touchstart', startOnInteraction);
        };

        window.addEventListener('click', startOnInteraction, { once: true });
        window.addEventListener('keydown', startOnInteraction, { once: true });
        window.addEventListener('touchstart', startOnInteraction, { once: true });
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
