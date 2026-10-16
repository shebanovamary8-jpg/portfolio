window.initProjectFilters = (root = document) => {
const filterButtons = [...root.querySelectorAll('.project-filter:not(.material-filter)')];
const projectCards = [...root.querySelectorAll('.projects-page-grid .project-card')];
const projectsCount = root.querySelector('.projects-count');
const emptyMessage = root.querySelector('.projects-empty');
const resultsStatus = root.querySelector('#project-results-status');

if (filterButtons.length && projectCards.length) {
  if (projectsCount) projectsCount.textContent = String(projectCards.length);
  let selectedCategory = null;

  function updateProjects() {
    let visibleCount = 0;

    for (const card of projectCards) {
      const categories = card.dataset.categories.split(/\s+/);
      const matches = selectedCategory === null || categories.includes(selectedCategory);
      card.hidden = !matches;
      if (matches) visibleCount += 1;
    }

    emptyMessage.hidden = visibleCount !== 0;
    resultsStatus.textContent = `Показано проектов: ${visibleCount}`;
    for (const button of filterButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.filter === selectedCategory));
    }
  }

  for (const button of filterButtons) {
    button.addEventListener('click', () => {
      const category = button.dataset.filter;
      selectedCategory = selectedCategory === category ? null : category;
      updateProjects();
    });
  }

  updateProjects();
}
};

window.initProjectFilters();

const materialsFiltersByRoot = new WeakMap();

window.initMaterialsFilters = (root = document) => {
  if (materialsFiltersByRoot.has(root)) return materialsFiltersByRoot.get(root);

  const filterButtons = [...root.querySelectorAll('.material-filter')];
  const cards = [...root.querySelectorAll('.material-card')];
  const grids = [...root.querySelectorAll('.materials-video-grid, .materials-article-grid')];
  if (!filterButtons.length) return null;

  const count = root.querySelector('.projects-count');
  const emptyMessage = root.querySelector('.materials-empty');
  const resultsStatus = root.querySelector('#materials-results-status');
  let selectedCategory = 'videos';
  if (count) count.textContent = String(cards.length);

  function updateMaterials() {
    let visibleCount = 0;
    for (const card of cards) {
      const matches = card.dataset.category === selectedCategory;
      card.hidden = !matches;
      if (matches) visibleCount += 1;
    }
    for (const grid of grids) {
      grid.hidden = ![...grid.querySelectorAll('.material-card')].some(card => !card.hidden);
    }
    if (emptyMessage) emptyMessage.hidden = visibleCount !== 0;
    if (resultsStatus) resultsStatus.textContent = `Показано материалов: ${visibleCount}`;
    for (const button of filterButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.filter === selectedCategory));
    }
  }

  for (const button of filterButtons) {
    button.addEventListener('click', () => {
      controller.setCategory(button.dataset.filter);
    });
  }

  const controller = {
    setCategory(category) {
      selectedCategory = filterButtons.some(button => button.dataset.filter === category) ? category : 'videos';
      updateMaterials();
    },
  };
  materialsFiltersByRoot.set(root, controller);
  controller.setCategory(new URLSearchParams(location.search).get('category'));
  return controller;
};

window.setMaterialsCategory = (category, root = document) => {
  window.initMaterialsFilters(root)?.setCategory(category);
};

window.initMaterialsFilters(document.querySelector('main'));
