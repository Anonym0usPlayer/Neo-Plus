import type { Config } from '../main/data';
import { isDesktop } from '../modules/env';
function getSystemAccentColor(): string | null {
  try {
    const remote = require('@electron/remote');
    const color = remote.systemPreferences.getAccentColor();
    if (color && typeof color === 'string') {
      return `#${color}`;
    }
  } catch (e) {
  }
  return null;
}
export function initFollowSystem(config: Config): void {
  if (!isDesktop()) return;
  const color = getSystemAccentColor();
  if (color) {
    document.documentElement.style.setProperty('--neo-followsystem-base-color', color);
  }
}
export function destroyFollowSystem(): void {
  document.documentElement.style.removeProperty('--neo-followsystem-base-color');
}
