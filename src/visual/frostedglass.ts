import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
import { Dialog } from 'siyuan';
import { getPlugin } from '../main/guard';
let frostedGlassMode: 'light' | 'global' = 'global';
function withViewTransition(callback: () => void): void {
    if (document.startViewTransition) {
        document.startViewTransition(callback);
    } else {
        callback();
    }
}
function applyModeClass(): void {
    const htmlEl = document.documentElement;
    htmlEl.classList.add('neo-visual-frostedglass');
    htmlEl.classList.toggle('neo-visual-frostedglass-global', frostedGlassMode === 'global');
}
export function createFrostedGlassLabelHTML(i18n: Record<string, string>): string {
    return `<span class="fn__flex fn__pointer">
    <span>${i18n.frostedGlass}</span>
    <span class="fn__space fn__flex-1 neo-menu-item-second-icon-space"></span>
    <svg class="b3-menu__icon neo-menu-item-second-icon ariaLabel" aria-label="${i18n.frostedGlassSettings}" onclick="event.stopPropagation();__neoOpenFrostedGlassSettings()"><use xlink:href="#iconSettings"></use></svg>
  </span>`;
}
function buildSettingsHTML(i18n: Record<string, string>): string {
    const modeOptions = ['light', 'global']
        .map(v => `<option value="${v}">${i18n[`frostedGlassMode${v.charAt(0).toUpperCase() + v.slice(1)}`]}</option>`)
        .join('');
    return `<div class="b3-dialog__content">
    <div class="config__tab-container">
      <div class="config-group">
        <div class="config-items">
          <label class="fn__flex b3-label">
            <div class="fn__flex-1">
              ${i18n.frostedGlassMode}
              <div class="b3-label__text">${i18n.frostedGlassModeTip}</div>
            </div>
            <span class="fn__space"></span>
            <select class="b3-select fn__flex-center fn__size200" id="neo-frosted-glass-scope">
              ${modeOptions}
            </select>
          </label>
        </div>
      </div>
    </div>
  </div>
  <div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" id="neo-frosted-glass-cancel">${i18n.cancel}</button>
    <span class="fn__space"></span>
    <button class="b3-button b3-button--text" id="neo-frosted-glass-confirm">${i18n.confirm}</button>
  </div>`;
}
export function showFrostedGlassSettings(): void {
    const plugin = getPlugin();
    if (!plugin) return;
    const dialog = new Dialog({
        title: plugin.i18n.frostedGlassSettings || 'Frosted Glass Settings',
        content: buildSettingsHTML(plugin.i18n),
    });
    dialog.element.setAttribute('data-key', 'dialog-neo-frosted-glass-settings');
    dialog.element.classList.add('neo-settings-dialog');
    const modeSelect = dialog.element.querySelector('#neo-frosted-glass-scope') as HTMLSelectElement;
    if (modeSelect) modeSelect.value = frostedGlassMode;
    dialog.element.querySelector('#neo-frosted-glass-cancel')?.addEventListener('click', () => dialog.destroy());
    dialog.element.querySelector('#neo-frosted-glass-confirm')?.addEventListener('click', () => {
        if (modeSelect) {
            const newMode = modeSelect.value as 'light' | 'global';
            if (newMode !== frostedGlassMode) {
                frostedGlassMode = newMode;
                applyModeClass();
                saveConfig({ 'frosted-glass-scope': newMode } as Partial<Config>);
            }
        }
        dialog.destroy();
    });
}
export function initFrostedGlass(): void {
    (window as any).__neoOpenFrostedGlassSettings = showFrostedGlassSettings;
    loadConfig().then((config) => {
        frostedGlassMode = config['frosted-glass-scope'] || 'global';
        if (config['frosted-glass'] === true) {
            applyModeClass();
        }
    });
}
export function onFrostedGlassClick(): void {
    const htmlEl = document.documentElement;
    const isActive = htmlEl.classList.contains('neo-visual-frostedglass');
    withViewTransition(() => {
        if (isActive) {
            destroyFrostedGlass();
            saveConfig({ 'frosted-glass': false } as Partial<Config>);
        } else {
            applyModeClass();
            saveConfig({ 'frosted-glass': true } as Partial<Config>);
        }
    });
}
export function destroyFrostedGlass(): void {
    document.documentElement?.classList.remove('neo-visual-frostedglass', 'neo-visual-frostedglass-global');
}
