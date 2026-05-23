import { getPlugin } from './guard';
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
  'focus-block-indicator'?: boolean;
  'colored-folders'?: boolean;
  'colored-lists'?: boolean;
  'colored-headings'?: boolean;
  'scroll-effect'?: boolean;
}
let configCache: Config = {};
function getPluginOrNull() {
  return getPlugin();
}
export async function saveConfig(patch: Partial<Config>): Promise<void> {
  const plugin = getPluginOrNull();
  if (!plugin) return;
  configCache = { ...configCache, ...patch };
  await plugin.saveData(configKey, configCache);
}
export function loadConfig(): Promise<Config> {
  const plugin = getPluginOrNull();
  if (!plugin) return Promise.resolve(configCache);
  return plugin.loadData(configKey).then((data: Config | null) => {
    configCache = data || {};
    return configCache;
  }).catch(() => {
    configCache = {};
    return configCache;
  });
}
export async function deleteConfigKeys(keys: string[]): Promise<void> {
  const plugin = getPluginOrNull();
  if (!plugin) return;
  for (const k of keys) {
    delete (configCache as Record<string, any>)[k];
  }
  await plugin.saveData(configKey, configCache);
}
