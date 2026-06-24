import { isMobile } from '../modules/env';
import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
function debounce(cb: () => void, delay: number): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      cb();
      timer = null;
    }, delay);
  };
}
function updateDockExpandClass(): void {
  const dockLeft = document.querySelector<HTMLElement>('#dockLeft');
  const dockRight = document.querySelector<HTMLElement>('#dockRight');
  if (dockLeft) {
    if (!dockLeft.querySelector('.dock__item--active')) {
      dockLeft.classList.add('neo-dockl-not-expand');
      dockLeft.classList.remove('neo-dockl-expand');
    } else {
      dockLeft.classList.remove('neo-dockl-not-expand');
      dockLeft.classList.add('neo-dockl-expand');
    }
  }
  if (dockRight) {
    if (!dockRight.querySelector('.dock__item--active')) {
      dockRight.classList.add('neo-dockr-not-expand');
      dockRight.classList.remove('neo-dockr-expand');
    } else {
      dockRight.classList.remove('neo-dockr-not-expand');
      dockRight.classList.add('neo-dockr-expand');
    }
  }
}
function updateDockFloatClass(): void {
  const dockLeft = document.querySelector<HTMLElement>('#dockLeft');
  const dockRight = document.querySelector<HTMLElement>('#dockRight');
  const dockl = document.querySelector<HTMLElement>('.layout__dockl');
  const dockr = document.querySelector<HTMLElement>('.layout__dockr');
  if (dockLeft) {
    dockLeft.classList.toggle('neo-dockl-float', dockl?.classList.contains('layout--float') ?? false);
  }
  if (dockRight) {
    dockRight.classList.toggle('neo-dockr-float', dockr?.classList.contains('layout--float') ?? false);
  }
}
const _debouncedUpdate = debounce(() => {
  updateDockExpandClass();
  updateDockFloatClass();
}, 50);
function onInteractionUp(_e: MouseEvent | KeyboardEvent): void {
  _debouncedUpdate();
}
function attachEvents(): void {
  document.addEventListener('mouseup', onInteractionUp, { passive: true });
  document.addEventListener('keyup', onInteractionUp, { passive: true });
}
function detachEvents(): void {
  document.removeEventListener('mouseup', onInteractionUp);
  document.removeEventListener('keyup', onInteractionUp);
}
let _fallbackTimer: ReturnType<typeof setTimeout> | null = null;
function withViewTransition(callback: () => void): void {
  if (document.startViewTransition) {
    document.startViewTransition(callback);
  } else {
    callback();
  }
}
export function initIde(): void {
  if (isMobile()) return;
  loadConfig().then((config) => {
    if (config['ide'] === true) {
      document.documentElement.classList.add('neo-ide');
      document.body.classList.add('neo-ide-body');
      attachEvents();
      updateDockExpandClass();
      updateDockFloatClass();
      _fallbackTimer = setTimeout(() => {
        updateDockExpandClass();
        updateDockFloatClass();
        _fallbackTimer = null;
      }, 200);
    }
  });
}
export function onIdeClick(): void {
  if (isMobile()) return;
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-ide');
  withViewTransition(() => {
    if (isActive) {
      destroyIde();
      saveConfig({ 'ide': false } as Partial<Config>);
    } else {
      htmlEl.classList.add('neo-ide');
      document.body.classList.add('neo-ide-body');
      saveConfig({ 'ide': true } as Partial<Config>);
      attachEvents();
      updateDockExpandClass();
      updateDockFloatClass();
      _fallbackTimer = setTimeout(() => {
        updateDockExpandClass();
        updateDockFloatClass();
        _fallbackTimer = null;
      }, 200);
    }
  });
}
export function destroyIde(): void {
  if (_fallbackTimer !== null) {
    clearTimeout(_fallbackTimer);
    _fallbackTimer = null;
  }
  detachEvents();
  document.querySelectorAll('#dockLeft, #dockRight').forEach((el) => {
    el.classList.remove('neo-dockl-not-expand', 'neo-dockr-not-expand', 'neo-dockl-expand', 'neo-dockr-expand', 'neo-dockl-float', 'neo-dockr-float');
  });
  document.body.classList.remove('neo-ide-body');
  document.documentElement?.classList.remove('neo-ide');
}