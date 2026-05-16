import { Plugin } from 'siyuan';
import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
import { toggleCustomImage, showCustomImageSettings, applyCustomImageCss, clearCustomImageCss } from './customimage';
export interface Texture {
  key: string;
  nameKey: string;
}
const textures: Texture[] = [
  { key: 'paper', nameKey: 'texturePaper' },
  { key: 'noise', nameKey: 'textureNoise' },
  { key: 'acrylic', nameKey: 'textureAcrylic' },
  { key: 'checkerboard', nameKey: 'textureCheckerboard' },
  { key: 'grid', nameKey: 'textureGrid' },
  { key: 'crossdot', nameKey: 'textureCrossdot' },
  { key: 'wood', nameKey: 'textureWood' },
  { key: 'camouflage', nameKey: 'textureCamouflage' },
  { key: 'customimage', nameKey: 'textureCustomImage' },
];
export { textures };
function getCurrentThemeMode(): 'light' | 'dark' {
  const mode = document.documentElement.getAttribute('data-theme-mode');
  return mode === 'dark' ? 'dark' : 'light';
}
export function getTextureKey(mode: 'light' | 'dark'): 'texture-light' | 'texture-dark' {
  return mode === 'dark' ? 'texture-dark' : 'texture-light';
}
function buildTextureMenuItem(texture: Texture, i18n: Record<string, string>, plugin?: Plugin): any {
  return {
    id: `neo-texture-${texture.key}-button`,
    icon: 'iconNeoTexture',
    label: i18n[texture.nameKey],
    click: () => {
      const html = document.documentElement;
      const className = `neo-texture-${texture.key}`;
      if (texture.key === 'customimage') {
        const isActive = html.classList.contains(className);
        if (isActive) {
          toggleCustomImage(plugin, false);
        } else {
          html.className = html.className
            .split(' ')
            .filter((cls) => !cls.startsWith('neo-texture-'))
            .join(' ');
          toggleCustomImage(plugin, true);
          showCustomImageSettings(plugin);
        }
        return true;
      }
      if (html.classList.contains(className)) {
        html.classList.remove(className);
        if (plugin) {
          const mode = getCurrentThemeMode();
          const texKey = getTextureKey(mode);
          saveConfig(plugin, { [texKey]: 'none' } as Partial<Config>);
        }
      } else {
        html.className = html.className
          .split(' ')
          .filter((cls) => !cls.startsWith('neo-texture-'))
          .join(' ');
        html.classList.add(className);
        if (plugin) {
          const mode = getCurrentThemeMode();
          const texKey = getTextureKey(mode);
          saveConfig(plugin, { [texKey]: texture.key } as Partial<Config>);
        }
      }
      return true;
    },
  };
}
export function getTextureMenuItems(i18n: Record<string, string>, plugin?: Plugin): any[] {
  const customimageItem = buildTextureMenuItem(
    textures.find(t => t.key === 'customimage')!,
    i18n, plugin,
  );
  const otherItems = textures
    .filter(t => t.key !== 'customimage')
    .map(t => buildTextureMenuItem(t, i18n, plugin));
  return [
    customimageItem,
    { type: 'separator' },
    ...otherItems,
  ];
}
export function applyTexture(config: Config): void {
  const mode = getCurrentThemeMode();
  const texKey = getTextureKey(mode);
  const textureKey = config[texKey];
  const html = document.documentElement;
  html.className = html.className
    .split(' ')
    .filter((cls) => !cls.startsWith('neo-texture-'))
    .join(' ');
  if (textureKey && textureKey !== 'none') {
    if (textureKey === 'customimage') {
      html.classList.add('neo-texture-customimage');
      const currentKey = mode === 'dark' ? 'customimage-preset-current-dark' : 'customimage-preset-current-light';
      const presetName = config[currentKey as keyof Config] as string | undefined;
      if (presetName) {
        const presetKey = `customimage-preset-${presetName}` as keyof Config;
        const preset = config[presetKey] as Record<string, any> | undefined;
        if (preset && typeof preset === 'object') {
          applyCustomImageCss(preset);
        } else {
          clearCustomImageCss();
        }
      } else {
        clearCustomImageCss();
      }
    } else {
      html.classList.add(`neo-texture-${textureKey}`);
    }
  }
}
let _plugin: Plugin | undefined;
let _mutationObserver: MutationObserver | null = null;
export function initTexture(plugin: Plugin): void {
  _plugin = plugin;
  loadConfig(plugin).then((config) => {
    applyTexture(config);
    _mutationObserver = new MutationObserver(() => {
      loadConfig(plugin).then((config) => {
        applyTexture(config);
      });
    });
    _mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme-mode'],
    });
  });
}
export function destroyTexture(): void {
  const html = document.documentElement;
  html.className = html.className
    .split(' ')
    .filter((cls) => !cls.startsWith('neo-texture-'))
    .join(' ');
  clearCustomImageCss();
  if (_mutationObserver) {
    _mutationObserver.disconnect();
    _mutationObserver = null;
  }
  _plugin = undefined;
}
