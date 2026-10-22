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

// Keep the header and its audio element alive while switching pages.
(() => {
  const pages = window.portfolioPageMarkup;
  if (!pages) return;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const siteRoot = new URL('./', document.baseURI);
  const fileMode = location.protocol === 'file:';
  const hasPage = name => Object.hasOwn(pages, name);
  const pageAliases = {
    'project.html': 'ila-estate.html',
    'magazine-shop.html': 'tissue-magazine.html',
  };
  const fragmentFromHash = hash => {
    try { return decodeURIComponent(hash.slice(1)); }
    catch { return ''; }
  };

  function routeFromUrl(url, includeLegacyView = true) {
    if (url.protocol !== location.protocol || url.host !== location.host) return null;
    if (!url.pathname.startsWith(siteRoot.pathname)) return null;

    const path = url.pathname.slice(siteRoot.pathname.length).replace(/\/+$/, '');
    let page;
    let category = 'videos';
    if (path === '' || path === 'index.html' || path === 'main' || path === 'main/index.html') {
      page = 'index.html';
    } else if (path === 'videos' || path === 'videos/index.html') {
      page = 'materials.html';
    } else if (path === 'articles' || path === 'articles/index.html') {
      page = 'materials.html';
      category = 'articles';
    } else if (path === 'privacypolicy' || path === 'privacypolicy/index.html') {
      page = 'privacypolicy.html';
    } else if (path === 'consent' || path === 'consent/index.html') {
      page = 'consent.html';
    } else if (Object.hasOwn(pageAliases, path)) {
      page = pageAliases[path];
    } else if (hasPage(path)) {
      page = path;
    } else {
      return null;
    }

    if (includeLegacyView) {
      const requested = url.searchParams.get('view');
      if (Object.hasOwn(pageAliases, requested)) page = pageAliases[requested];
      else if (hasPage(requested)) page = requested;
    }
    if (page === 'materials.html' && url.searchParams.get('category') === 'articles') {
      category = 'articles';
    }
    return { page, category };
  }

  function canonicalUrl(route, hash = '') {
    const path = route.page === 'index.html' ? 'main'
      : route.page === 'materials.html' ? route.category
      : route.page === 'privacypolicy.html' ? 'privacypolicy'
      : route.page === 'consent.html' ? 'consent'
      : route.page;
    const url = new URL(path, siteRoot);
    url.hash = hash;
    return url;
  }

  function fileUrl(route, hash = '') {
    const url = new URL(location.href);
    if (route.page === physicalPage) url.searchParams.delete('view');
    else url.searchParams.set('view', route.page);
    if (route.page === 'materials.html') url.searchParams.set('category', route.category);
    else url.searchParams.delete('category');
    url.hash = hash;
    return url;
  }

  const physicalRoute = routeFromUrl(new URL(location.href), false);
  if (!physicalRoute) return;
  const physicalPage = physicalRoute.page;
  const currentRoute = () => routeFromUrl(new URL(location.href)) || physicalRoute;

  if (!fileMode) {
    const route = currentRoute();
    const path = location.pathname.slice(siteRoot.pathname.length);
    const directHome = route.page === 'index.html'
      && (path === '' || path === 'index.html')
      && !new URLSearchParams(location.search).has('view');
    if (!directHome) {
      const cleanUrl = canonicalUrl(route, location.hash);
      if (cleanUrl.href !== location.href) history.replaceState(null, '', cleanUrl);
    }
  }

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

  function updateHeader(route) {
    const brand = header?.querySelector('.brand');
    const links = header?.querySelectorAll('.main-nav a');
    if (brand) brand.href = new URL('main/', siteRoot).href;
    if (!links?.length) return;
    const targets = ['projects.html', 'videos/', 'articles/'];
    for (let index = 0; index < targets.length; index += 1) {
      links[index].href = new URL(targets[index], siteRoot).href;
      const selected = index === 0
        ? route.page === 'projects.html'
        : route.page === 'materials.html'
          && route.category === (index === 1 ? 'videos' : 'articles');
      if (selected) links[index].setAttribute('aria-current', 'page');
      else links[index].removeAttribute('aria-current');
    }
  }

  function showPage(route, fragment = '') {
    const name = route.page;
    if (name !== activePage) {
      const outgoing = cache.get(activePage);
      const incoming = getPage(name);
      outgoing.main.replaceWith(incoming.main);
      outgoing.footer.replaceWith(incoming.footer);
      activePage = name;
      document.body.className = pages[name].bodyClass;
      document.title = pages[name].title;
      if (!initialized.has(name)) {
        if (name === 'index.html') window.initTooltipPosition?.(incoming.main);
        if (name === 'projects.html') window.initProjectFilters?.(incoming.main);
        if (name === 'materials.html') window.initMaterialsFilters?.(incoming.main);
        if (name === 'midjourney-gallery.html') window.initGenerationGallery?.(incoming.main);
        initialized.add(name);
      }
    }

    if (name === 'materials.html') {
      window.setMaterialsCategory?.(route.category, document.querySelector('main'));
    }
    updateHeader(route);

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

  window.syncMaterialsRoute = category => {
    if (activePage !== 'materials.html') return;
    const route = { page: 'materials.html', category };
    history.pushState(null, '', fileMode ? fileUrl(route) : canonicalUrl(route));
    updateHeader(route);
  };

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target.closest('a[href]');
    if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
    const href = anchor.getAttribute('href');
    if (href.startsWith('#')) {
      event.preventDefault();
      const nextUrl = new URL(location.href);
      nextUrl.hash = href;
      history.pushState(null, '', nextUrl);
      showPage(currentRoute(), fragmentFromHash(href));
      return;
    }
    const destination = new URL(anchor.href, location.href);
    const route = routeFromUrl(destination);
    if (!route) return;

    event.preventDefault();
    history.pushState(null, '', fileMode
      ? fileUrl(route, destination.hash)
      : canonicalUrl(route, destination.hash));
    showPage(route, fragmentFromHash(destination.hash));
  });

  window.addEventListener('popstate', () => {
    showPage(currentRoute(), fragmentFromHash(location.hash));
  });

  const initialRoute = currentRoute();
  if (initialRoute.page !== physicalPage) {
    showPage(initialRoute, fragmentFromHash(location.hash));
  } else {
    if (initialRoute.page === 'materials.html') {
      window.setMaterialsCategory?.(initialRoute.category, document.querySelector('main'));
    }
    updateHeader(initialRoute);
  }
})();
