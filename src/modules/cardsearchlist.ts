import { onFetch, offFetch } from './fetchmonitor';
const _searchDomStableDelay = 200;
let _onSearchFetch: (() => void) | null = null;
let _searchDomStableTimer: ReturnType<typeof setTimeout> | null = null;
function updateCardSearchListClass(): void {
  const searchList = document.querySelector('#searchList');
  if (!searchList) return;
  const hasGroup = searchList.querySelector(':scope > .b3-list-item:not([data-type=search-item])');
  if (!hasGroup && !searchList.classList.contains('neo-notsearchgroup')) {
    searchList.classList.add('neo-notsearchgroup');
  } else if (hasGroup && searchList.classList.contains('neo-notsearchgroup')) {
    searchList.classList.remove('neo-notsearchgroup');
  }
}
function waitSearchDomStable(): void {
  if (_searchDomStableTimer) {
    clearTimeout(_searchDomStableTimer);
  }
  _searchDomStableTimer = setTimeout(() => {
    updateCardSearchListClass();
  }, _searchDomStableDelay);
}
export function initCardSearchList(): void {
  _onSearchFetch = () => {
    waitSearchDomStable();
  };
  onFetch('fullTextSearchBlock', _onSearchFetch);
  onFetch('getCriteria', _onSearchFetch);
  updateCardSearchListClass();
}
export function destroyCardSearchList(): void {
  if (_onSearchFetch) {
    offFetch('fullTextSearchBlock', _onSearchFetch);
    offFetch('getCriteria', _onSearchFetch);
    _onSearchFetch = null;
  }
  if (_searchDomStableTimer) {
    clearTimeout(_searchDomStableTimer);
    _searchDomStableTimer = null;
  }
  const searchList = document.querySelector('#searchList');
  if (searchList) {
    searchList.classList.remove('neo-notsearchgroup');
  }
}
