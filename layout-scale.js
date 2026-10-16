const laptopLayout = window.matchMedia('(min-width: 1101px)');

function updateLayoutScale() {
  // clientWidth excludes a persistent vertical scrollbar. innerWidth does not,
  // which made the scaled 1440px canvas extend past the right edge on macOS.
  const availableWidth = document.documentElement.clientWidth || window.innerWidth;
  const scale = laptopLayout.matches ? availableWidth / 1440 : 1;
  document.documentElement.style.setProperty('--layout-scale', String(scale));
  document.documentElement.style.setProperty('--layout-viewport-height', `${window.innerHeight / scale}px`);
}

updateLayoutScale();
window.addEventListener('resize', updateLayoutScale, { passive: true });
document.addEventListener('DOMContentLoaded', updateLayoutScale);
window.addEventListener('load', updateLayoutScale);

if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(updateLayoutScale).observe(document.documentElement);
}
