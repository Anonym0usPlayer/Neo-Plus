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
let _pendingUpdate = false;
function scheduleUpdate(): void {
  if (_pendingUpdate) return;
  _pendingUpdate = true;
  requestAnimationFrame(() => {
    _pendingUpdate = false;
    updateCardSearchListClass();
  });
}
_fetchListener.on('fullTextSearchBlock', scheduleUpdate);
_fetchListener.on('getCriteria', scheduleUpdate);
_fetchListener.on('fullTextSearchAssetContent', scheduleUpdate);
_fetchListener.on('getRecentUpdatedBlocks', scheduleUpdate);
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
    _pendingUpdate = false;
    _searchListSelectors.forEach(selector => {
      try {
        document.querySelector(selector)?.classList.remove('neo-cardsearchlist');
      } catch (_e) {}
    });
  } catch (_e) {}
}