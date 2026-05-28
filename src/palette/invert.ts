import { saveConfig } from '../main/data';
import type { Config } from '../main/data';
import { getCurrentThemeMode, getInvertKey } from './presets';
export function onInvertClick(): void {
  const html = document.documentElement;
  const enabled = html.classList.contains('neo-palette-invert');
  if (enabled) {
    html.classList.remove('neo-palette-invert');
  } else {
    html.classList.add('neo-palette-invert');
  }
  const mode = getCurrentThemeMode();
  const key = getInvertKey(mode);
  saveConfig({ [key]: !enabled } as Partial<Config>);
}
export function initInvert(config: Config): void {
  const mode = getCurrentThemeMode();
  const key = getInvertKey(mode);
  const enabled = config[key] ?? false;
  if (enabled) {
    document.documentElement.classList.add('neo-palette-invert');
  }
}
export function destroyInvert(): void {
  document.documentElement.classList.remove('neo-palette-invert');
}
