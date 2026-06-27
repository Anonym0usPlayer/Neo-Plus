import { isMobile } from '../modules/env';
import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
import { getPlugin } from '../main/guard';
import { Dialog } from 'siyuan';
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
function hasActiveItemBeforeSpace(container: HTMLElement): boolean {
  for (const child of container.children) {
    if (child.classList.contains('dock__item--space')) break;
    if (child.classList.contains('dock__items') && child.querySelector('.dock__item--active')) return true;
  }
  return false;
}
function hasActiveItemAfterSpace(container: HTMLElement): boolean {
  let afterSpace = false;
  for (const child of container.children) {
    if (child.classList.contains('dock__item--space')) { afterSpace = true; continue; }
    if (afterSpace && child.classList.contains('dock__items') && child.querySelector('.dock__item--active')) return true;
  }
  return false;
}
function updateDockExpandClass(): void {
  const dockLeft = document.querySelector<HTMLElement>('#dockLeft');
  const dockRight = document.querySelector<HTMLElement>('#dockRight');
  const body = document.body;
  let dockbExpanded = false;
  if (dockLeft) {
    const hasL = hasActiveItemBeforeSpace(dockLeft);
    const hasB = hasActiveItemAfterSpace(dockLeft);
    body.classList.toggle('neo-dockl-expand', hasL);
    body.classList.toggle('neo-dockl-not-expand', !hasL);
    if (hasB) dockbExpanded = true;
  }
  if (dockRight) {
    const hasR = hasActiveItemBeforeSpace(dockRight);
    const hasB = hasActiveItemAfterSpace(dockRight);
    body.classList.toggle('neo-dockr-expand', hasR);
    body.classList.toggle('neo-dockr-not-expand', !hasR);
    if (hasB) dockbExpanded = true;
  }
  body.classList.toggle('neo-dockb-expand', dockbExpanded);
  body.classList.toggle('neo-dockb-not-expand', !dockbExpanded);
}
function updateDockFloatClass(): void {
  const dockl = document.querySelector<HTMLElement>('.layout__dockl');
  const dockr = document.querySelector<HTMLElement>('.layout__dockr');
  const dockb = document.querySelector<HTMLElement>('.layout__dockb');
  const body = document.body;
  const docklFloat = dockl?.classList.contains('layout--float') ?? false;
  const dockrFloat = dockr?.classList.contains('layout--float') ?? false;
  const dockbFloat = dockb?.classList.contains('layout--float') ?? false;
  body.classList.toggle('neo-dockl-float', docklFloat);
  body.classList.toggle('neo-dockl-not-float', !docklFloat);
  body.classList.toggle('neo-dockr-float', dockrFloat);
  body.classList.toggle('neo-dockr-not-float', !dockrFloat);
  body.classList.toggle('neo-dockb-float', dockbFloat);
  body.classList.toggle('neo-dockb-not-float', !dockbFloat);
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
let ideDockpanelBg: 'surface' | 'background' = 'surface';
function applyDockpanelBg(): void {
  document.body.classList.toggle('neo-ide-dockpanel-bg-surface', ideDockpanelBg === 'surface');
  document.body.classList.toggle('neo-ide-dockpanel-bg-background', ideDockpanelBg === 'background');
}
function withViewTransition(callback: () => void): void {
  if (document.startViewTransition) {
    document.startViewTransition(callback);
  } else {
    callback();
  }
}
export function createIdeLabelHTML(i18n: Record<string, string>): string {
  return `<span class="fn__flex fn__pointer">
    <span>${i18n.ide}</span>
    <span class="fn__space fn__flex-1 neo-menu-item-second-icon-space"></span>
    <svg class="b3-menu__icon neo-menu-item-second-icon ariaLabel" aria-label="${i18n.ideSettings}" onclick="event.stopPropagation();__neoOpenIdeSettings()"><use xlink:href="#iconSettings"></use></svg>
  </span>`;
}
function buildSettingsHTML(i18n: Record<string, string>): string {
  const bgOptions = ['surface', 'background']
    .map(v => `<option value="${v}">${i18n[`ideDockpanelBg${v.charAt(0).toUpperCase() + v.slice(1)}`]}</option>`)
    .join('');
  return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <div class="config-items">
          <label class="fn__flex b3-label">
            <div class="fn__flex-1">
              ${i18n.ideDockpanelBg}
              <div class="b3-label__text">${i18n.ideDockpanelBgTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-ide-dockpanel-bg">
              ${bgOptions}
            </select>
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-ide-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-ide-confirm">${i18n.confirm}</button>
  </div>`;
}
export function showIdeSettings(): void {
  const plugin = getPlugin();
  if (!plugin) return;
  const dialog = new Dialog({
    title: plugin.i18n.ideSettings || 'IDE Style Settings',
    content: buildSettingsHTML(plugin.i18n),
  });
  dialog.element.setAttribute('data-key', 'dialog-neo-ide-settings');
  dialog.element.classList.add('neo-settings-dialog');
  const bgSelect = dialog.element.querySelector('#neo-ide-dockpanel-bg') as HTMLSelectElement;
  if (bgSelect) bgSelect.value = ideDockpanelBg;
  dialog.element.querySelector('#neo-ide-cancel')?.addEventListener('click', () => dialog.destroy());
  dialog.element.querySelector('#neo-ide-confirm')?.addEventListener('click', () => {
    if (bgSelect) {
      const newBg = bgSelect.value as 'surface' | 'background';
      if (newBg !== ideDockpanelBg) {
        ideDockpanelBg = newBg;
        applyDockpanelBg();
        saveConfig({ 'ide-dockpanel-bg': newBg } as Partial<Config>);
      }
    }
    dialog.destroy();
  });
}
export function initIde(): void {
  if (isMobile()) return;
  (window as any).__neoOpenIdeSettings = showIdeSettings;
  loadConfig().then((config) => {
    ideDockpanelBg = config['ide-dockpanel-bg'] || 'surface';
    if (config['ide'] === true) {
      document.documentElement.classList.add('neo-ide');
      document.body.classList.add('neo-ide-body');
      applyDockpanelBg();
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
      applyDockpanelBg();
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
  document.body.classList.remove('neo-dockl-not-expand', 'neo-dockr-not-expand', 'neo-dockl-expand', 'neo-dockr-expand', 'neo-dockb-expand', 'neo-dockb-not-expand', 'neo-dockl-float', 'neo-dockl-not-float', 'neo-dockr-float', 'neo-dockr-not-float', 'neo-dockb-float', 'neo-dockb-not-float');
  document.body.classList.remove('neo-ide-body', 'neo-ide-dockpanel-bg-surface', 'neo-ide-dockpanel-bg-background');
  document.documentElement?.classList.remove('neo-ide');
}