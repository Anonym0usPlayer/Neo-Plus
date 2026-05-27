import { saveConfig } from '../main/data';
import type { Config } from '../main/data';
import { getCurrentThemeMode, getInvertKey } from './presets';
export function onInvertClick(): void {
  const html = document.documentElement;
  const enabled = html.classList.contains('neo-invert');
  const toggle = () => {
    if (enabled) {
      html.classList.remove('neo-invert');
    } else {
      html.classList.add('neo-invert');
    }
  };
  if (document.startViewTransition) {
    document.startViewTransition(toggle);
  } else {
    toggle();
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
    document.documentElement.classList.add('neo-invert');
  }
}
