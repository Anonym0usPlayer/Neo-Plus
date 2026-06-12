import { saveConfig } from '../main/data';
import type { Config } from '../main/data';
import { getCurrentThemeMode, getHighContrastKey } from './presets';
export function onHighContrastClick(): void {
  const html = document.documentElement;
  const enabled = html.classList.contains('neo-palette-highcontrast');
  const callback = () => {
    if (enabled) {
      html.classList.remove('neo-palette-highcontrast');
    } else {
      html.classList.add('neo-palette-highcontrast');
    }
  };
  if (document.startViewTransition) {
    document.startViewTransition(callback);
  } else {
    callback();
  }
  const mode = getCurrentThemeMode();
  const key = getHighContrastKey(mode);
  saveConfig({ [key]: !enabled } as Partial<Config>);
}
export function initHighContrast(config: Config): void {
  const mode = getCurrentThemeMode();
  const key = getHighContrastKey(mode);
  const enabled = config[key] ?? false;
  if (enabled) {
    document.documentElement.classList.add('neo-palette-highcontrast');
  }
}
export function destroyHighContrast(): void {
  document.documentElement.classList.remove('neo-palette-highcontrast');
}