import { destroyFollowBanner } from './customfollowbanner';
import { saveConfig } from '../main/data';
import type { Config } from '../main/data';
import { getCurrentThemeMode, getFollowTimeBaseColorKey } from './presets';
export function switchToFollowTime(plugin: any): void {
  destroyFollowBanner();
  const mode = getCurrentThemeMode();
  const html = document.documentElement;
  html.className = html.className
    .split(' ')
    .filter((cls) => !cls.startsWith('neo-palette-'))
    .join(' ');
  html.classList.add('neo-palette-followtime');
  const patch: Partial<Config> = {};
  if (mode === 'dark') {
    patch['color-plan-dark'] = 'followtime' as any;
  } else {
    patch['color-plan-light'] = 'followtime' as any;
  }
  saveConfig(plugin, patch);
}
export function initFollowTime(config: Config): void {
  const mode = getCurrentThemeMode();
  const plan = config[mode === 'dark' ? 'color-plan-dark' : 'color-plan-light'] as string | undefined;
  if (plan === 'followtime') {
    const html = document.documentElement;
    html.className = html.className
      .split(' ')
      .filter((cls) => !cls.startsWith('neo-palette-'))
      .join(' ');
    html.classList.add('neo-palette-followtime');
  }
}
export function createFollowTimeColorPickerHTML(plugin?: any): string {
  const currentColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--neo-followtime-base-color').trim() ||
    getComputedStyle(document.documentElement)
      .getPropertyValue('--neo-default-base-color').trim() ||
    '#ffffff';
  const callbackName = '__neoFollowTimeColorChange__';
  (window as any)[callbackName] = (value: string) => {
    document.documentElement.style.setProperty('--neo-followtime-base-color', value);
    if (plugin) {
      const mode = getCurrentThemeMode();
      const colorKey = getFollowTimeBaseColorKey(mode);
      const patch: Partial<Config> = { [colorKey]: value };
      if (mode === 'dark') {
        patch['color-plan-dark'] = 'followtime' as any;
      } else {
        patch['color-plan-light'] = 'followtime' as any;
      }
      saveConfig(plugin, patch);
    }
  };
  return `<input type="color" value="${currentColor}" oninput="window.${callbackName}(this.value)">`;
}
