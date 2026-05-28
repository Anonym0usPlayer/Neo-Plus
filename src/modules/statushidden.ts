import { onFetch, offFetch } from './fetchmonitor';
const statusSelector = '#status';
const targetSelector =
  '.layout__wnd--active > .layout-tab-container > .fn__flex-1:not(.fn__none):not(.protyle)';
let statusObserver: MutationObserver | null = null;
let _onSetUILayout: (() => void) | null = null;
function checkAndToggleStatus(): void {
  const target = document.querySelector<HTMLElement>(targetSelector);
  const statusEl = document.querySelector<HTMLElement>(statusSelector);
  if (!statusEl) return;
  if (target) {
    statusEl.classList.add('neo-status-hidden');
  } else {
    statusEl.classList.remove('neo-status-hidden');
  }
}
function attachListener(): void {
  _onSetUILayout = () => {
    checkAndToggleStatus();
  };
  onFetch('setUILayout', _onSetUILayout);
}
function detachListener(): void {
  if (_onSetUILayout) {
    offFetch('setUILayout', _onSetUILayout);
    _onSetUILayout = null;
  }
}
function waitForStatusEl(): void {
  if (document.querySelector(statusSelector)) {
    attachListener();
    checkAndToggleStatus();
    return;
  }
  statusObserver = new MutationObserver((_mutations, observer) => {
    if (document.querySelector(statusSelector)) {
      observer.disconnect();
      statusObserver = null;
      attachListener();
      checkAndToggleStatus();
    }
  });
  statusObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
export function initStatusHidden(): void {
  waitForStatusEl();
}
export function destroyStatusHidden(): void {
  detachListener();
  if (statusObserver) {
    statusObserver.disconnect();
    statusObserver = null;
  }
  const statusEl = document.querySelector<HTMLElement>(statusSelector);
  if (statusEl) {
    statusEl.classList.remove('neo-status-hidden');
  }
}
