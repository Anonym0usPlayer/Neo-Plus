import { Plugin } from 'siyuan';
export const configKey = 'config';
export interface Config {
  'custom-color-light'?: string;
  'custom-color-dark'?: string;
  'custom-saturation-light'?: number;
  'custom-saturation-dark'?: number;
  'preset-light'?: string;
  'preset-dark'?: string;
  'color-plan-light'?: 'preset' | 'custom' | 'followtime' | 'followbanner';
  'color-plan-dark'?: 'preset' | 'custom' | 'followtime' | 'followbanner';
  'followtime-base-color-light'?: string;
  'followtime-base-color-dark'?: string;
  'texture-light'?: string;
  'texture-dark'?: string;
  'customimage-url'?: string;
  'customimage-opacity'?: string;
  'customimage-blur'?: string;
  'customimage-frosted'?: string;
  'customimage-effect'?: string;
  'customimage-x'?: string;
  'customimage-y'?: string;
  'customimage-brightness'?: string;
  'customimage-saturation'?: string;
  'customimage-contrast'?: string;
  'customimage-grayscale'?: string;
  'customimage-hue-rotate'?: string;
  'customimage-preset-current-light'?: string;
  'customimage-preset-current-dark'?: string;
  'smooth-caret'?: boolean;
  'fluid-cursor'?: boolean;
  'list-bullet-line'?: boolean;
}
let configCache: Config = {};
export async function saveConfig(plugin: Plugin | undefined, patch: Partial<Config>): Promise<void> {
  if (!plugin) return;
  configCache = { ...configCache, ...patch };
  await plugin.saveData(configKey, configCache);
}
export function loadConfig(plugin: Plugin | undefined): Promise<Config> {
  if (!plugin) return Promise.resolve(configCache);
  return plugin.loadData(configKey).then((data: Config | null) => {
    configCache = data || {};
    return configCache;
  }).catch(() => {
    configCache = {};
    return configCache;
  });
}
export async function deleteConfigKeys(plugin: Plugin | undefined, keys: string[]): Promise<void> {
  if (!plugin) return;
  for (const k of keys) {
    delete (configCache as Record<string, any>)[k];
  }
  await plugin.saveData(configKey, configCache);
}
