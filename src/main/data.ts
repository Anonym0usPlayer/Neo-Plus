const DATA_KEY = 'config';
export interface Config {
  'custom-color-light'?: string;
  'custom-color-dark'?: string;
  'custom-saturation-light'?: number;
  'custom-saturation-dark'?: number;
  'preset-light'?: string;
  'preset-dark'?: string;
  'color-plan-light'?: 'preset' | 'custom';
  'color-plan-dark'?: 'preset' | 'custom';
}
let configCache: Config = {};
export function saveConfig(plugin: any, patch: Partial<Config>): void {
  configCache = { ...configCache, ...patch };
  plugin.saveData(DATA_KEY, configCache);
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