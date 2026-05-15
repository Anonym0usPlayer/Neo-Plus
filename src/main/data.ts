const DATA_KEY = 'config';
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
}
let configCache: Config = {};
export async function saveConfig(plugin: any, patch: Partial<Config>): Promise<void> {
  configCache = { ...configCache, ...patch };
  await plugin.saveData(DATA_KEY, configCache);
}
export function loadConfig(plugin: any): Promise<Config> {
  return plugin.loadData(DATA_KEY).then((data: Config | null) => {
    configCache = data || {};
    return configCache;
  }).catch(() => {
    configCache = {};
    return configCache;
  });
}
export async function deleteConfigKeys(plugin: any, keys: string[]): Promise<void> {
  for (const k of keys) {
    delete (configCache as any)[k];
  }
  await plugin.saveData(DATA_KEY, configCache);
}
