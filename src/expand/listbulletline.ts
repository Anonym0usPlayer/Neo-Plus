import { Plugin } from 'siyuan';
import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
let selectionChangeHandler: (() => void) | null = null;
let clickHandler: ((event: MouseEvent) => void) | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastMarkedItems: Set<HTMLElement> = new Set();
function clearBulletLineMarks(): void {
  document.querySelectorAll<HTMLElement>('[neo-listbulletline-node],[neo-listbulletline-current]').forEach((element) => {
    element.removeAttribute('neo-listbulletline-node');
    element.removeAttribute('neo-listbulletline-current');
    element.style.removeProperty('--neo-listbulletline-height');
  });
  lastMarkedItems.clear();
}
function removeMarkFromItem(item: HTMLElement): void {
  item.removeAttribute('neo-listbulletline-node');
  item.removeAttribute('neo-listbulletline-current');
  item.style.removeProperty('--neo-listbulletline-height');
}
function addMarkToItem(item: HTMLElement, hasNext: boolean, nextItem?: HTMLElement): void {
  item.setAttribute('neo-listbulletline-node', '');
  if (hasNext && nextItem) {
    const currentRect = item.getBoundingClientRect();
    const nextRect = nextItem.getBoundingClientRect();
    item.style.setProperty('--neo-listbulletline-height', `${currentRect.top - nextRect.top}px`);
    item.setAttribute('neo-listbulletline-current', '');
  }
}
function runSelectionUpdate(clickTarget?: HTMLElement | null): void {
  const selection = window.getSelection();
  const currentListItems: HTMLElement[] = [];
  if (clickTarget) {
    let node: Node | null = clickTarget;
    while (node) {
      const element = node as HTMLElement;
      if (element.dataset?.type === 'NodeListItem') {
        currentListItems.push(element);
      }
      if (element.classList?.contains('protyle-wysiwyg')) {
        break;
      }
      node = element.parentElement;
    }
  } else if (selection && selection.rangeCount) {
    let node: Node | null = selection.getRangeAt(0).startContainer;
    while (node && node.nodeType !== Node.ELEMENT_NODE) {
      node = node.parentElement;
    }
    while (node) {
      const element = node as HTMLElement;
      if (element.dataset?.type === 'NodeListItem') {
        currentListItems.push(element);
      }
      if (element.classList?.contains('protyle-wysiwyg')) {
        break;
      }
      node = element.parentElement;
    }
  }
  const currentSet = new Set(currentListItems);
  lastMarkedItems.forEach((item) => {
    if (!currentSet.has(item)) {
      removeMarkFromItem(item);
    }
  });
  currentListItems.forEach((item, index) => {
    const hasNext = index < currentListItems.length - 1;
    const nextItem = hasNext ? currentListItems[index + 1] : undefined;
    if (!lastMarkedItems.has(item)) {
      addMarkToItem(item, hasNext, nextItem);
    } else {
      if (hasNext && nextItem) {
        const currentRect = item.getBoundingClientRect();
        const nextRect = nextItem.getBoundingClientRect();
        const newHeight = `${currentRect.top - nextRect.top}px`;
        const oldHeight = item.style.getPropertyValue('--neo-listbulletline-height');
        if (oldHeight !== newHeight) {
          item.style.setProperty('--neo-listbulletline-height', newHeight);
        }
        if (!item.hasAttribute('neo-listbulletline-current')) {
          item.setAttribute('neo-listbulletline-current', '');
        }
      } else {
        if (item.hasAttribute('neo-listbulletline-current')) {
          item.removeAttribute('neo-listbulletline-current');
          item.style.removeProperty('--neo-listbulletline-height');
        }
      }
    }
  });
  lastMarkedItems = currentSet;
}
function bindSelectionChange(): void {
  if (selectionChangeHandler) {
    return;
  }
  selectionChangeHandler = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      runSelectionUpdate();
      debounceTimer = null;
    }, 50);
  };
  clickHandler = (event: MouseEvent) => {
    const target = event.composedPath()[0] as HTMLElement;
    if (target.closest?.('.protyle-action')) {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        runSelectionUpdate(target);
        debounceTimer = null;
      }, 50);
    }
  };
  document.addEventListener('selectionchange', selectionChangeHandler);
  document.addEventListener('click', clickHandler, { capture: true });
  runSelectionUpdate();
}
function unbindSelectionChange(): void {
  if (!selectionChangeHandler) {
    clearBulletLineMarks();
    return;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  document.removeEventListener('selectionchange', selectionChangeHandler);
  if (clickHandler) {
    document.removeEventListener('click', clickHandler, { capture: true });
    clickHandler = null;
  }
  selectionChangeHandler = null;
  clearBulletLineMarks();
}
export function initListBulletLine(plugin: Plugin | undefined): void {
  loadConfig(plugin).then((config) => {
    if (config['list-bullet-line'] === true) {
      document.documentElement.classList.add('neo-expand-listbulletline');
      bindSelectionChange();
    }
  });
}
export function onListBulletLineClick(plugin: Plugin | undefined): void {
  const htmlEl = document.documentElement;
  if (!htmlEl) return;
  const isActive = htmlEl.classList.contains('neo-expand-listbulletline');
  if (isActive) {
    htmlEl.classList.remove('neo-expand-listbulletline');
    saveConfig(plugin, { 'list-bullet-line': false } as Partial<Config>);
    unbindSelectionChange();
  } else {
    htmlEl.classList.add('neo-expand-listbulletline');
    saveConfig(plugin, { 'list-bullet-line': true } as Partial<Config>);
    bindSelectionChange();
  }
}
export function destroyListBulletLine(): void {
  document.documentElement?.classList.remove('neo-expand-listbulletline');
  unbindSelectionChange();
}
