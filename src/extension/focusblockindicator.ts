import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
const excludedBlockTypes = ['NodeAttributeView', 'NodeCodeBlock', 'NodeList', 'NodeCallout', 'NodeTable'];
const debounceDelay = 200;
let pendingUpdate = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let mouseUpHandler: (() => void) | null = null;
let keyUpHandler: (() => void) | null = null;
let selectionChangeHandler: (() => void) | null = null;
function clearAllFocusBlocks(): void {
  document.querySelectorAll('[neo-focus-block]').forEach((el) => {
    el.removeAttribute('neo-focus-block');
  });
}
function applyFocusBlock(): void {
  pendingUpdate = false;
  const selection = window.getSelection();
  const range = selection?.getRangeAt(0);
  if (!range) return;
  const curNode = range.commonAncestorContainer;
  const curBlock = (curNode.nodeType === Node.ELEMENT_NODE ? curNode as Element : curNode.parentElement)?.closest('[data-node-id]');
  if (!curBlock) return;
  const curBlockType = curBlock.getAttribute('data-type');
  clearAllFocusBlocks();
  if (!curBlockType || excludedBlockTypes.includes(curBlockType)) return;
  curBlock.setAttribute('neo-focus-block', '');
}
function handleUpdate(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    if (pendingUpdate) applyFocusBlock();
  }, debounceDelay);
}
function onSelectionChange(): void {
  pendingUpdate = true;
}
function startObserving(): void {
  mouseUpHandler = () => {
    handleUpdate();
  };
  keyUpHandler = () => {
    handleUpdate();
  };
  selectionChangeHandler = () => {
    onSelectionChange();
  };
  document.addEventListener('mouseup', mouseUpHandler);
  document.addEventListener('keyup', keyUpHandler);
  document.addEventListener('selectionchange', selectionChangeHandler);
}
function stopObserving(): void {
  if (mouseUpHandler) {
    document.removeEventListener('mouseup', mouseUpHandler);
    mouseUpHandler = null;
  }
  if (keyUpHandler) {
    document.removeEventListener('keyup', keyUpHandler);
    keyUpHandler = null;
  }
  if (selectionChangeHandler) {
    document.removeEventListener('selectionchange', selectionChangeHandler);
    selectionChangeHandler = null;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  pendingUpdate = false;
  clearAllFocusBlocks();
}
export function initFocusBlockIndicator(): void {
  loadConfig().then((config) => {
    if (config['focus-block-indicator'] === true) {
      document.documentElement.classList.add('neo-extension-focusblockindicator');
      startObserving();
    }
  });
}
export function onFocusBlockIndicatorClick(): void {
  const htmlEl = document.documentElement;
  if (!htmlEl) return;
  const isActive = htmlEl.classList.contains('neo-extension-focusblockindicator');
  if (isActive) {
    htmlEl.classList.remove('neo-extension-focusblockindicator');
    saveConfig({ 'focus-block-indicator': false } as Partial<Config>);
    stopObserving();
  } else {
    htmlEl.classList.add('neo-extension-focusblockindicator');
    saveConfig({ 'focus-block-indicator': true } as Partial<Config>);
    startObserving();
  }
}
export function destroyFocusBlockIndicator(): void {
  document.documentElement?.classList.remove('neo-extension-focusblockindicator');
  stopObserving();
}
