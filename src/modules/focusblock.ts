const excludedBlockTypes = ['NodeAttributeView', 'NodeCodeBlock', 'NodeList', 'NodeCallout', 'NodeTable'];
const debounceDelay = 200;
let pendingUpdate = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
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
  document.addEventListener('mouseup', handleUpdate);
  document.addEventListener('keyup', handleUpdate);
  document.addEventListener('selectionchange', onSelectionChange);
}
function stopObserving(): void {
  document.removeEventListener('mouseup', handleUpdate);
  document.removeEventListener('keyup', handleUpdate);
  document.removeEventListener('selectionchange', onSelectionChange);
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  clearAllFocusBlocks();
}
export function initFocusBlock(): void {
  startObserving();
}
export function destroyFocusBlock(): void {
  stopObserving();
}
