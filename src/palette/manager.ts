import { getPlugin } from '../main/guard';
import { loadConfig, saveConfig } from '../main/data';
import type { Config } from '../main/data';
import {
  type ThemeMode,
  type Preset,
  getCurrentThemeMode,
  getPresetsByMode,
  getCurrentPlan,
  getCustomColorKey,
  getSaturationKey,
  getFollowTimeBaseColorKey,
  applyPreset,
  applyCurrentPlan,
  destroyPaletteClasses,
} from './presets';
import { initCustomColor, destroyCustomColor } from './customcolor';
import { initFollowTime, destroyFollowTime } from './followtime';
import { initFollowBanner, destroyFollowBanner } from './followbanner';
import { initFollowSystem, destroyFollowSystem } from './followsystem';
import { initSaturation, destroySaturation } from './saturation';
import { initInvert, destroyInvert } from './invert';
import { initRandom, destroyRandom } from './random';
export type { ThemeMode, Preset, Config };
type Plan = 'custom' | 'followtime' | 'followbanner' | 'followsystem' | 'random';
let _pendingPlan: string | null = null;
let _pendingPreset: string | null = null;
function initPlan(plan: Plan, config: Config): void {
  switch (plan) {
    case 'custom': initCustomColor(config); break;
    case 'followtime': initFollowTime(config); break;
    case 'followbanner': initFollowBanner(config); break;
    case 'followsystem': initFollowSystem(config); break;
    case 'random': initRandom(); break;
  }
}
function restorePalette(config: Config): void {
  const mode = getCurrentThemeMode();
  const plan = getCurrentPlan(config, mode);
  destroyRandom();
  destroyCustomColor();
  destroyFollowTime();
  destroyFollowBanner();
  destroyFollowSystem();
  destroySaturation();
  destroyInvert();
  applyCurrentPlan(config);
  if (plan !== 'preset') {
    initPlan(plan as Plan, config);
  }
  if (plan !== 'random') {
    initSaturation(config);
    initInvert(config);
  }
}
export function switchToPreset(key: string): void {
  _pendingPreset = key;
  destroyRandom();
  destroyCustomColor();
  destroyFollowTime();
  destroyFollowBanner();
  destroyFollowSystem();
  destroySaturation();
  destroyInvert();
  applyPreset(key);
  loadConfig().then((config) => {
    if (_pendingPreset !== key) return;
    _pendingPreset = null;
    initSaturation(config);
    initInvert(config);
  }).catch(() => {
    if (_pendingPreset === key) _pendingPreset = null;
  });
}
export function switchToPlan(plan: Plan): void {
  _pendingPlan = plan;
  const mode = getCurrentThemeMode();
  const configKey: 'color-plan-light' | 'color-plan-dark' = mode === 'dark' ? 'color-plan-dark' : 'color-plan-light';
  saveConfig({ [configKey]: plan }).then(() => {
    loadConfig().then((config) => {
      if (_pendingPlan !== plan) return;
      _pendingPlan = null;
      restorePalette(config);
    });
  }).catch(() => {
    if (_pendingPlan === plan) _pendingPlan = null;
  });
}
export function getPresetMenuItems(i18n: Record<string, string>): any[] {
  const mode = getCurrentThemeMode();
  const availablePresets = getPresetsByMode(mode);
  return availablePresets.map((preset) => ({
    id: `neo-palette-${preset.key}-button`,
    icon: 'iconNeoPalette',
    label: i18n[preset.nameKey],
    click: () => {
      switchToPreset(preset.key);
      return true;
    },
  }));
}
export function handleColorInput(value: string, cssVar: string, colorKey: string, plan: string): void {
  document.documentElement.style.setProperty(cssVar, value);
  const mode = getCurrentThemeMode();
  const configKey: 'color-plan-light' | 'color-plan-dark' = mode === 'dark' ? 'color-plan-dark' : 'color-plan-light';
  saveConfig({ [colorKey]: value, [configKey]: plan } as Partial<Config>);
}
let _menuListenerInitialized = false;
let _inputHandler: ((e: Event) => void) | null = null;
let _clickHandler: ((e: Event) => void) | null = null;
export function initPaletteMenuEvents(i18n: Record<string, string>): void {
  if (_menuListenerInitialized) return;
  _menuListenerInitialized = true;
  _inputHandler = (e: Event) => {
    const target = e.target as HTMLElement;
    const menuItem = target.closest('[data-id]') as HTMLElement | null;
    if (!menuItem) return;
    const dataId = menuItem.getAttribute('data-id');
    if (dataId === 'neo-custom-color-button' && target instanceof HTMLInputElement && target.type === 'color') {
      handleColorInput(target.value, '--neo-custom-base-color', getCustomColorKey(getCurrentThemeMode()), 'custom');
    } else if (dataId === 'neo-followtime-button' && target instanceof HTMLInputElement && target.type === 'color') {
      handleColorInput(target.value, '--neo-followtime-base-color', getFollowTimeBaseColorKey(getCurrentThemeMode()), 'followtime');
    } else if (dataId === 'neo-saturation-button' && target instanceof HTMLInputElement && target.type === 'range') {
      const num = parseFloat(target.value);
      document.documentElement.style.setProperty('--neo-saturation', target.value);
      const tooltip = target.closest('.b3-tooltips') as HTMLElement | null;
      if (tooltip) {
        const label = i18n.saturation ?? 'Saturation';
        tooltip.setAttribute('aria-label', `${label}：${num.toFixed(2)}`);
      }
      const mode = getCurrentThemeMode();
      const satKey = getSaturationKey(mode);
      saveConfig({ [satKey]: num } as Partial<Config>);
    }
  };
  _clickHandler = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target instanceof HTMLInputElement && target.type === 'color') {
      e.stopPropagation();
    }
  };
  document.addEventListener('input', _inputHandler, true);
  document.addEventListener('click', _clickHandler, true);
}
export function destroyPaletteMenuEvents(): void {
  if (_inputHandler) {
    document.removeEventListener('input', _inputHandler, true);
    _inputHandler = null;
  }
  if (_clickHandler) {
    document.removeEventListener('click', _clickHandler, true);
    _clickHandler = null;
  }
  _menuListenerInitialized = false;
}
export { createColorPickerHTML, getThemeColor } from './customcolor';
export { createSliderHTML } from './saturation';
export { createFollowTimeColorPickerHTML } from './followtime';
export { onInvertClick } from './invert';
let _mutationObserver: MutationObserver | null = null;
export function initPalette(): void {
  const plugin = getPlugin();
  if (!plugin) return;
  loadConfig().then((config) => {
    restorePalette(config);
    _mutationObserver = new MutationObserver(() => {
      loadConfig().then((config) => {
        restorePalette(config);
      });
    });
    _mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme-mode'],
    });
  });
}
export function destroyPalette(): void {
  destroyRandom();
  destroyCustomColor();
  destroyFollowTime();
  destroyFollowBanner();
  destroyFollowSystem();
  destroySaturation();
  destroyInvert();
  destroyPaletteClasses();
  destroyPaletteMenuEvents();
  if (_mutationObserver) {
    _mutationObserver.disconnect();
    _mutationObserver = null;
  }
}
