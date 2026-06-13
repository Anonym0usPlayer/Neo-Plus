import { isMobile } from '../modules/env';
import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
import { getPlugin } from '../main/guard';
import { Dialog } from 'siyuan';
const scrollDuration = 600;
const scrollThrottle = 100;
const centerThreshold = 40;
let typewriterEnabled = true;
let highlightEnabled = true;
let selectionChangeHandler: (() => void) | null = null;
let scrollTimeout: number | null = null;
let rafId: number | null = null;
let loopRafId: number | null = null;
let lastMaskPosition: string | null = null;
let lastMaskHeight: string | null = null;
let isScrolling = false;
let pendingUpdate = false;
function getScrollContainer(): HTMLElement | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const startContainer = sel.getRangeAt(0).startContainer;
  let element: HTMLElement | null = startContainer instanceof HTMLElement ? startContainer : startContainer.parentElement;
  while (element && element !== document.body) {
    if (element.classList.contains('protyle-content')) {
      return element;
    }
    element = element.parentElement;
  }
  return null;
}
function getCursorRect(): DOMRect | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  const rects = range.getClientRects();
  if (rects.length > 0 && rects[0].height > 0) {
    return rects[0];
  }
  try {
    const cloneRange = range.cloneRange();
    const textNode = document.createTextNode('\u200B');
    cloneRange.insertNode(textNode);
    cloneRange.selectNode(textNode);
    const rect = cloneRange.getBoundingClientRect();
    if (textNode.parentNode) {
      textNode.parentNode.removeChild(textNode);
    }
    if (rect && rect.height > 0) {
      return rect;
    }
    if (rect) {
      return new DOMRect(rect.left, rect.top, 0, rect.height);
    }
  } catch {
  }
  return null;
}
function updateMaskPosition(cursorRect: DOMRect, containerRect: DOMRect, scrollContainer: HTMLElement): void {
  const cursorCenterY = cursorRect.top + cursorRect.height / 2;
  const cursorRelativeY = cursorCenterY - containerRect.top;
  const positionPercent = (cursorRelativeY / containerRect.height) * 100;
  const newMaskPosition = `${positionPercent}%`;
  const newMaskHeight = `${cursorRect.height * 0.75}px`;
  let textColor: string | null = null;
  const sel = window.getSelection();
  const focusNode = sel?.focusNode;
  if (focusNode) {
    if (focusNode.nodeType === Node.TEXT_NODE) {
      const parentElement = focusNode.parentElement;
      if (parentElement) {
        textColor = window.getComputedStyle(parentElement).color;
      }
    } else if (focusNode.nodeType === Node.ELEMENT_NODE) {
      textColor = window.getComputedStyle(focusNode as Element).color;
    }
  }
  if (!textColor) {
    textColor = window.getComputedStyle(scrollContainer).color;
  }
  if (textColor && textColor !== 'transparent') {
    const rgbaMatch = textColor.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);
    if (rgbaMatch && parseFloat(rgbaMatch[4]) === 0) {
      scrollContainer.style.removeProperty('--neo-immersive-text-color');
    } else {
      scrollContainer.style.setProperty('--neo-immersive-text-color', textColor);
    }
  } else {
    scrollContainer.style.removeProperty('--neo-immersive-text-color');
  }
  if (lastMaskPosition !== newMaskPosition || lastMaskHeight !== newMaskHeight) {
    lastMaskPosition = newMaskPosition;
    lastMaskHeight = newMaskHeight;
    scrollContainer.style.setProperty('--neo-immersive-mask-position', newMaskPosition);
    scrollContainer.style.setProperty('--neo-immersive-mask-height', newMaskHeight);
  }
}
function scrollToLineCenter(cursorRect: DOMRect, container: HTMLElement, containerRect: DOMRect): void {
  const targetOffset = containerRect.height / 2;
  const targetScrollTop = container.scrollTop + cursorRect.top - containerRect.top - targetOffset + cursorRect.height / 2;
  const startScrollTop = container.scrollTop;
  const distance = targetScrollTop - startScrollTop;
  if (distance === 0) return;
  isScrolling = true;
  const startTime = performance.now();
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
  }
  function animateScroll(currentTime: number): void {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / scrollDuration, 1);
    const easeProgress = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    container.scrollTop = startScrollTop + distance * easeProgress;
    if (progress < 1) {
      rafId = requestAnimationFrame(animateScroll);
    } else {
      rafId = null;
      if (highlightEnabled) {
        const currentRect = getCursorRect();
        if (currentRect) {
          updateMaskPosition(currentRect, container.getBoundingClientRect(), container);
        }
      }
      if (scrollTimeout !== null) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = window.setTimeout(() => {
        isScrolling = false;
        scrollTimeout = null;
      }, scrollThrottle);
    }
  }
  rafId = requestAnimationFrame(animateScroll);
}
function handleSelectionChange(): void {
  pendingUpdate = true;
}
function applyPendingUpdate(): void {
  if (!pendingUpdate) return;
  pendingUpdate = false;
  if (!typewriterEnabled && !highlightEnabled) return;
  const cursorRect = getCursorRect();
  if (!cursorRect) return;
  const container = getScrollContainer();
  if (!container) return;
  const containerRect = container.getBoundingClientRect();
  const cursorCenterY = cursorRect.top + cursorRect.height / 2;
  const containerCenterY = containerRect.top + containerRect.height / 2;
  const distFromCenter = Math.abs(cursorCenterY - containerCenterY);
  if (!isScrolling && typewriterEnabled && distFromCenter > centerThreshold && rafId === null) {
    scrollToLineCenter(cursorRect, container, containerRect);
  } else if (highlightEnabled) {
    updateMaskPosition(cursorRect, containerRect, container);
  }
}
function startObserving(): void {
  selectionChangeHandler = handleSelectionChange;
  document.addEventListener('selectionchange', selectionChangeHandler);
  function rafLoop(): void {
    applyPendingUpdate();
    loopRafId = requestAnimationFrame(rafLoop);
  }
  loopRafId = requestAnimationFrame(rafLoop);
}
function stopObserving(): void {
  if (loopRafId !== null) {
    cancelAnimationFrame(loopRafId);
    loopRafId = null;
  }
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (scrollTimeout !== null) {
    clearTimeout(scrollTimeout);
    scrollTimeout = null;
  }
  if (selectionChangeHandler) {
    document.removeEventListener('selectionchange', selectionChangeHandler);
    selectionChangeHandler = null;
  }
  isScrolling = false;
  pendingUpdate = false;
  lastMaskPosition = null;
  lastMaskHeight = null;
  clearHighlightCss();
}
export function createImmersiveModeLabelHTML(i18n: Record<string, string>): string {
  return `<span class="fn__flex fn__pointer">
    <span>${i18n.immersiveMode}</span>
    <svg class="b3-menu__icon neo-menu-item-second-icon ariaLabel" aria-label="${i18n.immersiveModeSettings}" onclick="event.stopPropagation();__neoOpenImmersiveModeSettings()"><use xlink:href="#iconSettings"></use></svg>
  </span>`;
}
function buildSettingsHTML(i18n: Record<string, string>): string {
  const optionOnOff = [i18n.on, i18n.off]
    .map(v => `<option value="${v}">${v}</option>`)
    .join('');
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <label class="fn__flex b3-label">
          <div class="fn__flex-1">
            ${i18n.immersiveTypewriterMode}
            <div class="b3-label__text">${i18n.immersiveTypewriterModeTip}</div>
          </div>
          <span class="fn__space"></span>
          <select class="b3-select fn__flex-center fn__size200" id="neo-immersive-typewriter">
            ${optionOnOff}
          </select>
        </label>
        <label class="fn__flex b3-label">
          <div class="fn__flex-1">
            ${i18n.immersiveHighlight}
            <div class="b3-label__text">${i18n.immersiveHighlightTip}</div>
          </div>
          <span class="fn__space"></span>
          <select class="b3-select fn__flex-center fn__size200" id="neo-immersive-highlight">
            ${optionOnOff}
          </select>
        </label>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-immersive-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-immersive-confirm">${i18n.confirm}</button>
  </div>`;
}
function clearHighlightCss(): void {
  document.querySelectorAll<HTMLElement>('.protyle-content').forEach((el) => {
    el.style.removeProperty('--neo-immersive-mask-position');
    el.style.removeProperty('--neo-immersive-mask-height');
    el.style.removeProperty('--neo-immersive-text-color');
  });
}
export function showImmersiveModeSettings(): void {
  const plugin = getPlugin();
  if (!plugin) return;
  const dialog = new Dialog({
    title: plugin.i18n.immersiveModeSettings || 'Immersive Mode Settings',
    content: buildSettingsHTML(plugin.i18n),
    width: '90vw',
  });
  const container = dialog.element.querySelector('.b3-dialog__container') as HTMLElement;
  if (container) container.style.maxWidth = '600px';
  dialog.element.setAttribute('data-key', 'dialog-neo-immersive-settings');
  const typewriterSelect = dialog.element.querySelector('#neo-immersive-typewriter') as HTMLSelectElement;
  const highlightSelect = dialog.element.querySelector('#neo-immersive-highlight') as HTMLSelectElement;
  if (typewriterSelect) typewriterSelect.value = typewriterEnabled ? plugin.i18n.on : plugin.i18n.off;
  if (highlightSelect) highlightSelect.value = highlightEnabled ? plugin.i18n.on : plugin.i18n.off;
  dialog.element.querySelector('#neo-immersive-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-immersive-confirm')?.addEventListener('click', () => {
    const newTypewriter = typewriterSelect ? typewriterSelect.value === plugin.i18n.on : true;
    const newHighlight = highlightSelect ? highlightSelect.value === plugin.i18n.on : true;
    typewriterEnabled = newTypewriter;
    highlightEnabled = newHighlight;
    saveConfig({ 'immersive-typewriter': newTypewriter, 'immersive-highlight': newHighlight } as Partial<Config>);
    if (!newHighlight) {
      clearHighlightCss();
    }
    document.body.classList.toggle('neo-extension-immersivemode-highlight', newHighlight);
    dialog.destroy();
  });
}
export function initImmersiveMode(): void {
  if (isMobile()) return;
  (window as any).__neoOpenImmersiveModeSettings = showImmersiveModeSettings;
  loadConfig().then((config) => {
    if (config['immersive-typewriter'] !== undefined) typewriterEnabled = config['immersive-typewriter'];
    if (config['immersive-highlight'] !== undefined) {
      highlightEnabled = config['immersive-highlight'];
      document.body.classList.toggle('neo-extension-immersivemode-highlight', highlightEnabled);
    }
    if (config['immersive-mode'] === true) {
      document.documentElement.classList.add('neo-extension-immersivemode');
      startObserving();
    }
  });
}
export function onImmersiveModeClick(): void {
  if (isMobile()) return;
  const htmlEl = document.documentElement;
  if (!htmlEl) return;
  const isActive = htmlEl.classList.contains('neo-extension-immersivemode');
  if (isActive) {
    htmlEl.classList.remove('neo-extension-immersivemode');
    saveConfig({ 'immersive-mode': false } as Partial<Config>);
    stopObserving();
  } else {
    htmlEl.classList.add('neo-extension-immersivemode');
    saveConfig({ 'immersive-mode': true } as Partial<Config>);
    startObserving();
  }
}
export function destroyImmersiveMode(): void {
  delete (window as any).__neoOpenImmersiveModeSettings;
  document.documentElement?.classList.remove('neo-extension-immersivemode');
  stopObserving();
}