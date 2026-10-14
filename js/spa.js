// js/spa.js - SPA router for iOS standalone mode + seamless transitions
(function () {
  'use strict';

  async function navigateTo(url, push) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('fetch failed');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const apply = () => {
        document.title = doc.title;

        // Swap page-specific <style> (e.g. tasks.html inline style)
        document.querySelectorAll('head style').forEach(s => s.remove());
        const pageStyle = doc.querySelector('head style');
        if (pageStyle) {
          const s = document.createElement('style');
          s.id = 'spa-dynamic-style';
          s.textContent = pageStyle.textContent;
          document.head.appendChild(s);
        }

        document.body.innerHTML = doc.body.innerHTML;

        // Re-execute scripts; wait for the last module to load before firing
        // DOMContentLoaded so that async module inits (tasks.js, tracker.js,
        // notes.js) can find their DOM nodes.
        const scripts = [...doc.querySelectorAll('script')];
        const moduleScripts = [];

        scripts.forEach(old => {
          if (old.src && old.src.includes('spa.js')) return;
          const s = document.createElement('script');
          if (old.type) s.type = old.type;
          if (old.src) {
            const u = new URL(old.src, window.location.href);
            s.src = u.pathname + '?_t=' + Date.now();
            if (old.type === 'module') moduleScripts.push(s);
          } else {
            s.textContent = old.textContent;
          }
          document.body.appendChild(s);
        });

        // Fire DOMContentLoaded only after all module scripts have loaded.
        // Modules on iOS Safari parse + execute slower than Chrome; the old
        // fixed 15 ms delay was too short and caused "#shell is null" crashes.
        const fire = () => {
          document.dispatchEvent(new Event('DOMContentLoaded'));
          window.scrollTo(0, 0);
        };

        if (moduleScripts.length === 0) {
          fire();
        } else {
          let pending = moduleScripts.length;
          moduleScripts.forEach(s => {
            const done = () => { if (--pending === 0) fire(); };
            s.addEventListener('load', done);
            s.addEventListener('error', done); // don't hang on error
          });
        }
      };

      if (document.startViewTransition) {
        document.startViewTransition(apply);
      } else {
        apply();
      }

      if (push) history.pushState({ url }, '', url);
    } catch (err) {
      console.warn('SPA nav fallback:', err);
      window.location.href = url;
    }
  }

  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link || link.target || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const href = link.getAttribute('href');
    if (!href || /^(#|javascript:|mailto:|tel:)/.test(href)) return;
    const target = new URL(link.href, location.href);
    if (target.origin !== location.origin) return;
    e.preventDefault();
    navigateTo(target.href, true);
  });

  window.addEventListener('popstate', () => {
    navigateTo(location.href, false);
  });
})();
