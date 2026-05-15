import { Plugin } from 'siyuan';
import { saveConfig } from '../main/data';
import type { Config } from '../main/data';
import { getCurrentThemeMode, getFollowTimeBaseColorKey } from './presets';
export async function switchToFollowTime(plugin: Plugin): Promise<void> {
  const mode = getCurrentThemeMode();
  const html = document.documentElement;
  html.className = html.className
    .split(' ')
    .filter((cls) => !cls.startsWith('neo-palette-'))
    .join(' ');
  html.classList.add('neo-palette-followtime');
  const patch: Partial<Config> = {};
  if (mode === 'dark') {
    patch['color-plan-dark'] = 'followtime';
  } else {
    patch['color-plan-light'] = 'followtime';
  }
  await saveConfig(plugin, patch);
}
export function initFollowTime(config: Config): void {
  const mode = getCurrentThemeMode();
  const plan = config[mode === 'dark' ? 'color-plan-dark' : 'color-plan-light'];
  if (plan === 'followtime') {
    const html = document.documentElement;
    html.className = html.className
      .split(' ')
      .filter((cls) => !cls.startsWith('neo-palette-'))
      .join(' ');
    html.classList.add('neo-palette-followtime');
  }
}
export function createFollowTimeColorPickerHTML(plugin?: Plugin): string {
  const currentColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--neo-followtime-base-color').trim() ||
    getComputedStyle(document.documentElement)
      .getPropertyValue('--neo-default-base-color').trim() ||
    '#ffffff';
  return `<input type="color" value="${currentColor}">`;
}
