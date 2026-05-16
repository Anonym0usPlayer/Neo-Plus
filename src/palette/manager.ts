import { getPlugin } from '../main/guard';
import { loadConfig } from '../main/data';
import type { Config } from '../main/data';
import presets, {
  type ThemeMode,
  type Preset,
  getCurrentThemeMode,
  getPresetsByMode,
  getCurrentPlan,
  getCustomColorKey,
  getCustomSaturationKey,
  getFollowTimeBaseColorKey,
  applyPreset,
  switchToCustom,
  applyCurrentPlan,
} from './presets';
import { switchToFollowTime, initFollowTime } from './customfollowtime';
import { switchToFollowBanner, initFollowBanner, destroyFollowBanner } from './customfollowbanner';
export type { ThemeMode, Preset, Config };
export function applyPresetAuto(key: string): void {
  const mode = getCurrentThemeMode();
  destroyFollowBanner();
  if (document.startViewTransition) {
    document.startViewTransition(() => {
      applyPreset(key, mode);
    });
  } else {
    applyPreset(key, mode);
  }
}
export function switchToCustomAuto(): void {
  const mode = getCurrentThemeMode();
  destroyFollowBanner();
  if (document.startViewTransition) {
    document.startViewTransition(() => {
      switchToCustom(mode);
    });
  } else {
    switchToCustom(mode);
  }
}
export function switchToFollowTimeAuto(): void {
  destroyFollowBanner();
  if (document.startViewTransition) {
    document.startViewTransition(() => {
      switchToFollowTime();
    });
  } else {
    switchToFollowTime();
  }
}
export function switchToFollowBannerAuto(): void {
  if (document.startViewTransition) {
    document.startViewTransition(() => {
      switchToFollowBanner();
    });
  } else {
    switchToFollowBanner();
  }
}
export function getPresetMenuItems(i18n: Record<string, string>): any[] {
  const mode = getCurrentThemeMode();
  const availablePresets = getPresetsByMode(mode);
  return availablePresets.map((preset) => ({
    id: `neo-palette-${preset.key}-button`,
    icon: 'iconNeoPalette',
    label: i18n[preset.nameKey],
    click: () => {
      applyPresetAuto(preset.key);
      return true;
    },
  }));
}
export { createColorPickerHTML, getThemeColor } from './customcolor';
export { createSliderHTML } from './customsaturation';
export { createFollowTimeColorPickerHTML } from './customfollowtime';
let _mutationObserver: MutationObserver | null = null;
function applyConfigForCurrentMode(config: Config): void {
  const mode = getCurrentThemeMode();
  const plan = getCurrentPlan(config, mode);
  if (plan !== 'followbanner') {
    destroyFollowBanner();
  }
  applyCurrentPlan(config);
  if (plan === 'followtime') {
    initFollowTime(config);
  } else if (plan === 'followbanner') {
    initFollowBanner(config);
  }
  const colorKey = getCustomColorKey(mode);
  const satKey = getCustomSaturationKey(mode);
  if (config[colorKey]) {
    document.documentElement.style.setProperty('--neo-custom-base-color', config[colorKey]!);
  }
  const saturation = config[satKey] ?? 1;
  document.documentElement.style.setProperty('--neo-custom-saturation', String(saturation));
  const followtimeColorKey = getFollowTimeBaseColorKey(mode);
  const followtimeColor = config[followtimeColorKey as keyof Config] as string | undefined;
  if (followtimeColor) {
    document.documentElement.style.setProperty('--neo-followtime-base-color', followtimeColor);
  }
}
export function initPalette(): void {
  const plugin = getPlugin();
  if (!plugin) return;
  loadConfig().then((config) => {
    applyConfigForCurrentMode(config);
    _mutationObserver = new MutationObserver(() => {
      loadConfig().then((config) => {
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
export function destroyPalette(): void {
  const html = document.documentElement;
  html.className = html.className
    .split(' ')
    .filter((cls) => !cls.startsWith('neo-palette-'))
    .join(' ');
  html.style.removeProperty('--neo-custom-base-color');
  html.style.removeProperty('--neo-custom-saturation');
  html.style.removeProperty('--neo-followtime-base-color');
  html.style.removeProperty('--neo-followbanner-base-color');
  destroyFollowBanner();
  if (_mutationObserver) {
    _mutationObserver.disconnect();
    _mutationObserver = null;
  }
}
