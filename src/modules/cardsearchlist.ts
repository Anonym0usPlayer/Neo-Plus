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
function updateCardSearchListClass(): void {
  const searchList = document.querySelector('#searchList');
  const searchAssetList = document.querySelector('#searchAssetList');
  if (!searchList && !searchAssetList) return;
  if (searchList) {
    const isCard = searchList.firstElementChild?.matches('[data-type="search-item"]');
    searchList.classList.toggle('neo-cardsearchlist', !!isCard);
  }
  if (searchAssetList) {
    const isCard = searchAssetList.firstElementChild?.matches('[data-type="search-item"]');
    searchAssetList.classList.toggle('neo-cardsearchlist', !!isCard);
  }
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
  document.querySelector('#searchList')?.classList.remove('neo-cardsearchlist');
  document.querySelector('#searchAssetList')?.classList.remove('neo-cardsearchlist');
}