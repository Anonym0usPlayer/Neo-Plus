import { saveConfig } from '../main/data';
import type { Config } from '../main/data';
export type ThemeMode = 'light' | 'dark';
export type PresetMode = ThemeMode | 'all';
export interface Preset {
  key: string;
  nameKey: string;
  mode: PresetMode;
}
const presets: Preset[] = [
  { key: 'default', nameKey: 'colorSchemeDefault', mode: 'all' },
  { key: 'meridian', nameKey: 'colorSchemeMeridian', mode: 'all' },
  { key: 'amber',  nameKey: 'colorSchemeAmber',  mode: 'all' },
  { key: 'dusk',   nameKey: 'colorSchemeDusk',   mode: 'light' },
  { key: 'gingko',   nameKey: 'colorSchemeGingko',   mode: 'light' },
  { key: 'lavender', nameKey: 'colorSchemeLavender',  mode: 'all' },
  { key: 'midnight', nameKey: 'colorSchemeMidnight',  mode: 'dark' },
  { key: 'ocean',    nameKey: 'colorSchemeOcean',     mode: 'dark' },
  { key: 'opalite',  nameKey: 'colorSchemeOpalite',   mode: 'light' },
  { key: 'oxygen',   nameKey: 'colorSchemeOxygen',    mode: 'dark' },
  { key: 'sakura',   nameKey: 'colorSchemeSakura',    mode: 'light' },
  { key: 'twilight',   nameKey: 'colorSchemeTwilight',   mode: 'dark' },
  { key: 'wilderness', nameKey: 'colorSchemeWilderness', mode: 'all' },
  { key: 'everbliss', nameKey: 'colorSchemeEverbliss', mode: 'all' },
  { key: 'aerisland', nameKey: 'colorSchemeAerisland', mode: 'all' },
  { key: 'zerith', nameKey: 'colorSchemeZerith', mode: 'all' },
  { key: 'stellula', nameKey: 'colorSchemeStellula', mode: 'all' },
  { key: 'vael', nameKey: 'colorSchemeVael', mode: 'all' },
  { key: 'savor', nameKey: 'colorSchemeSavor', mode: 'all' },
  { key: 'sugar', nameKey: 'colorSchemeSugar', mode: 'light' },
  { key: 'salt', nameKey: 'colorSchemeSalt', mode: 'light' },
  { key: 'starry', nameKey: 'colorSchemeStarry', mode: 'dark' },
  { key: 'tundra', nameKey: 'colorSchemeTundra', mode: 'light' },
  { key: 'abyss', nameKey: 'colorSchemeAbyss', mode: 'dark' },
  { key: 'violet', nameKey: 'colorSchemeViolet', mode: 'light' },
  { key: 'titaniumspace', nameKey: 'colorSchemeTitaniumspace', mode: 'all' },
];
export function getPresetsByMode(mode: ThemeMode): Preset[] {
  return presets.filter((p) => p.mode === 'all' || p.mode === mode);
}
export function getCurrentThemeMode(): ThemeMode {
  const mode = document.documentElement.getAttribute('data-theme-mode');
  return mode === 'dark' ? 'dark' : 'light';
}
export function getCustomColorKey(mode: ThemeMode): 'custom-color-light' | 'custom-color-dark' {
  return mode === 'dark' ? 'custom-color-dark' : 'custom-color-light';
}
export function getSaturationKey(mode: ThemeMode): 'saturation-light' | 'saturation-dark' {
  return mode === 'dark' ? 'saturation-dark' : 'saturation-light';
}
export function getFollowTimeBaseColorKey(mode: ThemeMode): 'followtime-base-color-light' | 'followtime-base-color-dark' {
  return mode === 'dark' ? 'followtime-base-color-dark' : 'followtime-base-color-light';
}
export function getInvertKey(mode: ThemeMode): 'invert-light' | 'invert-dark' {
  return mode === 'dark' ? 'invert-dark' : 'invert-light';
}
export function getHighContrastKey(mode: ThemeMode): 'highcontrast-light' | 'highcontrast-dark' {
  return mode === 'dark' ? 'highcontrast-dark' : 'highcontrast-light';
}
export function getCurrentPlan(config: Config, mode: ThemeMode): 'preset' | 'custom' | 'followtime' | 'followbanner' | 'followsystem' | 'random' {
  return mode === 'dark'
    ? (config['color-plan-dark'] ?? 'preset')
    : (config['color-plan-light'] ?? 'preset');
}
export function getPresetKey(config: Config, mode: ThemeMode): string | undefined {
  return mode === 'dark' ? config['preset-dark'] : config['preset-light'];
}
function removePaletteClasses(html: HTMLElement): void {
  const classesToRemove = Array.from(html.classList).filter((cls) => cls.startsWith('neo-palette-'));
  html.classList.remove(...classesToRemove);
}
export function applyPreset(key: string): void {
  const mode = getCurrentThemeMode();
  const html = document.documentElement;
  removePaletteClasses(html);
  html.classList.add(`neo-palette-${key}`);
  const patch: Partial<Config> = {};
  if (mode === 'dark') {
    patch['color-plan-dark'] = 'preset';
    patch['preset-dark'] = key;
  } else {
    patch['color-plan-light'] = 'preset';
    patch['preset-light'] = key;
  }
  saveConfig(patch);
}
export function destroyPaletteClasses(): void {
  const html = document.documentElement;
  removePaletteClasses(html);
}
export function applyCurrentPlan(config: Config): void {
  const mode = getCurrentThemeMode();
  const plan = getCurrentPlan(config, mode);
  const html = document.documentElement;
  removePaletteClasses(html);
  if (plan === 'preset') {
    const presetKey = getPresetKey(config, mode);
    if (presetKey) {
      html.classList.add(`neo-palette-${presetKey}`);
    }
  } else if (plan === 'followtime') {
    html.classList.add('neo-palette-followtime');
  } else if (plan === 'followbanner') {
    html.classList.add('neo-palette-followbanner');
  } else if (plan === 'followsystem') {
    html.classList.add('neo-palette-followsystem');
  } else if (plan === 'random') {
    html.classList.add('neo-palette-random');
  } else {
    html.classList.add('neo-palette-custom');
  }
}
