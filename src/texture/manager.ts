import { getCurrentThemeMode } from '../palette/presets';
import { saveConfig } from '../main/data';
import type { Config } from '../main/data';
import { toggleCustomImage, showCustomImageSettings, applyCustomImageCss } from './customimage';
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
export function getTextureKey(mode: 'light' | 'dark'): 'texture-light' | 'texture-dark' {
  return mode === 'dark' ? 'texture-dark' : 'texture-light';
}
function buildTextureMenuItem(texture: Texture, i18n: Record<string, string>, plugin?: any): any {
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
export function getTextureMenuItems(i18n: Record<string, string>, plugin?: any): any[] {
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
      const presetName = (config as any)[currentKey] as string | undefined;
      if (presetName) {
        const preset = (config as any)[`customimage-preset-${presetName}`] as Record<string, any> | undefined;
        if (preset && typeof preset === 'object') {
          const merged = { ...config as any };
          for (const k of Object.keys(preset)) {
            if (k.startsWith('customimage-')) merged[k] = preset[k];
          }
          applyCustomImageCss(merged);
        } else {
          applyCustomImageCss(config);
        }
      } else {
        applyCustomImageCss(config);
      }
    } else {
      html.classList.add(`neo-texture-${textureKey}`);
    }
  }
}
