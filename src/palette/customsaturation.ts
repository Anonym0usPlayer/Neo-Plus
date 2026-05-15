import { saveConfig } from '../main/data';
import type { Config } from '../main/data';
import { getCurrentThemeMode, getCustomSaturationKey } from './presets';
export function createSliderHTML(plugin?: any, i18n?: Record<string, string>): string {
  const label = i18n?.customSaturation ?? 'Saturation';
  let currentValue = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--neo-custom-saturation').trim());
  if (isNaN(currentValue)) currentValue = 1;
  const callbackName = '__neoSaturationChange__';
  (window as any)[callbackName] = (value: string) => {
    const num = parseFloat(value);
    document.documentElement.style.setProperty('--neo-custom-saturation', value);
    updateTooltip(num);
    if (plugin) {
      const mode = getCurrentThemeMode();
      const satKey = getCustomSaturationKey(mode);
      saveConfig(plugin, { [satKey]: num } as Partial<Config>);
    }
  };
  const id = `__neo_slider_${Date.now()}`;
  function updateTooltip(value: number) {
    const div = document.getElementById(id);
    if (div) {
      div.setAttribute('aria-label', `${label}：${value.toFixed(2)}`);
    }
  }
  return `<div style="display:flex;align-items:center;width:100%;">
    <svg class="b3-menu__icon"><use xlink:href="#iconNeoSaturation"></use></svg>
    <div aria-label="${label}：${currentValue.toFixed(2)}" class="b3-tooltips b3-tooltips__n" id="${id}" style="flex:1;">
      <input type="range" class="b3-slider" min="0" max="3" value="${currentValue}" step="0.01" oninput="window.${callbackName}(this.value)">
    </div>
  </div>`;
}
