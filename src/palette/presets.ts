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
];
export default presets;
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
export function getCustomSaturationKey(mode: ThemeMode): 'custom-saturation-light' | 'custom-saturation-dark' {
  return mode === 'dark' ? 'custom-saturation-dark' : 'custom-saturation-light';
}
export function getFollowTimeBaseColorKey(mode: ThemeMode): 'followtime-base-color-light' | 'followtime-base-color-dark' {
  return mode === 'dark' ? 'followtime-base-color-dark' : 'followtime-base-color-light';
}
export function getCurrentPlan(config: Config, mode: ThemeMode): 'preset' | 'custom' | 'followtime' | 'followbanner' {
  return mode === 'dark'
    ? (config['color-plan-dark'] ?? 'preset')
    : (config['color-plan-light'] ?? 'preset');
}
export function getPresetKey(config: Config, mode: ThemeMode): string | undefined {
  return mode === 'dark' ? config['preset-dark'] : config['preset-light'];
}
export async function applyPreset(key: string, mode?: ThemeMode): Promise<void> {
  const html = document.documentElement;
  html.className = html.className
    .split(' ')
    .filter((cls) => !cls.startsWith('neo-palette-'))
    .join(' ');
  html.classList.add(`neo-palette-${key}`);
  const patch: Partial<Config> = {};
  if (mode === 'dark') {
    patch['color-plan-dark'] = 'preset';
    patch['preset-dark'] = key;
  } else {
    patch['color-plan-light'] = 'preset';
    patch['preset-light'] = key;
  }
  await saveConfig(patch);
}
export async function switchToCustom(mode: ThemeMode): Promise<void> {
  const html = document.documentElement;
  html.className = html.className
    .split(' ')
    .filter((cls) => !cls.startsWith('neo-palette-'))
    .join(' ');
  html.classList.add('neo-palette-custom');
  const patch: Partial<Config> = {};
  if (mode === 'dark') {
    patch['color-plan-dark'] = 'custom';
  } else {
    patch['color-plan-light'] = 'custom';
  }
  await saveConfig(patch);
}
export function applyCurrentPlan(config: Config): void {
  const mode = getCurrentThemeMode();
  const plan = getCurrentPlan(config, mode);
  const html = document.documentElement;
  html.className = html.className
    .split(' ')
    .filter((cls) => !cls.startsWith('neo-palette-'))
    .join(' ');
  if (plan === 'preset') {
    const presetKey = getPresetKey(config, mode);
    if (presetKey) {
      html.classList.add(`neo-palette-${presetKey}`);
    }
  } else if (plan === 'followtime') {
    html.classList.add('neo-palette-followtime');
  } else if (plan === 'followbanner') {
    html.classList.add('neo-palette-followbanner');
  } else {
    html.classList.add('neo-palette-custom');
  }
}
