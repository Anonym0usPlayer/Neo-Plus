import { fetchListener } from './fetchmonitor';
const _fetchListener = fetchListener();
const _searchListSelectors = ['#searchList', '#searchAssetList', '#searchUnRefList'];
function updateCardSearchListClass(): void {
  try {
    const results = _searchListSelectors
      .map(selector => document.querySelector(selector))
      .filter(Boolean);
    if (results.length === 0) return;
    results.forEach(el => {
      try {
        const firstChild = (el as Element).firstElementChild;
        const isCard = firstChild
          ? firstChild.matches('[data-type="search-item"]')
          : false;
        (el as Element).classList.toggle('neo-cardsearchlist', isCard);
      } catch (_e) {}
    });
  } catch (_e) {}
}
_fetchListener.on('fullTextSearchBlock', updateCardSearchListClass);
_fetchListener.on('getCriteria', updateCardSearchListClass);
_fetchListener.on('fullTextSearchAssetContent', updateCardSearchListClass);
_fetchListener.on('getRecentUpdatedBlocks', updateCardSearchListClass);
export function initCardSearchList(): void {
  try {
    _fetchListener.attach();
    requestAnimationFrame(() => {
      try { updateCardSearchListClass(); } catch (_e) {}
    });
  } catch (_e) {}
}
export function destroyCardSearchList(): void {
  try {
    _fetchListener.detach();
    _searchListSelectors.forEach(selector => {
      try {
        document.querySelector(selector)?.classList.remove('neo-cardsearchlist');
      } catch (_e) {}
    });
  } catch (_e) {}
}