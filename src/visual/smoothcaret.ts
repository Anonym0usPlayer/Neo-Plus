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
let smoothCaretMotion: 'static' | 'breathing' | 'stretch' = 'static';
let smoothCaretEase: 'elegant' | 'shuttle' | 'drift' = 'elegant';
let smoothCaretStyle: 'default' | 'neon' | 'rainbow' = 'default';
let motionAnimFrameId: number | null = null;
let motionAnimStartTime: number = 0;
let motionUpdateFn: (() => void) | null = null;
let isMotionActive = false;
const scrollListenerOptions: AddEventListenerOptions = { capture: true, passive: true };
function getStretchScale(): number {
  if (smoothCaretMotion !== 'stretch') return 1;
  const cycleMs = 1000;
  const elapsed = performance.now() - motionAnimStartTime;
  const progress = (elapsed % cycleMs) / cycleMs;
  if (progress < 0.35) {
    return 0.3 + (progress / 0.35) * 0.8;
  }
  if (progress < 0.65) return 1.1;
  return 1.1 - ((progress - 0.65) / 0.35) * 0.8;
}
function getBreathingOpacity(): number {
  if (smoothCaretMotion !== 'breathing') return 1;
  const cycleMs = 1000;
  const elapsed = performance.now() - motionAnimStartTime;
  const progress = (elapsed % cycleMs) / cycleMs;
  if (progress < 0.35) return 1;
  if (progress < 0.4) return 1 - (progress - 0.35) / 0.05;
  if (progress < 0.6) return 0;
  if (progress < 0.65) return (progress - 0.6) / 0.05;
  return 1;
}
function applySmoothCaretMotion(): void {
  document.body.classList.remove(
    'neo-visual-smooth-caret-motion-static',
    'neo-visual-smooth-caret-motion-breathing',
    'neo-visual-smooth-caret-motion-stretch'
  );
  document.body.classList.add(`neo-visual-smooth-caret-motion-${smoothCaretMotion}`);
}
function applySmoothCaretStyle(): void {
  document.body.classList.remove(
    'neo-visual-smooth-caret-style-default',
    'neo-visual-smooth-caret-style-neon',
    'neo-visual-smooth-caret-style-rainbow'
  );
  document.body.classList.add(`neo-visual-smooth-caret-style-${smoothCaretStyle}`);
}
function applySmoothCaretEase(): void {
  const easeMap: Record<string, string> = {
    elegant: '0.75s cubic-bezier(0.1, 0.9, 0.2, 1)',
    shuttle: '0.15s ease-out',
    drift: '0.15s ease-in',
  };
  const caret = document.getElementById('neo-smooth-caret-item');
  if (caret) {
    caret.style.setProperty('--neo-smooth-caret-ease', easeMap[smoothCaretEase] || easeMap.elegant);
  }
}
function restartMotionAnimation(): void {
  if (motionAnimFrameId !== null) {
    cancelAnimationFrame(motionAnimFrameId);
    motionAnimFrameId = null;
  }
  if (smoothCaretMotion === 'static') {
    isMotionActive = false;
    const caret = document.getElementById('neo-smooth-caret-item');
    if (caret) caret.style.removeProperty('opacity');
    return;
  }
  isMotionActive = true;
  motionAnimStartTime = performance.now();
  function tick(): void {
    if (!isMotionActive || smoothCaretMotion === 'static') {
      motionAnimFrameId = null;
      return;
    }
    motionUpdateFn?.();
    motionAnimFrameId = requestAnimationFrame(tick);
  }
  motionAnimFrameId = requestAnimationFrame(tick);
}
function startSmoothCaret(): void {
  document.getElementById('neo-smooth-caret-item')?.remove();
  const caretElement = document.createElement('div');
  caretElement.id = 'neo-smooth-caret-item';
  document.body.appendChild(caretElement);
  applySmoothCaretEase();
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
        const scaleY = getStretchScale();
        caretElement.style.translate = `${rect.left - 0.75}px ${rect.top - rect.height * 0.025}px`;
        caretElement.style.transform = scaleY !== 1 ? `scaleY(${scaleY})` : '';
        caretElement.style.height = `${rect.height * 1.05}px`;
        const breathOpacity = getBreathingOpacity();
        if (breathOpacity !== 1) {
          caretElement.style.opacity = breathOpacity.toString();
        } else {
          caretElement.style.removeProperty('opacity');
        }
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
  motionUpdateFn = (): void => {
    isAnimationFramePending = false;
    updateCaretPosition();
  };
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
  document.addEventListener('scroll', handleCaretUpdateTrigger, scrollListenerOptions);
  document.addEventListener('keyup', handleThrottledCaretUpdate);
  document.addEventListener('mouseup', handleThrottledCaretUpdate);
  updateCaretPosition();
  restartMotionAnimation();
}
export function createSmoothCaretLabelHTML(i18n: Record<string, string>): string {
  return `<span class="fn__flex fn__pointer">
    <span>${i18n.smoothCaret}</span>
    <span class="fn__space fn__flex-1 neo-menu-item-second-icon-space"></span>
    <svg class="b3-menu__icon neo-menu-item-second-icon ariaLabel" aria-label="${i18n.smoothCaretSettings}" onclick="event.stopPropagation();__neoOpenSmoothCaretSettings()"><use xlink:href="#iconSettings"></use></svg>
  </span>`;
}
function buildSettingsHTML(i18n: Record<string, string>): string {
  const easeOptions = ['elegant', 'shuttle', 'drift']
    .map(v => `<option value="${v}">${i18n[`smoothCaretEase${v.charAt(0).toUpperCase() + v.slice(1)}`]}</option>`)
    .join('');
  const motionOptions = ['static', 'breathing', 'stretch']
    .map(v => `<option value="${v}">${i18n[`smoothCaretMotion${v.charAt(0).toUpperCase() + v.slice(1)}`]}</option>`)
    .join('');
  const styleOptions = ['default', 'neon', 'rainbow']
    .map(v => `<option value="${v}">${i18n[`smoothCaretStyle${v.charAt(0).toUpperCase() + v.slice(1)}`]}</option>`)
    .join('');
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <div class="config-items">
          <label class="fn__flex b3-label">
            <div class="fn__flex-1">
              ${i18n.smoothCaretEase}
              <div class="b3-label__text">${i18n.smoothCaretEaseTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-smooth-caret-ease">
              ${easeOptions}
            </select>
          </label>
          <label class="fn__flex b3-label">
            <div class="fn__flex-1">
              ${i18n.smoothCaretMotion}
              <div class="b3-label__text">${i18n.smoothCaretMotionTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-smooth-caret-motion">
              ${motionOptions}
            </select>
          </label>
          <label class="fn__flex b3-label">
            <div class="fn__flex-1">
              ${i18n.smoothCaretStyle}
              <div class="b3-label__text">${i18n.smoothCaretStyleTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-smooth-caret-style">
              ${styleOptions}
            </select>
          </label>
        </div>
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
  });
  const container = dialog.element.querySelector('.b3-dialog__container') as HTMLElement;
  dialog.element.setAttribute('data-key', 'dialog-neo-smooth-caret-settings');
  dialog.element.classList.add('neo-settings-dialog');
  const easeSelect = dialog.element.querySelector('#neo-smooth-caret-ease') as HTMLSelectElement;
  const motionSelect = dialog.element.querySelector('#neo-smooth-caret-motion') as HTMLSelectElement;
  const styleSelect = dialog.element.querySelector('#neo-smooth-caret-style') as HTMLSelectElement;
  if (easeSelect) easeSelect.value = smoothCaretEase;
  if (motionSelect) motionSelect.value = smoothCaretMotion;
  if (styleSelect) styleSelect.value = smoothCaretStyle;
  dialog.element.querySelector('#neo-smooth-caret-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-smooth-caret-confirm')?.addEventListener('click', () => {
    let changed = false;
    if (easeSelect) {
      const newEase = easeSelect.value as 'elegant' | 'shuttle' | 'drift';
      if (newEase !== smoothCaretEase) {
        smoothCaretEase = newEase;
        applySmoothCaretEase();
        saveConfig({ 'smooth-caret-ease': newEase } as Partial<Config>);
        changed = true;
      }
    }
    if (motionSelect) {
      const newMotion = motionSelect.value as 'static' | 'breathing' | 'stretch';
      if (newMotion !== smoothCaretMotion) {
        smoothCaretMotion = newMotion;
        applySmoothCaretMotion();
        restartMotionAnimation();
        saveConfig({ 'smooth-caret-motion': newMotion } as Partial<Config>);
        changed = true;
      }
    }
    if (styleSelect) {
      const newStyle = styleSelect.value as 'default' | 'neon' | 'rainbow';
      if (newStyle !== smoothCaretStyle) {
        smoothCaretStyle = newStyle;
        applySmoothCaretStyle();
        saveConfig({ 'smooth-caret-style': newStyle } as Partial<Config>);
        changed = true;
      }
    }
    dialog.destroy();
  });
}
export function destroySmoothCaret(): void {
  document.getElementById('neo-smooth-caret-item')?.remove();
  document.documentElement.classList.remove('neo-visual-smooth-caret');
  document.body.classList.remove(
    'neo-visual-smooth-caret-motion-static',
    'neo-visual-smooth-caret-motion-breathing',
    'neo-visual-smooth-caret-motion-stretch',
    'neo-visual-smooth-caret-style-default',
    'neo-visual-smooth-caret-style-neon',
    'neo-visual-smooth-caret-style-rainbow'
  );
  throttleTimers.forEach((timer) => clearTimeout(timer));
  throttleTimers = [];
  cachedZIndex = 0;
  lastTargetElement = null;
  cachedScrollContainer = null;
  cachedFocusElement = null;
  if (smoothCaretEventHandler) {
    document.removeEventListener('selectionchange', smoothCaretEventHandler);
    document.removeEventListener('scroll', smoothCaretEventHandler, scrollListenerOptions);
    smoothCaretEventHandler = null;
  }
  if (throttledCaretEventHandler) {
    document.removeEventListener('keyup', throttledCaretEventHandler);
    document.removeEventListener('mouseup', throttledCaretEventHandler);
    throttledCaretEventHandler = null;
  }
  if (motionAnimFrameId !== null) {
    cancelAnimationFrame(motionAnimFrameId);
    motionAnimFrameId = null;
  }
  isMotionActive = false;
  motionUpdateFn = null;
}
export function initSmoothCaret(): void {
  (window as any).__neoOpenSmoothCaretSettings = showSmoothCaretSettings;
  loadConfig().then((config) => {
    smoothCaretMotion = config['smooth-caret-motion'] || 'static';
    smoothCaretEase = config['smooth-caret-ease'] || 'elegant';
    smoothCaretStyle = config['smooth-caret-style'] || 'default';
    if (config['smooth-caret'] === true) {
      document.documentElement.classList.add('neo-visual-smooth-caret');
      applySmoothCaretMotion();
      applySmoothCaretStyle();
      startSmoothCaret();
    }
  });
}
export function onSmoothCaretClick(): void {
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-visual-smooth-caret');
  if (isActive) {
    destroySmoothCaret();
    saveConfig({ 'smooth-caret': false } as Partial<Config>);
  } else {
    htmlEl.classList.add('neo-visual-smooth-caret');
    applySmoothCaretMotion();
    applySmoothCaretStyle();
    saveConfig({ 'smooth-caret': true } as Partial<Config>);
    startSmoothCaret();
  }
}