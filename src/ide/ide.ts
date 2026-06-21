import { isMobile } from '../modules/env';
import { fetchListener } from '../modules/fetchmonitor';
import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
const _fetchListener = fetchListener();
function updateDockWidthClass(): void {
  const dockl = document.querySelector<HTMLElement>('.layout__dockl');
  const dockr = document.querySelector<HTMLElement>('.layout__dockr');
  const dockLeft = document.querySelector<HTMLElement>('#dockLeft');
  const dockRight = document.querySelector<HTMLElement>('#dockRight');
  if (dockl && dockLeft) {
    if (dockl.offsetWidth === 0) {
      dockLeft.classList.add('neo-dockl-not-expand');
    } else {
      dockLeft.classList.remove('neo-dockl-not-expand');
    }
  }
  if (dockr && dockRight) {
    if (dockr.offsetWidth === 0) {
      dockRight.classList.add('neo-dockr-not-expand');
    } else {
      dockRight.classList.remove('neo-dockr-not-expand');
    }
  }
}
_fetchListener.on('setUILayout', () => { updateDockWidthClass(); });
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
      _fetchListener.attach();
      updateDockWidthClass();
      _fallbackTimer = setTimeout(() => {
        updateDockWidthClass();
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
      _fetchListener.attach();
      updateDockWidthClass();
      _fallbackTimer = setTimeout(() => {
        updateDockWidthClass();
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
  _fetchListener.detach();
  document.querySelectorAll('#dockLeft, #dockRight').forEach((el) => {
    el.classList.remove('neo-dockl-not-expand', 'neo-dockr-not-expand');
  });
  document.body.classList.remove('neo-ide-body');
  document.documentElement?.classList.remove('neo-ide');
}