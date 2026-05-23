import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
let smoothCaretEventHandler: (() => void) | null = null;
let throttledCaretEventHandler: (() => void) | null = null;
let throttleTimers: number[] = [];
let cachedZIndex = 0;
let lastTargetElement: Element | null = null;
let cachedScrollContainer: HTMLElement | null = null;
let cachedFocusElement: Element | null = null;
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
      const range = sel.getRangeAt(0);
      let rect = range.getClientRects()[0];
      if (!rect || rect.height === 0) {
        let textNode: Text | null = null;
        try {
          const cloneRange = range.cloneRange();
          textNode = document.createTextNode('\u200B');
          cloneRange.insertNode(textNode);
          cloneRange.selectNode(textNode);
          rect = cloneRange.getBoundingClientRect();
        } catch {
        } finally {
          if (textNode?.parentNode) {
            textNode.parentNode.removeChild(textNode);
          }
        }
      }
      if (rect) {
        if (focusElement !== cachedFocusElement) {
          cachedFocusElement = focusElement ?? null;
          cachedScrollContainer = focusElement?.closest('.protyle-content') as HTMLElement | null;
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
        let textColor: string | null = null;
        const focusNode = sel.focusNode;
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
          textColor = window.getComputedStyle(targetElement).color;
        }
        if (textColor && textColor !== 'transparent') {
          const rgbaMatch = textColor.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);
          if (rgbaMatch && parseFloat(rgbaMatch[4]) === 0) {
            caretElement.style.removeProperty('--neo-smooth-caret-color');
          } else {
            caretElement.style.setProperty('--neo-smooth-caret-color', textColor);
          }
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
export function destroySmoothCaret(): void {
  document.getElementById('neo-smooth-caret-item')?.remove();
  document.documentElement.classList.remove('neo-extension-smooth-caret');
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
  loadConfig().then((config) => {
    if (config['smooth-caret'] === true) {
      document.documentElement.classList.add('neo-extension-smooth-caret');
      startSmoothCaret();
    }
  });
}
export function onSmoothCaretClick(): void {
  const htmlEl = document.documentElement;
  if (!htmlEl) return;
  const isActive = htmlEl.classList.contains('neo-extension-smooth-caret');
  if (isActive) {
    htmlEl.classList.remove('neo-extension-smooth-caret');
    saveConfig({ 'smooth-caret': false } as Partial<Config>);
    destroySmoothCaret();
  } else {
    htmlEl.classList.add('neo-extension-smooth-caret');
    saveConfig({ 'smooth-caret': true } as Partial<Config>);
    startSmoothCaret();
  }
}
