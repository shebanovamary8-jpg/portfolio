(() => {
  const header = document.querySelector('.site-header');
  const toggle = header?.querySelector('.mobile-menu-toggle');
  const menu = header?.querySelector('.main-nav');
  if (!header || !toggle || !menu) return;

  const mobile = window.matchMedia('(max-width: 760px)');
  const close = () => {
    header.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    const open = !header.classList.contains('menu-open');
    header.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', event => {
    if (!header.contains(event.target)) close();
  });
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && header.classList.contains('menu-open')) {
      close();
      toggle.focus();
    }
  });
  mobile.addEventListener('change', close);
})();
