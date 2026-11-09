/* ==========================================================================
   ash777.me — Dynamic Ribbon Bar Cutout Mask
   Removes the frosted glass of the topbar ONLY in the area covered by
   the buttons, allowing them to pop out cleanly over the crisp wallpaper.
   Uses a hardware-accelerated Data URL alpha mask for 100% reliability.
   ========================================================================== */

(function () {
  'use strict';

  function initRibbonCutout() {
    const ribbon = document.querySelector('.dense-glass-ribbon');
    if (!ribbon) return;

    // Ensure ribbon glass pane exists inside ribbon
    let pane = ribbon.querySelector('.ribbon-glass-pane');
    if (!pane) {
      pane = document.createElement('div');
      pane.className = 'ribbon-glass-pane';
      pane.setAttribute('aria-hidden', 'true');
      ribbon.insertBefore(pane, ribbon.firstChild);
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    function updateCutouts() {
      const ribbonRect = ribbon.getBoundingClientRect();
      const w = Math.round(ribbonRect.width);
      const h = Math.round(ribbonRect.height);
      if (w === 0 || h === 0) return;

      canvas.width = w;
      canvas.height = h;

      // 1. Fill completely with opaque black (means: keep frosted glass visible)
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      // 2. Erase alpha in button areas (means: remove frosted glass effect under buttons)
      ctx.globalCompositeOperation = 'destination-out';
      const buttons = ribbon.querySelectorAll('.liquid-raised-btn');
      buttons.forEach(btn => {
        const bRect = btn.getBoundingClientRect();
        const bx = Math.round(bRect.left - ribbonRect.left);
        const by = Math.round(bRect.top - ribbonRect.top);
        const bw = Math.round(bRect.width);
        const bh = Math.round(bRect.height);

        if (bw > 0 && bh > 0) {
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            // Match the button's real corner radius (pill buttons are 999px; roundRect clamps it).
            const r = parseFloat(getComputedStyle(btn).borderTopLeftRadius) || 10;
            ctx.roundRect(bx, by, bw, bh, r);
          } else {
            ctx.rect(bx, by, bw, bh);
          }
          ctx.fill();
        }
      });

      // 3. Set mask on the glass pane
      const maskDataUrl = canvas.toDataURL('image/png');
      pane.style.maskImage = 'url(' + maskDataUrl + ')';
      pane.style.webkitMaskImage = 'url(' + maskDataUrl + ')';
      pane.style.maskSize = '100% 100%';
      pane.style.webkitMaskSize = '100% 100%';
    }

    updateCutouts();
    window.addEventListener('resize', updateCutouts, { passive: true });

    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => updateCutouts());
      ro.observe(ribbon);
    }

    setTimeout(updateCutouts, 80);
    setTimeout(updateCutouts, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRibbonCutout);
  } else {
    initRibbonCutout();
  }
})();
