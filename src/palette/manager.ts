import { loadConfig } from '../main/data';
import type { Config } from '../main/data';
import presets, {
  type ThemeMode,
  type Preset,
  getCurrentThemeMode,
  getPresetsByMode,
  getCurrentPlan,
  getPresetKey,
  getCustomColorKey,
  getCustomSaturationKey,
  applyPreset,
  switchToCustom,
  applyCurrentPlan,
} from './presets';
import { createColorPickerHTML } from './customcolor';
import { createSliderHTML } from './customsaturation';
export type { ThemeMode, Preset, Config };
export { presets, getCurrentThemeMode, getPresetsByMode, getCurrentPlan, getPresetKey, applyCurrentPlan };
export function applyPresetAuto(key: string, plugin: any): void {
  const mode = getCurrentThemeMode();
  if (document.startViewTransition) {
    document.startViewTransition(() => {
      applyPreset(key, plugin, mode);
    });
  } else {
    applyPreset(key, plugin, mode);
  }
}
export function switchToCustomAuto(plugin: any): void {
  const mode = getCurrentThemeMode();
  if (document.startViewTransition) {
    document.startViewTransition(() => {
      switchToCustom(plugin, mode);
    });
  } else {
    switchToCustom(plugin, mode);
  }
}
export function getPresetMenuItems(i18n: Record<string, string>, plugin?: any): any[] {
  const mode = getCurrentThemeMode();
  const availablePresets = getPresetsByMode(mode);
  return availablePresets.map((preset) => ({
    id: `neo-palette-${preset.key}-button`,
    icon: 'iconNeoPalette',
    label: i18n[preset.nameKey] || preset.key,
    click: () => {
      applyPresetAuto(preset.key, plugin);
      return true;
    },
  }));
}
export { createColorPickerHTML, getThemeColor } from './customcolor';
export { createSliderHTML } from './customsaturation';
let _plugin: any;
let _mutationObserver: MutationObserver | null = null;
function applyConfigForCurrentMode(config: Config): void {
  const mode = getCurrentThemeMode();
  applyCurrentPlan(config, _plugin);
  const colorKey = getCustomColorKey(mode);
  const satKey = getCustomSaturationKey(mode);
  if (config[colorKey]) {
    document.documentElement.style.setProperty('--neo-custom-base-color', config[colorKey]!);
  }
  const saturation = config[satKey] ?? 1;
  document.documentElement.style.setProperty('--neo-custom-saturation', String(saturation));
}
export function loadAndApplyConfig(plugin: any): void {
  _plugin = plugin;
  loadConfig(plugin).then((config) => {
    applyConfigForCurrentMode(config);
    _mutationObserver = new MutationObserver(() => {
      loadConfig(plugin).then((config) => {
        if (document.startViewTransition) {
          document.startViewTransition(() => {
            applyConfigForCurrentMode(config);
          });
        } else {
          applyConfigForCurrentMode(config);
        }
      });
    });
    _mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme-mode'],
    });
  });
}
export function destroyPluginEffects(): void {
  const html = document.documentElement;
  html.className = html.className
    .split(' ')
    .filter((cls) => !cls.startsWith('neo-palette-'))
    .join(' ');
  html.style.removeProperty('--neo-custom-base-color');
  html.style.removeProperty('--neo-custom-saturation');
  if (_mutationObserver) {
    _mutationObserver.disconnect();
    _mutationObserver = null;
  }
  _plugin = undefined;
}
