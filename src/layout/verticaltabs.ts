import { isMobile } from '../modules/env';
import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
import { fetchListener } from '../modules/fetchmonitor';
let destroyed = false;
let mouseDownHandler: ((e: MouseEvent) => void) | null = null;
let dblClickHandler: ((e: MouseEvent) => void) | null = null;
const defaultWidth = 150;
const minWidth = 100;
const maxWidth = 350;
let lastWidth: number | null = null;
function clearLayout(): void {
  document.querySelectorAll<HTMLElement>('.layout__center [data-type="wnd"]').forEach((wnd) => {
    wnd.classList.remove('neo-verticaltabs-wnd');
    const firstFlex = wnd.querySelector<HTMLElement>('.fn__flex:first-child');
    if (firstFlex) firstFlex.style.width = '';
  });
  document.querySelectorAll('.neo-verticaltabs-resize').forEach((el) => el.remove());
}
function doUpdate(): void {
  if (destroyed) return;
  if (document.body?.classList.contains('body--toolbar-hide') || document.body?.classList.contains('body--window')) {
    clearLayout();
    return;
  }
  const wnds = document.querySelectorAll<HTMLElement>('.layout__center [data-type="wnd"]');
  if (wnds.length === 0) {
    clearLayout();
    return;
  }
  clearLayout();
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
  const targetWnd = document.querySelector<HTMLElement>('.neo-verticaltabs-wnd');
  if (targetWnd) {
    const firstFlex = targetWnd.querySelector<HTMLElement>('.fn__flex:first-child');
    if (firstFlex && !firstFlex.classList.contains('fn__none')) {
      firstFlex.style.width = `${lastWidth ?? defaultWidth}px`;
      const resizeEl = document.createElement('div');
      resizeEl.className = 'layout__resize--lr layout__resize neo-verticaltabs-resize';
      firstFlex.after(resizeEl);
    }
  }
}
function initResizeHandle(): void {
  if (mouseDownHandler || dblClickHandler) return;
  mouseDownHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('neo-verticaltabs-resize')) return;
    e.preventDefault();
    const wnd = document.querySelector<HTMLElement>('.neo-verticaltabs-wnd');
    if (!wnd) return;
    const firstFlex = wnd.querySelector<HTMLElement>('.fn__flex:first-child');
    if (!firstFlex) return;
    const flexEl = firstFlex;
    const startX = e.clientX;
    const currentWidth = flexEl.getBoundingClientRect().width || defaultWidth;
    function onMouseMove(ev: MouseEvent) {
      const diff = ev.clientX - startX;
      let newWidth = currentWidth + diff;
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
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
  dblClickHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('neo-verticaltabs-resize')) return;
    const wnd = document.querySelector<HTMLElement>('.neo-verticaltabs-wnd');
    if (wnd) {
      const firstFlex = wnd.querySelector<HTMLElement>('.fn__flex:first-child');
      if (firstFlex) {
        firstFlex.style.width = `${defaultWidth}px`;
        lastWidth = defaultWidth;
      }
    }
  };
  document.addEventListener('mousedown', mouseDownHandler);
  document.addEventListener('dblclick', dblClickHandler);
}
function destroyResizeHandle(): void {
  if (mouseDownHandler) {
    document.removeEventListener('mousedown', mouseDownHandler);
    mouseDownHandler = null;
  }
  if (dblClickHandler) {
    document.removeEventListener('dblclick', dblClickHandler);
    dblClickHandler = null;
  }
}
const _fetchListener = fetchListener();
_fetchListener.on('setUILayout', () => { doUpdate(); });
export function initVerticalTabs(): void {
  if (isMobile()) return;
  loadConfig().then((config) => {
    if (config['vertical-tabs'] === true) {
      document.documentElement.classList.add('neo-layout-verticaltabs');
      destroyed = false;
      lastWidth = null;
      initResizeHandle();
      _fetchListener.attach();
      doUpdate();
    }
  });
}
export function onVerticalTabsClick(): void {
  if (isMobile()) return;
  const htmlEl = document.documentElement;
  if (!htmlEl) return;
  const isActive = htmlEl.classList.contains('neo-layout-verticaltabs');
  if (isActive) {
    destroyVerticalTabs();
    saveConfig({ 'vertical-tabs': false } as Partial<Config>);
  } else {
    htmlEl.classList.add('neo-layout-verticaltabs');
    saveConfig({ 'vertical-tabs': true } as Partial<Config>);
    destroyed = false;
    lastWidth = null;
    initResizeHandle();
    _fetchListener.attach();
    doUpdate();
  }
}
export function destroyVerticalTabs(): void {
  destroyed = true;
  _fetchListener.detach();
  destroyResizeHandle();
  document.documentElement?.classList.remove('neo-layout-verticaltabs');
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