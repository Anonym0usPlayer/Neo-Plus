const DEBOUNCE_DELAY = 200;
const STATUS_SELECTOR = '#status';
const TARGET_SELECTOR =
  '.layout__wnd--active > .layout-tab-container > .fn__flex-1:not(.fn__none):not(.protyle)';
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let statusObserver: MutationObserver | null = null;
let isListening = false;
function checkAndToggleStatus(): void {
  const target = document.querySelector<HTMLElement>(TARGET_SELECTOR);
  const statusEl = document.querySelector<HTMLElement>(STATUS_SELECTOR);
  if (!statusEl) return;
  if (target) {
    statusEl.classList.add('neo-status-hidden');
  } else {
    statusEl.classList.remove('neo-status-hidden');
  }
}
function handleClick(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    checkAndToggleStatus();
  }, DEBOUNCE_DELAY);
}
function handleKeyUp(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    checkAndToggleStatus();
  }, DEBOUNCE_DELAY);
}
function startListening(): void {
  if (isListening) return;
  document.addEventListener('click', handleClick);
  document.addEventListener('keyup', handleKeyUp);
  isListening = true;
  checkAndToggleStatus();
}
function stopListening(): void {
  document.removeEventListener('click', handleClick);
  document.removeEventListener('keyup', handleKeyUp);
  isListening = false;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}
function waitForStatusEl(): void {
  if (document.querySelector(STATUS_SELECTOR)) {
    startListening();
    return;
  }
  statusObserver = new MutationObserver((_mutations, observer) => {
    if (document.querySelector(STATUS_SELECTOR)) {
      observer.disconnect();
      statusObserver = null;
      startListening();
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
  stopListening();
  if (statusObserver) {
    statusObserver.disconnect();
    statusObserver = null;
  }
}
export default {
  init: initStatusHidden,
  destroy: destroyStatusHidden,
};
