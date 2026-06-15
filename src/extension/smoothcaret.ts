import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
import { getPlugin } from '../main/guard';
import { getCursorRect, getTextColor, getScrollContainer } from '../modules/getselection';
import { Dialog } from 'siyuan';
let smoothCaretEventHandler: (() => void) | null = null;
let throttledCaretEventHandler: (() => void) | null = null;
let throttleTimers: number[] = [];
let cachedZIndex = 0;
let lastTargetElement: Element | null = null;
let cachedScrollContainer: HTMLElement | null = null;
let cachedFocusElement: Element | null = null;
let smoothCaretStatus: 'static' | 'breathing' | 'neon' | 'rainbow' = 'static';
function applySmoothCaretStatus(): void {
  document.body.classList.toggle('neo-extension-smooth-caret-breathing', smoothCaretStatus === 'breathing');
  document.body.classList.toggle('neo-extension-smooth-caret-static', smoothCaretStatus === 'static');
  document.body.classList.toggle('neo-extension-smooth-caret-neon', smoothCaretStatus === 'neon');
  document.body.classList.toggle('neo-extension-smooth-caret-rainbow', smoothCaretStatus === 'rainbow');
}
function startSmoothCaret(): void {
  document.getElementById('neo-smooth-caret-item')?.remove();
  const caretElement = document.createElement('div');
  caretElement.id = 'neo-smooth-caret-item';
  document.body.appendChild(caretElement);
  let isAnimationFramePending = false;
  function calculateCaretZIndex(targetElement: Element): number {
    if (targetElement === lastTargetElement) {
      return cachedZIndex;
    }
    let currentElement: Element | null = targetElement;
    let fullscreenZIndex: number | null = null;
    while (currentElement && currentElement !== document.body) {
      if (
        currentElement.classList.contains('b3-dialog') ||
        currentElement.classList.contains('block__popover--open') ||
        currentElement.id === 'commonMenu'
      ) {
        const computedStyle = window.getComputedStyle(currentElement);
        const zIndex = parseInt(computedStyle.zIndex) || 0;
        cachedZIndex = zIndex;
        lastTargetElement = targetElement;
        return zIndex;
      }
      if (currentElement.classList.contains('fullscreen') && fullscreenZIndex === null) {
        const computedStyle = window.getComputedStyle(currentElement);
        fullscreenZIndex = parseInt(computedStyle.zIndex) || 0;
      }
      currentElement = currentElement.parentElement;
    }
    cachedZIndex = fullscreenZIndex !== null ? fullscreenZIndex : 0;
    lastTargetElement = targetElement;
    return cachedZIndex;
  }
  function updateCaretPosition(): void {
    isAnimationFramePending = false;
    const sel = window.getSelection();
    const focusElement = sel?.focusNode?.parentElement;
    if (focusElement?.classList?.contains('av__cursor')) {
      caretElement.classList.add('neo-smooth-caret-hidden');
      return;
    }
    const isSelfContentEditableFalse = focusElement?.getAttribute?.('contenteditable') === 'false';
    if (isSelfContentEditableFalse) {
      caretElement.classList.add('neo-smooth-caret-hidden');
      return;
    }
    const targetElement =
      focusElement?.closest('[contenteditable="true"]') ||
      (focusElement?.closest('.protyle-title') ? focusElement : null);
    if (sel?.rangeCount && targetElement) {
      const rect = getCursorRect();
      if (rect) {
        if (focusElement !== cachedFocusElement) {
          cachedFocusElement = focusElement ?? null;
          cachedScrollContainer = getScrollContainer();
        }
        if (cachedScrollContainer) {
          const containerRect = cachedScrollContainer.getBoundingClientRect();
          const isInScrollContainer =
            rect.left >= containerRect.left &&
            rect.top >= containerRect.top &&
            rect.right <= containerRect.right &&
            rect.bottom <= containerRect.bottom;
          if (!isInScrollContainer) {
            caretElement.classList.add('neo-smooth-caret-hidden');
            return;
          }
        }
        caretElement.classList.remove('neo-smooth-caret-hidden');
        caretElement.style.transform = `translate3d(${rect.left - 0.75}px, ${rect.top - rect.height * 0.025}px, 0)`;
        caretElement.style.height = `${rect.height * 1.05}px`;
        const baseZIndex = calculateCaretZIndex(targetElement);
        caretElement.style.zIndex = (baseZIndex + 1).toString();
        const textColor = getTextColor(sel.focusNode, targetElement);
        if (textColor) {
          caretElement.style.setProperty('--neo-smooth-caret-color', textColor);
        } else {
          caretElement.style.removeProperty('--neo-smooth-caret-color');
        }
        return;
      }
    }
    caretElement.classList.add('neo-smooth-caret-hidden');
  }
  function handleCaretUpdateTrigger(): void {
    if (!isAnimationFramePending) {
      window.requestAnimationFrame(updateCaretPosition);
      isAnimationFramePending = true;
    }
  }
  function handleThrottledCaretUpdate(): void {
    throttleTimers.forEach((timer) => clearTimeout(timer));
    throttleTimers = [];
    const delays = [200, 400, 600];
    delays.forEach((delay) => {
      const timer = window.setTimeout(() => {
        handleCaretUpdateTrigger();
        const index = throttleTimers.indexOf(timer);
        if (index > -1) {
          throttleTimers.splice(index, 1);
        }
      }, delay);
      throttleTimers.push(timer);
    });
  }
  throttledCaretEventHandler = handleThrottledCaretUpdate;
  smoothCaretEventHandler = handleCaretUpdateTrigger;
  document.addEventListener('selectionchange', handleCaretUpdateTrigger);
  document.addEventListener('scroll', handleCaretUpdateTrigger, { capture: true, passive: true });
  document.addEventListener('keyup', handleThrottledCaretUpdate);
  document.addEventListener('mouseup', handleThrottledCaretUpdate);
  updateCaretPosition();
}
export function createSmoothCaretLabelHTML(i18n: Record<string, string>): string {
  return `<span class="fn__flex fn__pointer">
    <span>${i18n.smoothCaret}</span>
    <span class="fn__space fn__flex-1 neo-menu-item-second-icon-space"></span>
    <svg class="b3-menu__icon neo-menu-item-second-icon ariaLabel" aria-label="${i18n.smoothCaretSettings}" onclick="event.stopPropagation();__neoOpenSmoothCaretSettings()"><use xlink:href="#iconSettings"></use></svg>
  </span>`;
}
function buildSettingsHTML(i18n: Record<string, string>): string {
  const statusOptions = ['static', 'breathing', 'neon', 'rainbow']
    .map(v => `<option value="${v}">${i18n[`smoothCaretStatus${v.charAt(0).toUpperCase() + v.slice(1)}`]}</option>`)
    .join('');
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <label class="fn__flex b3-label">
          <div class="fn__flex-1">
            ${i18n.smoothCaretStatus}
            <div class="b3-label__text">${i18n.smoothCaretStatusTip}</div>
          </div>
          <span class="fn__space"></span>
          <select class="b3-select fn__flex-center fn__size200" id="neo-smooth-caret-status">
            ${statusOptions}
          </select>
        </label>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-smooth-caret-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-smooth-caret-confirm">${i18n.confirm}</button>
  </div>`;
}
export function showSmoothCaretSettings(): void {
  const plugin = getPlugin();
  if (!plugin) return;
  const dialog = new Dialog({
    title: plugin.i18n.smoothCaretSettings || 'Smooth Caret Settings',
    content: buildSettingsHTML(plugin.i18n),
    width: '90vw',
  });
  const container = dialog.element.querySelector('.b3-dialog__container') as HTMLElement;
  if (container) container.style.maxWidth = '800px';
  dialog.element.setAttribute('data-key', 'dialog-neo-smooth-caret-settings');
  const statusSelect = dialog.element.querySelector('#neo-smooth-caret-status') as HTMLSelectElement;
  if (statusSelect) statusSelect.value = smoothCaretStatus;
  dialog.element.querySelector('#neo-smooth-caret-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-smooth-caret-confirm')?.addEventListener('click', () => {
    if (statusSelect) {
      const newStatus = statusSelect.value as 'static' | 'breathing' | 'neon' | 'rainbow';
      if (newStatus !== smoothCaretStatus) {
        smoothCaretStatus = newStatus;
        applySmoothCaretStatus();
        saveConfig({ 'smooth-caret-status': newStatus } as Partial<Config>);
      }
    }
    dialog.destroy();
  });
}
export function destroySmoothCaret(): void {
  document.getElementById('neo-smooth-caret-item')?.remove();
  document.documentElement.classList.remove('neo-extension-smooth-caret');
  document.body.classList.remove('neo-extension-smooth-caret-breathing');
  document.body.classList.remove('neo-extension-smooth-caret-static');
  document.body.classList.remove('neo-extension-smooth-caret-neon');
  document.body.classList.remove('neo-extension-smooth-caret-rainbow');
  throttleTimers.forEach((timer) => clearTimeout(timer));
  throttleTimers = [];
  cachedZIndex = 0;
  lastTargetElement = null;
  cachedScrollContainer = null;
  cachedFocusElement = null;
  if (smoothCaretEventHandler) {
    document.removeEventListener('selectionchange', smoothCaretEventHandler);
    document.removeEventListener('scroll', smoothCaretEventHandler, { capture: true, passive: true } as EventListenerOptions);
    smoothCaretEventHandler = null;
  }
  if (throttledCaretEventHandler) {
    document.removeEventListener('keyup', throttledCaretEventHandler);
    document.removeEventListener('mouseup', throttledCaretEventHandler);
    throttledCaretEventHandler = null;
  }
}
export function initSmoothCaret(): void {
  (window as any).__neoOpenSmoothCaretSettings = showSmoothCaretSettings;
  loadConfig().then((config) => {
    smoothCaretStatus = config['smooth-caret-status'] || 'static';
    if (config['smooth-caret'] === true) {
      document.documentElement.classList.add('neo-extension-smooth-caret');
      applySmoothCaretStatus();
      startSmoothCaret();
    }
  });
}
export function onSmoothCaretClick(): void {
  const htmlEl = document.documentElement;
  if (!htmlEl) return;
  const isActive = htmlEl.classList.contains('neo-extension-smooth-caret');
  if (isActive) {
    saveConfig({ 'smooth-caret': false } as Partial<Config>);
    destroySmoothCaret();
  } else {
    htmlEl.classList.add('neo-extension-smooth-caret');
    applySmoothCaretStatus();
    saveConfig({ 'smooth-caret': true } as Partial<Config>);
    startSmoothCaret();
  }
}