// Keep hover and keyboard tooltips within the tablet/mobile viewport.
window.initTooltipPosition = (root = document) => {
  const compactLayout = window.matchMedia('(max-width: 1100px)');
  const clickTooltips = window.matchMedia('(max-width: 1100px), (hover: none)');
  const triggers = [...root.querySelectorAll('[aria-describedby]')]
    .map(trigger => ({ trigger, tooltip: root.querySelector(`#${trigger.getAttribute('aria-describedby')}`) }))
    .filter(({ tooltip }) => tooltip?.getAttribute('role') === 'tooltip');
  const heroEntries = triggers.filter(({ tooltip }) => tooltip.classList.contains('hero-tooltip'));

  let active = null;

  function closeHeroTooltips() {
    for (const { trigger } of heroEntries) {
      trigger.closest('.hero-action').classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    }
    if (heroEntries.includes(active)) active = null;
  }

  function position({ trigger, tooltip }) {
    const mobileAwards = tooltip.classList.contains('hero-tooltip-awards') && window.matchMedia('(max-width: 760px)').matches;
    tooltip.style.top = '';
    tooltip.style.bottom = '';
    tooltip.style.marginLeft = '';
    tooltip.style.visibility = '';
    if (tooltip.classList.contains('hero-tooltip-awards')) {
      tooltip.style.left = '';
      tooltip.style.right = '';
      tooltip.style.translate = '';
    }
    // On phones the consultation tooltip is centered in the viewport by CSS.
    if (tooltip.classList.contains('designer-tooltip') && window.matchMedia('(max-width: 760px)').matches) return;
    if (!compactLayout.matches) return;

    const anchor = tooltip.offsetParent;
    if (!anchor) return;

    const anchorRect = anchor.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const inset = 12;
    const gap = 12;
    const viewportHeight = document.documentElement.clientHeight;
    const viewportWidth = document.documentElement.clientWidth;
    if (triggerRect.bottom < inset || triggerRect.top > viewportHeight - inset) {
      tooltip.style.visibility = 'hidden';
      return;
    }

    const tooltipRect = tooltip.getBoundingClientRect();
    const above = triggerRect.top - tooltipRect.height - gap;
    const below = triggerRect.bottom + gap;
    const overflow = top => Math.max(0, inset - top) + Math.max(0, top + tooltipRect.height - viewportHeight + inset);
    const preferred = tooltip.classList.contains('hero-tooltip') ? above : below;
    const alternate = preferred === above ? below : above;
    const best = overflow(alternate) < overflow(preferred) ? alternate : preferred;
    const top = Math.min(Math.max(best, inset), Math.max(inset, viewportHeight - tooltipRect.height - inset));

    tooltip.style.top = `${top - anchorRect.top}px`;
    tooltip.style.bottom = 'auto';

    const positioned = tooltip.getBoundingClientRect();
    if (mobileAwards) {
      tooltip.style.left = `${(viewportWidth - positioned.width) / 2 - anchorRect.left}px`;
      tooltip.style.right = 'auto';
      tooltip.style.translate = '0 0';
      return;
    }
    const left = Math.min(Math.max(positioned.left, inset), Math.max(inset, viewportWidth - positioned.width - inset));
    tooltip.style.marginLeft = `${left - positioned.left}px`;
  }

  for (const entry of triggers) {
    entry.trigger.addEventListener('pointerenter', () => {
      active = entry;
      position(entry);
      if (heroEntries.includes(entry) && !clickTooltips.matches) {
        entry.trigger.setAttribute('aria-expanded', 'true');
      }
    });
    entry.trigger.addEventListener('focusin', () => {
      active = entry;
      position(entry);
      if (heroEntries.includes(entry) && !clickTooltips.matches) {
        entry.trigger.setAttribute('aria-expanded', 'true');
      }
    });
    entry.trigger.addEventListener('pointerleave', () => {
      if (active === entry && !entry.trigger.matches(':focus-within')) active = null;
      if (heroEntries.includes(entry) && !clickTooltips.matches) {
        entry.trigger.setAttribute('aria-expanded', entry.trigger.matches(':focus-visible') ? 'true' : 'false');
      }
    });
    entry.trigger.addEventListener('focusout', () => {
      if (active === entry && !entry.trigger.matches(':hover')) active = null;
      if (heroEntries.includes(entry) && !clickTooltips.matches) {
        entry.trigger.setAttribute('aria-expanded', entry.trigger.matches(':hover') ? 'true' : 'false');
      }
    });
  }

  for (const entry of heroEntries) {
    entry.trigger.addEventListener('click', event => {
      if (!clickTooltips.matches) {
        if (event.detail > 0) entry.trigger.blur();
        return;
      }

      event.stopPropagation();
      const action = entry.trigger.closest('.hero-action');
      const willOpen = !action.classList.contains('is-open');
      closeHeroTooltips();
      if (willOpen) {
        action.classList.add('is-open');
        entry.trigger.setAttribute('aria-expanded', 'true');
        active = entry;
        position(entry);
      }
    });
  }

  document.addEventListener('click', event => {
    if (!event.target.closest('.hero-action')) closeHeroTooltips();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeHeroTooltips();
  });

  window.addEventListener('resize', () => {
    if (!clickTooltips.matches) closeHeroTooltips();
    if (active) position(active);
  }, { passive: true });
  window.addEventListener('scroll', () => {
    if (active) position(active);
  }, { passive: true });
};

window.initTooltipPosition();
