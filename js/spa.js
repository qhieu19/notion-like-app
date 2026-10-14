// js/spa.js - Standalone SPA Router for iOS Home Screen & seamless transitions
(function () {
  'use strict';

  async function navigateTo(url, push = true) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load page');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const apply = () => {
        document.title = doc.title;

        // Sync page-specific style in head (e.g. tasks.html custom style)
        const oldDynamic = document.getElementById('spa-dynamic-style');
        if (oldDynamic) oldDynamic.remove();
        const pageStyle = doc.querySelector('head style');
        if (pageStyle) {
          const s = document.createElement('style');
          s.id = 'spa-dynamic-style';
          s.textContent = pageStyle.textContent;
          document.head.appendChild(s);
        }

        // Replace body content
        document.body.innerHTML = doc.body.innerHTML;

        // Execute scripts in doc
        const scripts = doc.querySelectorAll('script');
        scripts.forEach((oldScript) => {
          if (oldScript.src && oldScript.src.includes('spa.js')) return; // Avoid re-running SPA router
          const newScript = document.createElement('script');
          if (oldScript.type) newScript.type = oldScript.type;
          if (oldScript.src) {
            const u = new URL(oldScript.src, window.location.href);
            newScript.src = u.pathname + '?_t=' + Date.now();
          } else {
            newScript.textContent = oldScript.textContent;
          }
          document.body.appendChild(newScript);
        });

        setTimeout(() => {
          document.dispatchEvent(new Event('DOMContentLoaded'));
          window.scrollTo(0, 0);
        }, 15);
      };

      if (document.startViewTransition) {
        document.startViewTransition(apply);
      } else {
        apply();
      }

      if (push) {
        history.pushState({ url }, '', url);
      }
    } catch (err) {
      console.warn('SPA navigation fallback', err);
      window.location.href = url;
    }
  }

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link || link.target || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

    const targetUrl = new URL(link.href, window.location.href);
    if (targetUrl.origin !== window.location.origin) return;

    e.preventDefault();
    navigateTo(targetUrl.href, true);
  });

  window.addEventListener('popstate', () => {
    navigateTo(window.location.href, false);
  });
})();
