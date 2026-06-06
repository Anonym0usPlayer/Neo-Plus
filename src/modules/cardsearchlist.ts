import { fetchListener } from './fetchmonitor';
const _searchMaxAttempts = 5;
const _searchInterval = 10;
let _searchAttempts = 0;
let _searchTimer: number | null = null;
const _fetchListener = fetchListener();
_fetchListener.on('fullTextSearchBlock', () => { waitSearchDomStable(); });
_fetchListener.on('getCriteria', () => { waitSearchDomStable(); });
_fetchListener.on('fullTextSearchAssetContent', () => { waitSearchDomStable(); });
_fetchListener.on('setLocalStorageVal', () => { waitSearchDomStable(); });
_fetchListener.on('getAssetContent', () => { waitSearchDomStable(); });
_fetchListener.on('getRecentUpdatedBlocks', () => { waitSearchDomStable(); });
const _searchListSelectors = ['#searchList', '#searchAssetList', '#searchUnRefList'];
function updateCardSearchListClass(): void {
  const results = _searchListSelectors.map(selector => document.querySelector(selector)).filter(Boolean);
  if (results.length === 0) return;
  results.forEach(el => {
    const isCard = el!.firstElementChild?.matches('[data-type="search-item"]');
    el!.classList.toggle('neo-cardsearchlist', !!isCard);
  });
}
function waitSearchDomStable(): void {
  if (_searchTimer) return;
  _searchAttempts = 0;
  _searchTimer = window.setInterval(() => {
    _searchAttempts++;
    updateCardSearchListClass();
    if (_searchAttempts >= _searchMaxAttempts) {
      if (_searchTimer !== null) window.clearInterval(_searchTimer!);
      _searchTimer = null;
    }
  }, _searchInterval);
}
export function initCardSearchList(): void {
  _fetchListener.attach();
  updateCardSearchListClass();
}
export function destroyCardSearchList(): void {
  _fetchListener.detach();
  if (_searchTimer !== null) {
    window.clearInterval(_searchTimer!);
    _searchTimer = null;
  }
  _searchListSelectors.forEach(selector => {
    document.querySelector(selector)?.classList.remove('neo-cardsearchlist');
  });
}