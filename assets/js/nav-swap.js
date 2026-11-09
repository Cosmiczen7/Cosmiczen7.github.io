/* ==========================================================================
   ash777.me — Navigate without reloading

   Clicking a nav link fetches the target page and swaps ONLY the content card, so the header,
   ribbon, taskbar, Webamp player and wallpaper slideshow keep running (music doesn't restart,
   wallpaper doesn't reset). Every page is still a real HTML file: direct links, new tabs,
   and no-JS all work as normal.

   Any failure falls back to a normal page load. Modifier-clicks (new tab etc.) are left alone.
   ========================================================================== */

(function () {
  'use strict';

  const LINKS = 'a.liquid-raised-btn, a.back-home-btn, .site-title a';

  async function load(url, push) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      const next = doc.querySelector('.content-wrapper');
      const cur = document.querySelector('.content-wrapper');
      if (!next || !cur) throw new Error('no content card');

      cur.innerHTML = next.innerHTML;
      document.title = doc.title;

      // The ribbon persists, so just move the "current page" highlight.
      const path = new URL(url, location.href).pathname;
      document.querySelectorAll('.liquid-raised-btn').forEach((a) => {
        const here = a.pathname === path;
        a.classList.toggle('active-page', here);
        if (here) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      });

      if (push) history.pushState(null, '', url);
      window.scrollTo(0, 0);
      // Move focus to the new content so keyboard / screen-reader users aren't left on a stale link.
      cur.setAttribute('tabindex', '-1');
      cur.focus({ preventScroll: true });
    } catch (err) {
      if (push) location.href = url; else location.reload();
    }
  }

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest(LINKS);
    if (!a || a.target || a.origin !== location.origin || !/(\.html?|\/)$/.test(a.pathname)) return;
    e.preventDefault();
    if (a.pathname === location.pathname) return; // already on this page
    load(a.href, true);
  });

  window.addEventListener('popstate', () => load(location.href, false));
})();
