import { Plugin } from 'siyuan';
export function createSliderHTML(plugin?: Plugin, i18n?: Record<string, string>): string {
  const label = i18n?.customSaturation ?? 'Saturation';
  let currentValue = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--neo-custom-saturation').trim());
  if (isNaN(currentValue)) currentValue = 1;
  const id = `neo-saturation-slider-${Date.now()}`;
  return `<div style="display:flex;align-items:center;width:100%;">
    <svg class="b3-menu__icon"><use xlink:href="#iconNeoSaturation"></use></svg>
    <div aria-label="${label}：${currentValue.toFixed(2)}" class="b3-tooltips b3-tooltips__n" id="${id}" style="flex:1;">
      <input type="range" class="b3-slider" id="${id}-input" min="0" max="3" value="${currentValue}" step="0.01">
    </div>
  </div>`;
}
