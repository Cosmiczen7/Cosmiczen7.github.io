/* ==========================================================================
   ash777.me — Windows 7 Desktop Wallpaper Slideshow Engine
   Standalone, robust crossfade engine cycling through assets wallpapers
   ========================================================================== */

(function () {
  'use strict';

  const WALLPAPERS = [
    { src: 'assets/blue_back.jpg', title: 'Aero Harmony' },
    { src: 'assets/bluefish.jpg', title: 'Aquatic Bliss' },
    { src: 'assets/bluepark.jpg', title: 'Sunlit Vista' },
    { src: 'assets/bluerain.webp', title: 'Rain on Glass' },
    { src: 'assets/blueroom.jpg', title: 'Future Lounge' }
  ];

  let currentIndex = 0;
  let intervalTimer = null;
  const SLIDE_DURATION = 60000; // 60 seconds (1 minute) per wallpaper

  // Preload images into browser cache so transitions are seamless
  function preloadWallpapers() {
    WALLPAPERS.forEach(item => {
      const img = new Image();
      img.src = item.src;
    });
  }

  function initSlideshow() {
    const layerA = document.getElementById('slide-a');
    const layerB = document.getElementById('slide-b');
    if (!layerA || !layerB) return;

    preloadWallpapers();

    // Set initial wallpaper on Layer A
    layerA.style.backgroundImage = `url('${WALLPAPERS[0].src}')`;
    layerA.classList.add('active');
    layerA.classList.remove('inactive');

    layerB.classList.add('inactive');
    layerB.classList.remove('active');

    updateFooterLabel();

    // Start auto slideshow
    startTimer();

    // Footer button to manually switch wallpaper
    const btn = document.getElementById('footer-next-wallpaper');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        nextWallpaper();
        startTimer(); // reset interval on manual click
      });
    }
  }

  function nextWallpaper() {
    const layerA = document.getElementById('slide-a');
    const layerB = document.getElementById('slide-b');
    if (!layerA || !layerB) return;

    currentIndex = (currentIndex + 1) % WALLPAPERS.length;
    const nextWp = WALLPAPERS[currentIndex];

    const isALeading = layerA.classList.contains('active');
    const incoming = isALeading ? layerB : layerA;
    const outgoing = isALeading ? layerA : layerB;

    // Load next image onto incoming layer
    incoming.style.backgroundImage = `url('${nextWp.src}')`;
    incoming.classList.remove('inactive');
    incoming.classList.add('active');

    // Fade out outgoing layer
    outgoing.classList.remove('active');
    outgoing.classList.add('inactive');

    updateFooterLabel();
  }

  function updateFooterLabel() {
    const label = document.getElementById('footer-wallpaper-name');
    if (label) {
      label.textContent = WALLPAPERS[currentIndex].title;
    }
  }

  function startTimer() {
    clearInterval(intervalTimer);
    intervalTimer = setInterval(nextWallpaper, SLIDE_DURATION);
  }

  // Clock in footer
  function initClock() {
    const clockEl = document.getElementById('footer-clock');
    if (!clockEl) return;
    function tick() {
      const now = new Date();
      clockEl.textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    tick();
    setInterval(tick, 1000);
  }

  // Initialize as soon as DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initSlideshow();
      initClock();
    });
  } else {
    initSlideshow();
    initClock();
  }
})();
