// Place each image in the shortest available column while preserving its own ratio.
const generationGalleries = new WeakMap();

window.initGenerationGallery = (root = document) => {
  for (const gallery of root.querySelectorAll('.generations-gallery')) {
    if (generationGalleries.has(gallery)) {
      generationGalleries.get(gallery)();
      continue;
    }

    const images = [...gallery.querySelectorAll('.generations-image')];
    let previousWidth = 0;
    let previousColumns = 0;

    const layout = () => {
      const width = gallery.clientWidth;
      if (!width) return;
      const columns = window.innerWidth <= 760 ? 1 : window.innerWidth <= 900 ? 2 : 4;
      if (width === previousWidth && columns === previousColumns) return;
      previousWidth = width;
      previousColumns = columns;

      const gap = 8;
      const columnWidth = (width - gap * (columns - 1)) / columns;
      const heights = Array(columns).fill(0);

      for (const image of images) {
        let span = 1;
        let top = Math.min(...heights);
        let column = heights.indexOf(top);

        // A two-column image is safe only when both columns end at the same
        // height. Otherwise it would leave an empty space beneath the image.
        if (columns > 1 && image.dataset.span === '2') {
          for (let start = 0; start < columns - 1; start += 1) {
            if (Math.abs(heights[start] - heights[start + 1]) <= 1 && heights[start] <= top + 1) {
              span = 2;
              column = start;
              top = Math.max(heights[start], heights[start + 1]);
              break;
            }
          }
        }

        const imageWidth = columnWidth * span + gap * (span - 1);
        const imageHeight = imageWidth * Number(image.dataset.height) / Number(image.dataset.width);
        image.style.width = `${imageWidth}px`;
        image.style.height = `${imageHeight}px`;
        image.style.transform = `translate(${column * (columnWidth + gap)}px, ${top}px)`;
        for (let i = column; i < column + span; i += 1) heights[i] = top + imageHeight + gap;
      }

      gallery.style.height = `${Math.max(...heights) - gap}px`;
      gallery.classList.add('is-laid-out');
    };

    generationGalleries.set(gallery, layout);
    layout();
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(layout).observe(gallery);
    else window.addEventListener('resize', layout, { passive: true });
  }
};

window.initGenerationGallery();

// Keep the header and its audio element alive while switching local pages.
(() => {
  const pages = window.portfolioPageMarkup;
  if (!pages) return;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const physicalPage = location.pathname.split('/').pop() || 'index.html';
  if (!Object.hasOwn(pages, physicalPage)) return;

  const directory = new URL('./', location.href).pathname;
  const hasPage = name => Object.hasOwn(pages, name);
  const fragmentFromHash = hash => {
    try { return decodeURIComponent(hash.slice(1)); }
    catch { return ''; }
  };
  const pageFromUrl = () => {
    const requested = new URLSearchParams(location.search).get('view');
    return hasPage(requested) ? requested : physicalPage;
  };

  const cache = new Map([[physicalPage, {
    main: document.querySelector('main'),
    footer: document.querySelector('.site-footer'),
  }]]);
  const initialized = new Set([physicalPage]);
  const header = document.querySelector('.site-header');
  let activePage = physicalPage;

  function getPage(name) {
    if (cache.has(name)) return cache.get(name);

    const template = document.createElement('template');
    template.innerHTML = pages[name].main + pages[name].footer;
    const nodes = {
      main: template.content.querySelector('main'),
      footer: template.content.querySelector('footer'),
    };
    window.normalizeTypography?.(nodes.main);
    window.normalizeTypography?.(nodes.footer);
    cache.set(name, nodes);
    return nodes;
  }

  function updateHeader(name) {
    const brand = header?.querySelector('.brand');
    const links = header?.querySelectorAll('.main-nav a');
    if (brand) brand.href = name === 'index.html' ? '#top' : './index.html#top';
    if (!links?.length) return;
    links[0].toggleAttribute('aria-current', name === 'projects.html');
    if (name === 'projects.html') links[0].setAttribute('aria-current', 'page');
    links[1].href = './materials.html?category=videos';
    links[2].href = './materials.html?category=articles';
  }

  function showPage(name, fragment = '') {
    if (name !== activePage) {
      const outgoing = cache.get(activePage);
      const incoming = getPage(name);
      outgoing.main.replaceWith(incoming.main);
      outgoing.footer.replaceWith(incoming.footer);
      activePage = name;
      document.body.className = pages[name].bodyClass;
      document.title = pages[name].title;
      updateHeader(name);
      if (!initialized.has(name)) {
        if (name === 'index.html') window.initTooltipPosition?.(incoming.main);
        if (name === 'projects.html') window.initProjectFilters?.(incoming.main);
        if (name === 'materials.html') window.initMaterialsFilters?.(incoming.main);
        if (name === 'midjourney-gallery.html') window.initGenerationGallery?.(incoming.main);
        initialized.add(name);
      }
    }

    if (name === 'materials.html') {
      window.setMaterialsCategory?.(new URLSearchParams(location.search).get('category'), document.querySelector('main'));
    }

    // Reset the position before the new page is painted. Waiting for the next
    // frame briefly exposed the previous page's scroll position on mobile.
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    try {
      const target = fragment && document.getElementById(fragment);
      if (target) target.scrollIntoView({ behavior: 'auto' });
      else window.scrollTo(0, 0);
    } finally {
      root.style.scrollBehavior = previousScrollBehavior;
    }
  }

  function localPage(url) {
    if (url.protocol !== location.protocol || url.host !== location.host) return null;
    if (!url.pathname.startsWith(directory)) return null;
    const name = url.pathname.slice(directory.length);
    return hasPage(name) ? name : null;
  }

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target.closest('a[href]');
    if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
    if (anchor.getAttribute('href').startsWith('#')) return;
    const destination = new URL(anchor.href, location.href);
    const name = localPage(destination);
    if (!name) return;

    event.preventDefault();
    const nextUrl = new URL(location.href);
    if (name === physicalPage) nextUrl.searchParams.delete('view');
    else nextUrl.searchParams.set('view', name);
    nextUrl.searchParams.delete('category');
    if (name === 'materials.html' && destination.searchParams.has('category')) {
      nextUrl.searchParams.set('category', destination.searchParams.get('category'));
    }
    nextUrl.hash = destination.hash;
    history.pushState(null, '', nextUrl);
    showPage(name, fragmentFromHash(destination.hash));
  });

  window.addEventListener('popstate', () => {
    showPage(pageFromUrl(), fragmentFromHash(location.hash));
  });

  if (pageFromUrl() !== physicalPage) {
    showPage(pageFromUrl(), fragmentFromHash(location.hash));
  }

  updateHeader(activePage);
})();
