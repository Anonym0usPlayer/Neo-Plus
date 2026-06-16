import { isMobile } from '../modules/env';
import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
type Direction = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';
interface CenterPoint {
  el: HTMLElement;
  x: number;
  y: number;
}
let isSessionActive = false;
let pollTimerId: ReturnType<typeof setInterval> | null = null;
let pollAttempts = 0;
let activeMenuElement: HTMLElement | null = null;
let menuObserver: MutationObserver | null = null;
let keydownHandler: ((evt: KeyboardEvent) => void) | null = null;
let cachedCenters: CenterPoint[] = [];
function findHintMenu(): HTMLElement | null {
  return document.querySelector('.protyle-hint.hint--menu:not(.fn__none)');
}
function onMenuHidden(): void {
  if (!isMenuVisible(activeMenuElement)) {
    endSession();
  }
}
function endSession(): void {
  isSessionActive = false;
  activeMenuElement = null;
  cachedCenters = [];
  if (pollTimerId !== null) {
    clearInterval(pollTimerId);
    pollTimerId = null;
  }
  if (menuObserver) {
    try {
      menuObserver.disconnect();
    } catch {}
    menuObserver = null;
  }
}
function isMenuVisible(el: HTMLElement | null): boolean {
  return !!(el && document.body.contains(el) && !el.classList.contains('fn__none'));
}
function attachMenuObserver(): void {
  if (menuObserver) return;
  menuObserver = new MutationObserver(onMenuHidden);
  try {
    menuObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'style'],
      childList: true,
      subtree: true,
    });
  } catch {}
}
function beginPollingForMenu(): void {
  const found = findHintMenu();
  if (found) {
    activeMenuElement = found;
    attachMenuObserver();
    return;
  }
  pollAttempts = 0;
  const timerId = setInterval(() => {
    pollAttempts += 1;
    const el = findHintMenu();
    if (el) {
      clearInterval(timerId);
      pollTimerId = null;
      activeMenuElement = el;
      attachMenuObserver();
    } else if (pollAttempts >= 10) {
      clearInterval(timerId);
      pollTimerId = null;
      endSession();
    }
  }, 100);
  pollTimerId = timerId;
}
function getListItems(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('.b3-list-item'));
}
function getFocusedItem(container: HTMLElement): HTMLElement | null {
  return container.querySelector('.b3-list-item--focus');
}
function computeCenters(items: HTMLElement[]): CenterPoint[] {
  return items.map((el) => {
    const rect = el.getBoundingClientRect();
    return {
      el,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  });
}
function selectClosestInDirection(
  centers: CenterPoint[],
  from: CenterPoint,
  direction: Direction
): HTMLElement | null {
  const xTolerance = Math.max(
    (from.el.getBoundingClientRect().width) / 2,
    10
  );
  let filterFn: (c: CenterPoint) => boolean;
  switch (direction) {
    case 'ArrowUp':
      filterFn = (c) => c.y < from.y - 1 && Math.abs(c.x - from.x) <= xTolerance;
      break;
    case 'ArrowDown':
      filterFn = (c) => c.y > from.y + 1 && Math.abs(c.x - from.x) <= xTolerance;
      break;
    case 'ArrowLeft':
      filterFn = (c) => c.x < from.x - 1;
      break;
    case 'ArrowRight':
      filterFn = (c) => c.x > from.x + 1;
      break;
    default:
      return null;
  }
  let best: CenterPoint | null = null;
  let bestD2 = Infinity;
  for (let i = 0; i < centers.length; i++) {
    const c = centers[i];
    if (c.el === from.el || !filterFn(c)) continue;
    const dx = c.x - from.x;
    const dy = c.y - from.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestD2) {
      best = c;
      bestD2 = d2;
    }
  }
  return best ? best.el : null;
}
function moveFocus(targetEl: HTMLElement): void {
  const current = getFocusedItem(activeMenuElement!);
  if (current === targetEl) return;
  if (current) current.classList.remove('b3-list-item--focus');
  targetEl.classList.add('b3-list-item--focus');
  try {
    targetEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  } catch {}
}
function findNextByDomOrder(
  items: HTMLElement[],
  currentEl: HTMLElement
): HTMLElement | null {
  const index = items.indexOf(currentEl);
  if (index === -1) return items[0] ?? null;
  if (index + 1 < items.length) return items[index + 1];
  return items[0] ?? null;
}
function findPrevByDomOrder(
  items: HTMLElement[],
  currentEl: HTMLElement
): HTMLElement | null {
  const index = items.indexOf(currentEl);
  if (index === -1) return items[items.length - 1] ?? null;
  if (index - 1 >= 0) return items[index - 1];
  return items[items.length - 1] ?? null;
}
function findEdgeInRow(
  centers: CenterPoint[],
  from: CenterPoint,
  getEdge: 'leftmost' | 'rightmost'
): HTMLElement | null {
  const fromRect = from.el.getBoundingClientRect();
  const fromCenterY = fromRect.top + fromRect.height / 2;
  let best: CenterPoint | null = null;
  for (let i = 0; i < centers.length; i++) {
    const c = centers[i];
    if (c.el === from.el) continue;
    const r = c.el.getBoundingClientRect();
    const cY = r.top + r.height / 2;
    const threshold = Math.min(fromRect.height, r.height) / 2;
    if (Math.abs(cY - fromCenterY) > threshold) continue;
    if (best === null) {
      best = c;
    } else if (getEdge === 'leftmost' && c.x < best.x) {
      best = c;
    } else if (getEdge === 'rightmost' && c.x > best.x) {
      best = c;
    }
  }
  return best ? best.el : null;
}
const onKeyDownCapture = (evt: KeyboardEvent): void => {
  if (evt.key === '/') {
    endSession();
    isSessionActive = true;
    beginPollingForMenu();
    return;
  }
  if (!isSessionActive) return;
  if (evt.key === 'Escape') {
    endSession();
    return;
  }
  const directionKeys: Direction[] = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  if (!directionKeys.includes(evt.key as Direction)) {
    return;
  }
  const menu = activeMenuElement || findHintMenu();
  if (!menu || !isMenuVisible(menu)) {
    endSession();
    return;
  }
  evt.preventDefault();
  evt.stopPropagation();
  activeMenuElement = menu;
  attachMenuObserver();
  const items = getListItems(menu);
  if (items.length === 0) return;
  let focused = getFocusedItem(menu);
  if (!focused) {
    focused = items[0];
    focused.classList.add('b3-list-item--focus');
  }
  cachedCenters = computeCenters(items);
  const fromCenter = cachedCenters.find((c) => c.el === focused) ?? {
    el: focused,
    x: focused.getBoundingClientRect().left + focused.getBoundingClientRect().width / 2,
    y: focused.getBoundingClientRect().top + focused.getBoundingClientRect().height / 2,
  };
  const key = evt.key as Direction;
  const target = selectClosestInDirection(cachedCenters, fromCenter, key);
  if (target) {
    moveFocus(target);
    return;
  }
  let fallbackTarget: HTMLElement | null = null;
  if (key === 'ArrowDown') {
    fallbackTarget = findNextByDomOrder(items, focused);
  } else if (key === 'ArrowUp') {
    fallbackTarget = findPrevByDomOrder(items, focused);
  } else if (key === 'ArrowRight') {
    fallbackTarget = findEdgeInRow(cachedCenters, fromCenter, 'leftmost');
  } else if (key === 'ArrowLeft') {
    fallbackTarget = findEdgeInRow(cachedCenters, fromCenter, 'rightmost');
  }
  if (fallbackTarget && fallbackTarget !== focused) {
    moveFocus(fallbackTarget);
  }
};
export function initMulticolumnSlashMenu(): void {
  if (isMobile()) return;
  loadConfig().then((config) => {
    if (config['multicolumn-slash-menu'] === true) {
      document.documentElement.classList.add('neo-layout-multicolumnslashmenu');
      if (!keydownHandler) {
        keydownHandler = onKeyDownCapture;
        document.addEventListener('keydown', keydownHandler, { capture: true });
      }
    }
  });
}
export function onMulticolumnSlashMenuClick(): void {
  if (isMobile()) return;
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-layout-multicolumnslashmenu');
  if (isActive) {
    destroyMulticolumnSlashMenu();
    saveConfig({ 'multicolumn-slash-menu': false } as Partial<Config>);
  } else {
    htmlEl.classList.add('neo-layout-multicolumnslashmenu');
    if (!keydownHandler) {
      keydownHandler = onKeyDownCapture;
      document.addEventListener('keydown', keydownHandler, { capture: true });
    }
    saveConfig({ 'multicolumn-slash-menu': true } as Partial<Config>);
  }
}
export function destroyMulticolumnSlashMenu(): void {
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler, { capture: true });
    keydownHandler = null;
  }
  endSession();
  document.documentElement?.classList.remove('neo-layout-multicolumnslashmenu');
}
