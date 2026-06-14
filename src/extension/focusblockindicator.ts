import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
import { getPlugin } from '../main/guard';
import { Dialog } from 'siyuan';
const excludedBlockTypes = ['NodeAttributeView', 'NodeCodeBlock', 'NodeList', 'NodeCallout', 'NodeTable'];
const debounceDelay = 200;
let focusBlockEffect: 'vertical-line' | 'shadow' | 'background' = 'vertical-line';
let pendingUpdate = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let mouseUpHandler: (() => void) | null = null;
let keyUpHandler: (() => void) | null = null;
let selectionChangeHandler: (() => void) | null = null;
function applyFocusBlockEffect(): void {
  document.body.classList.toggle('neo-extension-focusblockindicator-shadow', focusBlockEffect === 'shadow');
  document.body.classList.toggle('neo-extension-focusblockindicator-vertical-line', focusBlockEffect === 'vertical-line');
  document.body.classList.toggle('neo-extension-focusblockindicator-background', focusBlockEffect === 'background');
}
function clearAllFocusBlocks(): void {
  document.querySelectorAll('[neo-focus-block]').forEach((el) => {
    el.removeAttribute('neo-focus-block');
  });
}
function applyFocusBlock(): void {
  pendingUpdate = false;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
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
  document.addEventListener('mousedown', mouseUpHandler);
  document.addEventListener('keyup', keyUpHandler);
  document.addEventListener('selectionchange', selectionChangeHandler);
}
function stopObserving(): void {
  if (mouseUpHandler) {
    document.removeEventListener('mousedown', mouseUpHandler);
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
  (window as any).__neoOpenFocusBlockIndicatorSettings = showFocusBlockIndicatorSettings;
  loadConfig().then((config) => {
    focusBlockEffect = config['focus-block-effect'] || 'vertical-line';
    if (config['focus-block-indicator'] === true) {
      document.documentElement.classList.add('neo-extension-focusblockindicator');
      applyFocusBlockEffect();
      startObserving();
    }
  });
}
export function onFocusBlockIndicatorClick(): void {
  const htmlEl = document.documentElement;
  if (!htmlEl) return;
  const isActive = htmlEl.classList.contains('neo-extension-focusblockindicator');
  if (isActive) {
    saveConfig({ 'focus-block-indicator': false } as Partial<Config>);
    destroyFocusBlockIndicator();
  } else {
    htmlEl.classList.add('neo-extension-focusblockindicator');
    applyFocusBlockEffect();
    saveConfig({ 'focus-block-indicator': true } as Partial<Config>);
    startObserving();
  }
}
function toPascalCase(str: string): string {
  return str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}
function buildSettingsHTML(i18n: Record<string, string>): string {
  const effectOptions = ['vertical-line', 'shadow', 'background']
    .map(v => `<option value="${v}">${i18n[`focusBlockEffect${toPascalCase(v)}`]}</option>`)
    .join('');
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <label class="fn__flex b3-label">
          <div class="fn__flex-1">
            ${i18n.focusBlockEffect}
            <div class="b3-label__text">${i18n.focusBlockEffectTip}</div>
          </div>
          <span class="fn__space"></span>
          <select class="b3-select fn__flex-center fn__size200" id="neo-focus-block-effect">
            ${effectOptions}
          </select>
        </label>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-focus-block-indicator-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-focus-block-indicator-confirm">${i18n.confirm}</button>
  </div>`;
}
export function showFocusBlockIndicatorSettings(): void {
  const plugin = getPlugin();
  if (!plugin) return;
  const dialog = new Dialog({
    title: plugin.i18n.focusBlockIndicatorSettings || 'Focus Block Indicator Settings',
    content: buildSettingsHTML(plugin.i18n),
    width: '90vw',
  });
  const container = dialog.element.querySelector('.b3-dialog__container') as HTMLElement;
  if (container) container.style.maxWidth = '600px';
  dialog.element.setAttribute('data-key', 'dialog-neo-focus-block-indicator-settings');
  const effectSelect = dialog.element.querySelector('#neo-focus-block-effect') as HTMLSelectElement;
  if (effectSelect) effectSelect.value = focusBlockEffect;
  dialog.element.querySelector('#neo-focus-block-indicator-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-focus-block-indicator-confirm')?.addEventListener('click', () => {
    if (effectSelect) {
      const newEffect = effectSelect.value as 'vertical-line' | 'shadow' | 'background';
      if (newEffect !== focusBlockEffect) {
        focusBlockEffect = newEffect;
        applyFocusBlockEffect();
        saveConfig({ 'focus-block-effect': newEffect } as Partial<Config>);
      }
    }
    dialog.destroy();
  });
}
export function createFocusBlockIndicatorLabelHTML(i18n: Record<string, string>): string {
  return `<span class="fn__flex fn__pointer">
    <span>${i18n.focusBlockIndicator}</span>
    <svg class="b3-menu__icon neo-menu-item-second-icon ariaLabel" aria-label="${i18n.focusBlockIndicatorSettings}" onclick="event.stopPropagation();__neoOpenFocusBlockIndicatorSettings()"><use xlink:href="#iconSettings"></use></svg>
  </span>`;
}
export function destroyFocusBlockIndicator(): void {
  document.documentElement?.classList.remove('neo-extension-focusblockindicator');
  document.body.classList.remove('neo-extension-focusblockindicator-shadow');
  document.body.classList.remove('neo-extension-focusblockindicator-vertical-line');
  document.body.classList.remove('neo-extension-focusblockindicator-background');
  stopObserving();
}