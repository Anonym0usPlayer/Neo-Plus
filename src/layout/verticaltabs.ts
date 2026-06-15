import { isMobile } from '../modules/env';
import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
import { fetchListener } from '../modules/fetchmonitor';
import { Dialog } from 'siyuan';
import { getPlugin } from '../main/guard';
let destroyed = false;
let mouseDownHandler: ((e: MouseEvent) => void) | null = null;
let dblClickHandler: ((e: MouseEvent) => void) | null = null;
const defaultWidth = 150;
const minWidth = 100;
const maxWidth = 350;
let topLeftOnlyLastWidth: number | null = null;
let currentMode: 'topLeftOnly' | 'all' = 'topLeftOnly';
const wndSelector = '.layout__center [data-type="wnd"]';
function queryWnds(): NodeListOf<HTMLElement> {
  return document.querySelectorAll<HTMLElement>(wndSelector);
}
function addResizeElement(wnd: HTMLElement, firstFlex: HTMLElement): void {
  if (!wnd.querySelector('.neo-verticaltabs-resize')) {
    const resizeEl = document.createElement('div');
    resizeEl.className = 'layout__resize--lr layout__resize neo-verticaltabs-resize';
    firstFlex.after(resizeEl);
  }
}
function clearVerticalTabsLayout(): void {
  queryWnds().forEach((wnd) => {
    wnd.classList.remove('neo-verticaltabs-wnd');
    const firstFlex = wnd.querySelector<HTMLElement>('.fn__flex:first-child');
    if (firstFlex) firstFlex.style.width = '';
  });
  document.querySelectorAll('.neo-verticaltabs-resize').forEach((el) => el.remove());
}
function doUpdateTopLeftOnly(): void {
  clearVerticalTabsLayout();
  const wnds = queryWnds();
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
  if (!topLeftWnd) return;
  topLeftWnd.classList.add('neo-verticaltabs-wnd');
  const firstFlex = topLeftWnd.querySelector<HTMLElement>('.fn__flex:first-child');
  if (!firstFlex || firstFlex.classList.contains('fn__none')) return;
  firstFlex.style.width = `${topLeftOnlyLastWidth ?? defaultWidth}px`;
  addResizeElement(topLeftWnd, firstFlex);
}
function doUpdateAll(): void {
  queryWnds().forEach((wnd) => {
    wnd.classList.remove('neo-verticaltabs-wnd');
  });
  document.querySelectorAll('.neo-verticaltabs-resize').forEach((el) => el.remove());
  const wnds = queryWnds();
  if (wnds.length === 0) return;
  wnds.forEach((wnd) => {
    wnd.classList.add('neo-verticaltabs-wnd');
    const firstFlex = wnd.querySelector<HTMLElement>('.fn__flex:first-child');
    if (firstFlex && !firstFlex.classList.contains('fn__none')) {
      if (!firstFlex.style.width) {
        firstFlex.style.width = `${defaultWidth}px`;
      }
      addResizeElement(wnd, firstFlex);
    }
  });
}
function doUpdate(): void {
  if (destroyed) return;
  if (document.body?.classList.contains('body--toolbar-hide') || document.body?.classList.contains('body--window')) {
    clearVerticalTabsLayout();
    return;
  }
  const wnds = queryWnds();
  if (wnds.length === 0) {
    clearVerticalTabsLayout();
    return;
  }
  if (currentMode === 'all') {
    doUpdateAll();
  } else {
    doUpdateTopLeftOnly();
  }
}
function initResizeHandle(): void {
  if (mouseDownHandler || dblClickHandler) return;
  mouseDownHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('neo-verticaltabs-resize')) return;
    e.preventDefault();
    const wnd = target.closest<HTMLElement>('.neo-verticaltabs-wnd');
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
      if (currentMode === 'topLeftOnly' && flexEl) {
        topLeftOnlyLastWidth = flexEl.getBoundingClientRect().width;
      }
    }
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
  dblClickHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('neo-verticaltabs-resize')) return;
    const wnd = target.closest<HTMLElement>('.neo-verticaltabs-wnd');
    if (wnd) {
      const firstFlex = wnd.querySelector<HTMLElement>('.fn__flex:first-child');
      if (firstFlex) {
        firstFlex.style.width = `${defaultWidth}px`;
        if (currentMode === 'topLeftOnly') {
          topLeftOnlyLastWidth = defaultWidth;
        }
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
function createVerticalTabsLabelHTML(i18n: Record<string, string>): string {
  return `<span class="fn__flex fn__pointer">
    <span>${i18n.verticalTabs}</span>
    <span class="fn__space fn__flex-1 neo-menu-item-second-icon-space"></span>
    <svg class="b3-menu__icon neo-menu-item-second-icon ariaLabel" aria-label="${i18n.verticaltabsSettings}" onclick="event.stopPropagation();__neoOpenVerticalTabsSettings()"><use xlink:href="#iconSettings"></use></svg>
  </span>`;
}
function buildSettingsHTML(i18n: Record<string, string>): string {
  const modeOptions = ['topLeftOnly', 'all']
    .map(v => `<option value="${v}">${i18n[`verticaltabsMode${v.charAt(0).toUpperCase() + v.slice(1)}`]}</option>`)
    .join('');
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <label class="fn__flex b3-label">
          <div class="fn__flex-1">
            ${i18n.verticaltabsMode}
            <div class="b3-label__text">${i18n.verticaltabsModeTip}</div>
          </div>
          <span class="fn__space"></span>
          <select class="b3-select fn__flex-center fn__size200" id="neo-verticaltabs-mode">
            ${modeOptions}
          </select>
        </label>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-verticaltabs-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-verticaltabs-confirm">${i18n.confirm}</button>
  </div>`;
}
export function showVerticalTabsSettings(): void {
  const plugin = getPlugin();
  if (!plugin) return;
  const dialog = new Dialog({
    title: plugin.i18n.verticaltabsSettings || 'Vertical Tabs Settings',
    content: buildSettingsHTML(plugin.i18n),
    width: '90vw',
  });
  const container = dialog.element.querySelector('.b3-dialog__container') as HTMLElement;
  if (container) container.style.maxWidth = '800px';
  dialog.element.setAttribute('data-key', 'dialog-neo-verticaltabs-settings');
  const modeSelect = dialog.element.querySelector('#neo-verticaltabs-mode') as HTMLSelectElement;
  if (modeSelect) modeSelect.value = currentMode;
  dialog.element.querySelector('#neo-verticaltabs-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-verticaltabs-confirm')?.addEventListener('click', () => {
    if (modeSelect) {
      const newMode = modeSelect.value as 'topLeftOnly' | 'all';
      if (newMode !== currentMode) {
        queryWnds().forEach((wnd) => {
          const firstFlex = wnd.querySelector<HTMLElement>('.fn__flex:first-child');
          if (firstFlex) firstFlex.style.width = '';
        });
        topLeftOnlyLastWidth = null;
        currentMode = newMode;
        saveConfig({ 'vertical-tabs-mode': newMode } as Partial<Config>);
        if (document.documentElement.classList.contains('neo-layout-verticaltabs')) {
          doUpdate();
        }
      }
    }
    dialog.destroy();
  });
}
const _fetchListener = fetchListener();
_fetchListener.on('setUILayout', () => { doUpdate(); });
export { createVerticalTabsLabelHTML };
export function initVerticalTabs(): void {
  if (isMobile()) return;
  (window as any).__neoOpenVerticalTabsSettings = showVerticalTabsSettings;
  loadConfig().then((config) => {
    if (config['vertical-tabs'] === true) {
      document.documentElement.classList.add('neo-layout-verticaltabs');
      destroyed = false;
      topLeftOnlyLastWidth = null;
      currentMode = config['vertical-tabs-mode'] || 'topLeftOnly';
      initResizeHandle();
      _fetchListener.attach();
      doUpdate();
    }
  });
}
export function onVerticalTabsClick(): void {
  if (isMobile()) return;
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-layout-verticaltabs');
  if (isActive) {
    destroyVerticalTabs();
    saveConfig({ 'vertical-tabs': false } as Partial<Config>);
  } else {
    htmlEl.classList.add('neo-layout-verticaltabs');
    saveConfig({ 'vertical-tabs': true } as Partial<Config>);
    destroyed = false;
    topLeftOnlyLastWidth = null;
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
  clearVerticalTabsLayout();
}