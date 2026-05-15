import { saveConfig } from '../main/data';
import type { Config } from '../main/data';
import { getCurrentThemeMode, getCustomColorKey } from './presets';
export function getThemeColor(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--neo-custom-base-color').trim() ||
         getComputedStyle(document.documentElement).getPropertyValue('--neo-default-base-color').trim() ||
         '#ffffff';
}
export function createColorPickerHTML(plugin?: any): string {
  const currentColor = getThemeColor();
  const callbackName = '__neoColorChange__';
  (window as any)[callbackName] = async (value: string) => {
    document.documentElement.style.setProperty('--neo-custom-base-color', value);
    if (plugin) {
      const mode = getCurrentThemeMode();
      const colorKey = getCustomColorKey(mode);
      const patch: Partial<Config> = { [colorKey]: value };
      if (mode === 'dark') {
        patch['color-plan-dark'] = 'custom';
      } else {
        patch['color-plan-light'] = 'custom';
      }
      await saveConfig(plugin, patch);
    }
  };
  return `<input type="color" value="${currentColor}" oninput="window.${callbackName}(this.value)">`;
}
