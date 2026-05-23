import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
import { getPlugin } from '../main/guard';
let destroyed = false;
let switchProtyleHandler: ((detail: any) => void) | null = null;
let mousedownHandler: ((e: MouseEvent) => void) | null = null;
let dblclickHandler: ((e: MouseEvent) => void) | null = null;
const DEFAULT_WIDTH = 150;
const MIN_WIDTH = 100;
const MAX_WIDTH = 350;
let lastWidth: number | null = null;
function doUpdate(): void {
  if (destroyed) return;
  const wnds = document.querySelectorAll<HTMLElement>('.layout__center [data-type="wnd"]');
  wnds.forEach((wnd) => {
    wnd.classList.remove('neo-verticaltabs-wnd');
    const firstFlex = wnd.querySelector<HTMLElement>('.fn__flex:first-child');
    if (firstFlex) {
      firstFlex.style.width = '';
    }
  });
  if (wnds.length === 0) return;
  let topLeftWnd: HTMLElement | null = null;
  let topLeftRect: DOMRect | null = null;
  for (let i = 0; i < wnds.length; i++) {
    const wnd = wnds[i];
    const rect = wnd.getBoundingClientRect();
    if (!topLeftWnd || !topLeftRect) {
      topLeftWnd = wnd;
      topLeftRect = rect;
      continue;
    }
    if (rect.top < topLeftRect.top || (rect.top === topLeftRect.top && rect.left < topLeftRect.left)) {
      topLeftWnd = wnd;
      topLeftRect = rect;
    }
  }
  if (topLeftWnd) {
    topLeftWnd.classList.add('neo-verticaltabs-wnd');
  }
  document.querySelectorAll('.neo-verticaltabs-resize').forEach((el) => el.remove());
  const targetWnd = document.querySelector<HTMLElement>('.neo-verticaltabs-wnd');
  if (targetWnd) {
    const firstFlex = targetWnd.querySelector<HTMLElement>('.fn__flex:first-child');
    if (firstFlex && !firstFlex.classList.contains('fn__none')) {
      firstFlex.style.width = `${lastWidth ?? DEFAULT_WIDTH}px`;
      const resizeEl = document.createElement('div');
      resizeEl.className = 'layout__resize--lr layout__resize neo-verticaltabs-resize';
      firstFlex.after(resizeEl);
    }
  }
}
function initResizeHandle(): void {
  if (mousedownHandler || dblclickHandler) return;
  mousedownHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('neo-verticaltabs-resize')) return;
    e.preventDefault();
    const wnd = document.querySelector<HTMLElement>('.neo-verticaltabs-wnd');
    if (!wnd) return;
    const firstFlex = wnd.querySelector<HTMLElement>('.fn__flex:first-child');
    if (!firstFlex) return;
    const flexEl = firstFlex;
    const startX = e.clientX;
    const currentWidth = flexEl.getBoundingClientRect().width || DEFAULT_WIDTH;
    function onMouseMove(ev: MouseEvent) {
      const diff = ev.clientX - startX;
      let newWidth = currentWidth + diff;
      newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
      flexEl.style.width = `${newWidth}px`;
    }
    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (flexEl) {
        lastWidth = flexEl.getBoundingClientRect().width;
      }
    }
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
  dblclickHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('neo-verticaltabs-resize')) return;
    const wnd = document.querySelector<HTMLElement>('.neo-verticaltabs-wnd');
    if (wnd) {
      const firstFlex = wnd.querySelector<HTMLElement>('.fn__flex:first-child');
      if (firstFlex) {
        firstFlex.style.width = `${DEFAULT_WIDTH}px`;
        lastWidth = DEFAULT_WIDTH;
      }
    }
  };
  document.addEventListener('mousedown', mousedownHandler);
  document.addEventListener('dblclick', dblclickHandler);
}
function destroyResizeHandle(): void {
  if (mousedownHandler) {
    document.removeEventListener('mousedown', mousedownHandler);
    mousedownHandler = null;
  }
  if (dblclickHandler) {
    document.removeEventListener('dblclick', dblclickHandler);
    dblclickHandler = null;
  }
}
function attachListener(): void {
  if (switchProtyleHandler) return;
  const plugin = getPlugin();
  if (!plugin) return;
  switchProtyleHandler = () => {
    doUpdate();
  };
  plugin.eventBus.on('switch-protyle', switchProtyleHandler);
}
function detachListener(): void {
  if (!switchProtyleHandler) return;
  const plugin = getPlugin();
  if (!plugin) return;
  plugin.eventBus.off('switch-protyle', switchProtyleHandler);
  switchProtyleHandler = null;
}
export function initVerticalTabs(): void {
  loadConfig().then((config) => {
    if (config['vertical-tabs'] === true) {
      document.documentElement.classList.add('neo-extension-verticaltabs');
      destroyed = false;
      lastWidth = null;
      initResizeHandle();
      attachListener();
      doUpdate();
    }
  });
}
export function onVerticalTabsClick(): void {
  const htmlEl = document.documentElement;
  if (!htmlEl) return;
  const isActive = htmlEl.classList.contains('neo-extension-verticaltabs');
  if (isActive) {
    destroyVerticalTabs();
    saveConfig({ 'vertical-tabs': false } as Partial<Config>);
  } else {
    htmlEl.classList.add('neo-extension-verticaltabs');
    saveConfig({ 'vertical-tabs': true } as Partial<Config>);
    destroyed = false;
    lastWidth = null;
    initResizeHandle();
    attachListener();
    doUpdate();
  }
}
export function destroyVerticalTabs(): void {
  destroyed = true;
  detachListener();
  destroyResizeHandle();
  document.documentElement?.classList.remove('neo-extension-verticaltabs');
  document.querySelectorAll<HTMLElement>('.layout__center [data-type="wnd"]')
    .forEach((wnd) => {
      wnd.classList.remove('neo-verticaltabs-wnd');
      const firstFlex = wnd.querySelector<HTMLElement>('.fn__flex:first-child');
      if (firstFlex) {
        firstFlex.style.width = '';
      }
    });
  document.querySelectorAll('.neo-verticaltabs-resize').forEach((el) => el.remove());
}
