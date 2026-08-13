import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
import { getPlugin } from '../main/guard';
import { getCursorRect, getTextColor, getScrollContainer } from '../modules/getselection';
import { ensureCss, removeCss } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
import { Dialog } from 'siyuan';
const scrollDuration = 600;
const scrollThrottle = 100;
let typewriterEnabled = true;
let highlightEnabled = true;
let selectionChangeHandler: (() => void) | null = null;
let scrollHandler: (() => void) | null = null;
let scrollTimeout: number | null = null;
let scrollEndTimer: number | null = null;
let scrollRafId: number | null = null;
let lastMaskPosition: string | null = null;
let lastMaskHeight: string | null = null;
let isScrolling = false;
let pendingUpdate = false;
let isAnimationFramePending = false;
function updateMaskPosition(cursorRect: DOMRect, containerRect: DOMRect, scrollContainer: HTMLElement): void {
  const cursorCenterY = cursorRect.top + cursorRect.height / 2;
  const cursorRelativeY = cursorCenterY - containerRect.top;
  const positionPercent = (cursorRelativeY / containerRect.height) * 100;
  const newMaskPosition = `${positionPercent}%`;
  const newMaskHeight = `${cursorRect.height * 0.75}px`;
  const textColor = getTextColor(window.getSelection()?.focusNode ?? null, scrollContainer);
  if (textColor) {
    scrollContainer.style.setProperty('--neo-immersive-text-color', textColor);
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
  if (scrollRafId !== null) {
    cancelAnimationFrame(scrollRafId);
  }
  function animateScroll(currentTime: number): void {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / scrollDuration, 1);
    const easeProgress = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    container.scrollTop = startScrollTop + distance * easeProgress;
    if (progress < 1) {
      scrollRafId = requestAnimationFrame(animateScroll);
    } else {
      scrollRafId = null;
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
  scrollRafId = requestAnimationFrame(animateScroll);
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
  if (!isScrolling && typewriterEnabled && scrollRafId === null) {
    scrollToLineCenter(cursorRect, container, containerRect);
  } else if (highlightEnabled) {
    updateMaskPosition(cursorRect, containerRect, container);
  }
}
function applyMaskUpdate(): void {
  if (!highlightEnabled) return;
  const cursorRect = getCursorRect();
  if (!cursorRect) return;
  const container = getScrollContainer();
  if (!container) return;
  updateMaskPosition(cursorRect, container.getBoundingClientRect(), container);
}
function scheduleUpdate(): void {
  if (!typewriterEnabled && !highlightEnabled) return;
  pendingUpdate = true;
  if (!isAnimationFramePending) {
    window.requestAnimationFrame(() => {
      isAnimationFramePending = false;
      applyPendingUpdate();
    });
    isAnimationFramePending = true;
  }
}
function scheduleMaskUpdate(): void {
  if (!highlightEnabled) return;
  if (scrollEndTimer !== null) {
    clearTimeout(scrollEndTimer);
  }
  scrollEndTimer = window.setTimeout(() => {
    scrollEndTimer = null;
    applyMaskUpdate();
  }, 50);
}
function startObserving(): void {
  selectionChangeHandler = scheduleUpdate;
  scrollHandler = scheduleMaskUpdate;
  document.addEventListener('selectionchange', selectionChangeHandler);
  document.addEventListener('scroll', scrollHandler, { capture: true, passive: true });
  scheduleUpdate();
}
function stopObserving(): void {
  if (scrollRafId !== null) {
    cancelAnimationFrame(scrollRafId);
    scrollRafId = null;
  }
  if (scrollEndTimer !== null) {
    clearTimeout(scrollEndTimer);
    scrollEndTimer = null;
  }
  if (scrollTimeout !== null) {
    clearTimeout(scrollTimeout);
    scrollTimeout = null;
  }
  if (selectionChangeHandler) {
    document.removeEventListener('selectionchange', selectionChangeHandler);
    selectionChangeHandler = null;
  }
  if (scrollHandler) {
    document.removeEventListener('scroll', scrollHandler, { capture: true, passive: true } as EventListenerOptions);
    scrollHandler = null;
  }
  isScrolling = false;
  pendingUpdate = false;
  isAnimationFramePending = false;
  lastMaskPosition = null;
  lastMaskHeight = null;
  clearHighlightCss();
}
export function createImmersiveModeLabelHTML(i18n: Record<string, string>): string {
  return `<span class="fn__flex fn__pointer">
    <span>${i18n.immersiveMode}</span>
    <span class="fn__space fn__flex-1 neo-menu-item-second-icon-space"></span>
    <svg class="b3-menu__icon neo-menu-item-second-icon ariaLabel" aria-label="${i18n.immersiveModeSettings}" onclick="event.stopPropagation();__neoOpenImmersiveModeSettings()"><use xlink:href="#iconSettings"></use></svg>
  </span>`;
}
function buildSettingsHTML(i18n: Record<string, string>): string {
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <div class="config-items">
          <label class="fn__flex b3-label">
            <div class="fn__flex-1">
              ${i18n.immersiveTypewriterMode}
              <div class="b3-label__text">${i18n.immersiveTypewriterModeTip}</div>
            </div>
            <span class="fn__space"></span>
            <input class="b3-switch fn__flex-center" id="neo-immersive-typewriter" type="checkbox"${typewriterEnabled ? ' checked' : ''}>
          </label>
          <label class="fn__flex b3-label">
            <div class="fn__flex-1">
              ${i18n.immersiveHighlight}
              <div class="b3-label__text">${i18n.immersiveHighlightTip}</div>
            </div>
            <span class="fn__space"></span>
            <input class="b3-switch fn__flex-center" id="neo-immersive-highlight" type="checkbox"${highlightEnabled ? ' checked' : ''}>
          </label>
        </div>
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
function applyHighlightState(): void {
  document.body.classList.toggle('neo-extension-immersivemode-highlight', highlightEnabled);
  document.body.classList.toggle('neo-extension-immersivemode-no-highlight', !highlightEnabled);
}
export function showImmersiveModeSettings(): void {
  const plugin = getPlugin();
  if (!plugin) return;
  const dialog = new Dialog({
    title: plugin.i18n.immersiveModeSettings || 'Immersive Mode Settings',
    content: buildSettingsHTML(plugin.i18n),
  });
  const container = dialog.element.querySelector('.b3-dialog__container') as HTMLElement;
  dialog.element.setAttribute('data-key', 'dialog-neo-immersive-settings');
  dialog.element.classList.add('neo-settings-dialog');
  const typewriterSwitch = dialog.element.querySelector('#neo-immersive-typewriter') as HTMLInputElement;
  const highlightSwitch = dialog.element.querySelector('#neo-immersive-highlight') as HTMLInputElement;
  if (typewriterSwitch) typewriterSwitch.checked = typewriterEnabled;
  if (highlightSwitch) highlightSwitch.checked = highlightEnabled;
  dialog.element.querySelector('#neo-immersive-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-immersive-confirm')?.addEventListener('click', () => {
    const newTypewriter = typewriterSwitch ? typewriterSwitch.checked : true;
    const newHighlight = highlightSwitch ? highlightSwitch.checked : true;
    typewriterEnabled = newTypewriter;
    highlightEnabled = newHighlight;
    saveConfig({ 'immersive-typewriter': newTypewriter, 'immersive-highlight': newHighlight } as Partial<Config>);
    if (!newHighlight) {
      clearHighlightCss();
    }
    applyHighlightState();
    dialog.destroy();
  });
}
export function initImmersiveMode(): void {
  (window as any).__neoOpenImmersiveModeSettings = showImmersiveModeSettings;
  loadConfig().then((config) => {
    if (config['immersive-typewriter'] !== undefined) typewriterEnabled = config['immersive-typewriter'];
    if (config['immersive-highlight'] !== undefined) highlightEnabled = config['immersive-highlight'];
    if (config['immersive-mode'] === true) {
      ensureCss('extension-immersivemode', featureCss['extension-immersivemode']);
      document.documentElement.classList.add('neo-extension-immersivemode');
      applyHighlightState();
      startObserving();
    }
  });
}
export function onImmersiveModeClick(): void {
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-extension-immersivemode');
  if (isActive) {
    destroyImmersiveMode();
    saveConfig({ 'immersive-mode': false } as Partial<Config>);
  } else {
    ensureCss('extension-immersivemode', featureCss['extension-immersivemode']);
    htmlEl.classList.add('neo-extension-immersivemode');
    applyHighlightState();
    saveConfig({ 'immersive-mode': true } as Partial<Config>);
    startObserving();
  }
}
export function destroyImmersiveMode(): void {
  removeCss('extension-immersivemode');
  document.documentElement?.classList.remove('neo-extension-immersivemode');
  document.body.classList.remove('neo-extension-immersivemode-highlight', 'neo-extension-immersivemode-no-highlight');
  stopObserving();
}