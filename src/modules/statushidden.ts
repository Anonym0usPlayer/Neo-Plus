const debounceDelay = 200;
const statusSelector = '#status';
const targetSelector =
  '.layout__wnd--active > .layout-tab-container > .fn__flex-1:not(.fn__none):not(.protyle)';
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let statusObserver: MutationObserver | null = null;
let isListening = false;
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
function handleStatusUpdate(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    checkAndToggleStatus();
  }, debounceDelay);
}
function startListening(): void {
  if (isListening) return;
  document.addEventListener('click', handleStatusUpdate);
  document.addEventListener('keyup', handleStatusUpdate);
  isListening = true;
  checkAndToggleStatus();
}
function stopListening(): void {
  document.removeEventListener('click', handleStatusUpdate);
  document.removeEventListener('keyup', handleStatusUpdate);
  isListening = false;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}
function waitForStatusEl(): void {
  if (document.querySelector(statusSelector)) {
    startListening();
    return;
  }
  statusObserver = new MutationObserver((_mutations, observer) => {
    if (document.querySelector(statusSelector)) {
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
  const statusEl = document.querySelector<HTMLElement>(statusSelector);
  if (statusEl) {
    statusEl.classList.remove('neo-status-hidden');
  }
}
