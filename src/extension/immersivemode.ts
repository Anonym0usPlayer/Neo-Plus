import { isMobile } from '../modules/env';
import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
const scrollDuration = 600;
const scrollThrottle = 100;
const centerThreshold = 40;
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
      const currentRect = getCursorRect();
      if (currentRect) {
        updateMaskPosition(currentRect, container.getBoundingClientRect(), container);
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
  const cursorRect = getCursorRect();
  if (!cursorRect) return;
  const container = getScrollContainer();
  if (!container) return;
  const containerRect = container.getBoundingClientRect();
  const cursorCenterY = cursorRect.top + cursorRect.height / 2;
  const containerCenterY = containerRect.top + containerRect.height / 2;
  const distFromCenter = Math.abs(cursorCenterY - containerCenterY);
  if (isScrolling) {
    updateMaskPosition(cursorRect, containerRect, container);
  } else if (distFromCenter > centerThreshold && rafId === null) {
    scrollToLineCenter(cursorRect, container, containerRect);
  } else {
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
  document.querySelectorAll<HTMLElement>('.protyle-content').forEach((el) => {
    el.style.removeProperty('--neo-immersive-mask-position');
    el.style.removeProperty('--neo-immersive-mask-height');
    el.style.removeProperty('--neo-immersive-text-color');
  });
}
export function initImmersiveMode(): void {
  if (isMobile()) return;
  loadConfig().then((config) => {
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
  document.documentElement?.classList.remove('neo-extension-immersivemode');
  stopObserving();
}