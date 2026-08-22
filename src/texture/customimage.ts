import { Dialog, showMessage } from 'siyuan';
import { getPlugin } from '../main/guard';
import { saveConfig, loadConfig, deleteConfigKeys } from '../main/data';
import type { Config } from '../main/data';
import { ensureCss, removeCssByPrefix } from '../modules/cssloader';
import { featureCss } from '../modules/csschunks';
export interface CustomImageField {
  configKey: string;
  cssVar: string;
  toCss: (raw: string | undefined) => string;
  inputId: string;
  tooltipId: string;
  event: 'input' | 'change';
  tooltipSuffix: string;
}
function isCssImageFunction(raw: string): boolean {
  if (!/^[\w-]+\(/.test(raw)) return false;
  let depth = 0;
  for (const ch of raw) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (depth < 0) return false;
  }
  return depth === 0;
}
const colorFnNames = ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklch', 'oklab', 'color', 'light-dark', 'color-mix'];
function isColorValue(raw: string): boolean {
  if (/^#[0-9a-fA-F]{3,8}$/.test(raw)) return true;
  const name = /^([\w-]+)\(/.exec(raw)?.[1];
  return !!name && colorFnNames.includes(name.toLowerCase());
}
function toImageValue(raw: string | undefined): { url: string; color: string } {
  const unset = { url: 'unset', color: 'unset' };
  if (!raw) return unset;
  const v = raw.trim().replace(/;+$/, '');
  if (!v) return unset;
  if (isColorValue(v)) return { url: 'unset', color: v };
  return { url: isCssImageFunction(v) ? v : `url(${v})`, color: 'unset' };
}
const fieldDefs: CustomImageField[] = [
  { configKey: 'customimage-url',        cssVar: '--neo-customimage-url',        toCss: raw => toImageValue(raw).url, inputId: 'neo-customimage-path',        tooltipId: '',                             event: 'input',  tooltipSuffix: ''   },
  { configKey: 'customimage-url',        cssVar: '--neo-customimage-color',      toCss: raw => toImageValue(raw).color, inputId: 'neo-customimage-path',      tooltipId: '',                             event: 'input',  tooltipSuffix: ''   },
  { configKey: 'customimage-blur',       cssVar: '--neo-customimage-blur',       toCss: raw => (raw ?? '0') + 'px',                                                                            inputId: 'neo-customimage-blur',           tooltipId: 'neo-customimage-blur-tooltip',          event: 'input',  tooltipSuffix: 'px' },
  { configKey: 'customimage-frosted',    cssVar: '--neo-customimage-frosted',    toCss: raw => raw === 'true' ? 'block' : 'none',                                                               inputId: 'neo-customimage-frosted',        tooltipId: '',                             event: 'change', tooltipSuffix: ''   },
  { configKey: 'customimage-x',          cssVar: '--neo-customimage-x',          toCss: raw => (raw ?? '50') + '%',                                                                            inputId: 'neo-customimage-x',              tooltipId: 'neo-customimage-x-tooltip',             event: 'input',  tooltipSuffix: '%'  },
  { configKey: 'customimage-y',          cssVar: '--neo-customimage-y',          toCss: raw => (raw ?? '50') + '%',                                                                            inputId: 'neo-customimage-y',              tooltipId: 'neo-customimage-y-tooltip',             event: 'input',  tooltipSuffix: '%'  },
  { configKey: 'customimage-opacity',    cssVar: '--neo-customimage-opacity',    toCss: raw => raw ?? '0.12',                                                                                  inputId: 'neo-customimage-opacity',        tooltipId: 'neo-customimage-opacity-tooltip',       event: 'input',  tooltipSuffix: ''   },
  { configKey: 'customimage-effect',     cssVar: '--neo-customimage-effect',     toCss: raw => raw ?? 'normal',                                                                                inputId: 'neo-customimage-effect',         tooltipId: '',                             event: 'change', tooltipSuffix: ''   },
  { configKey: 'customimage-brightness', cssVar: '--neo-customimage-brightness', toCss: raw => raw ?? '1',                                                                                    inputId: 'neo-customimage-brightness',     tooltipId: 'neo-customimage-brightness-tooltip',    event: 'input',  tooltipSuffix: ''   },
  { configKey: 'customimage-saturation', cssVar: '--neo-customimage-saturation', toCss: raw => raw ?? '1',                                                                                    inputId: 'neo-customimage-saturation',     tooltipId: 'neo-customimage-saturation-tooltip',    event: 'input',  tooltipSuffix: ''   },
  { configKey: 'customimage-contrast',   cssVar: '--neo-customimage-contrast',   toCss: raw => raw ?? '1',                                                                                    inputId: 'neo-customimage-contrast',       tooltipId: 'neo-customimage-contrast-tooltip',      event: 'input',  tooltipSuffix: ''   },
  { configKey: 'customimage-grayscale',  cssVar: '--neo-customimage-grayscale',  toCss: raw => raw ?? '0',                                                                                    inputId: 'neo-customimage-grayscale',      tooltipId: 'neo-customimage-grayscale-tooltip',     event: 'input',  tooltipSuffix: ''   },
  { configKey: 'customimage-hue-rotate', cssVar: '--neo-customimage-hue-rotate', toCss: raw => (raw ?? '0') + 'deg',                                                                         inputId: 'neo-customimage-hue-rotate',     tooltipId: 'neo-customimage-hue-rotate-tooltip',    event: 'input',  tooltipSuffix: 'deg'},
  { configKey: 'customimage-fill-mode', cssVar: '--neo-customimage-repeat',      toCss: raw => raw === 'tile' ? 'repeat' : 'no-repeat',                                                       inputId: 'neo-customimage-fill-mode',      tooltipId: '',                             event: 'change', tooltipSuffix: ''   },
  { configKey: 'customimage-fill-mode', cssVar: '--neo-customimage-size',        toCss: raw => raw === 'tile' ? 'auto' : 'cover',                                                             inputId: 'neo-customimage-fill-mode',      tooltipId: '',                             event: 'change', tooltipSuffix: ''   },
];
export function applyCustomImageCss(config?: Partial<Config> | null): void {
  const style = document.documentElement.style;
  for (const field of fieldDefs) {
    const raw = config?.[field.configKey as keyof Config] as string | undefined;
    style.setProperty(field.cssVar, field.toCss(raw));
  }
}
export function clearCustomImageCss(): void {
  const style = document.documentElement.style;
  for (const field of fieldDefs) style.removeProperty(field.cssVar);
}
const currentPresetKeyLight = 'customimage-preset-current-light';
const currentPresetKeyDark  = 'customimage-preset-current-dark';
function getPreset(config: Partial<Config> | null | undefined, name: string): Record<string, any> {
  if (!config || !name) return {};
  const raw = (config as Record<string, any>)[`customimage-preset-${name}`];
  return (raw && typeof raw === 'object') ? raw : {};
}
function getCurrentThemeMode(): 'light' | 'dark' {
  const mode = document.documentElement.getAttribute('data-theme-mode');
  return mode === 'dark' ? 'dark' : 'light';
}
function getCurrentPresetKey(): 'customimage-preset-current-light' | 'customimage-preset-current-dark' {
  return getCurrentThemeMode() === 'dark' ? currentPresetKeyDark : currentPresetKeyLight;
}
export async function toggleCustomImage(enabled: boolean): Promise<void> {
  const config = await loadConfig();
  if (enabled) {
    document.documentElement.classList.add('neo-texture-customimage');
    removeCssByPrefix('texture-');
    ensureCss('texture-customimage', featureCss['texture-customimage']);
    const key = getCurrentPresetKey();
    const name = (config?.[key] as string) || '';
    const preset = getPreset(config, name);
    applyCustomImageCss(preset);
    const mode = getCurrentThemeMode();
    await saveConfig({ [mode === 'dark' ? 'texture-dark' : 'texture-light']: 'customimage' } as Partial<Config>);
    document.documentElement.classList.remove(
      ...Array.from(document.documentElement.classList).filter(cls => cls.startsWith('neo-texture-') && cls !== 'neo-texture-customimage')
    );
  } else {
    document.documentElement.classList.remove('neo-texture-customimage');
    removeCssByPrefix('texture-');
    clearCustomImageCss();
    const mode = getCurrentThemeMode();
    await saveConfig({ [mode === 'dark' ? 'texture-dark' : 'texture-light']: 'none' } as Partial<Config>);
  }
}
interface SliderConfig {
  id: string;
  tooltipId: string;
  i18nKey: string;
  i18nTipKey: string;
  min: number;
  max: number;
  step: number;
  val: number | string;
  suffix: string;
  tooltipSuffix: string;
  className: string;
}
const sliderDefs = [
  { key: 'customimage-opacity',    defaultVal: 0.12, min: 0, max: 0.8, step: 0.01, suffix: ''   },
  { key: 'customimage-blur',       defaultVal: 0,    min: 0, max: 50,  step: 1,    suffix: 'px' },
  { key: 'customimage-x',          defaultVal: 50,   min: 0, max: 100, step: 1,    suffix: '%'  },
  { key: 'customimage-y',          defaultVal: 50,   min: 0, max: 100, step: 1,    suffix: '%'  },
  { key: 'customimage-brightness', defaultVal: 1,    min: 0.5, max: 1.5, step: 0.01, suffix: ''   },
  { key: 'customimage-saturation', defaultVal: 1,    min: 0, max: 2,   step: 0.01, suffix: ''   },
  { key: 'customimage-contrast',   defaultVal: 1,    min: 0, max: 2,   step: 0.01, suffix: ''   },
  { key: 'customimage-grayscale',  defaultVal: 0,    min: 0, max: 1,   step: 0.01, suffix: ''   },
  { key: 'customimage-hue-rotate', defaultVal: 0,    min: 0, max: 360, step: 1,    suffix: 'deg'},
];
function getSliderConfig(key: string): SliderConfig | null {
  const def = sliderDefs.find(d => d.key === key);
  if (!def) return null;
  const i18nMap: Record<string, string> = {
    'customimage-x': 'customimagePositionX',
    'customimage-y': 'customimagePositionY',
  };
  const i18nKey = i18nMap[key] || ('customimage' + key.replace('customimage-', '').replace(/(^\w|-\w)/g, s => s.replace('-', '').toUpperCase()));
  const field = fieldDefs.find(f => f.configKey === key);
  const fallback = field ? field.toCss(undefined) : String(def.defaultVal);
  let val = fallback;
  if (def.suffix && fallback.endsWith(def.suffix)) val = fallback.slice(0, -def.suffix.length);
  return {
    id: 'neo-' + key,
    tooltipId: 'neo-' + key + '-tooltip',
    i18nKey,
    i18nTipKey: 'customDefaultValue',
    min: def.min, max: def.max, step: def.step, val,
    suffix: def.suffix, tooltipSuffix: def.suffix,
    className: 'config__item-neo-' + key,
  };
}
function t(i18n: Record<string, string>, key: string): string {
  return i18n[key] || key;
}
function sliderHTML(i18n: Record<string, string>, sc: SliderConfig): string {
  return `<label class="fn__flex b3-label ${sc.className}">
    <div class="fn__flex-1">
      ${t(i18n, sc.i18nKey)}
      <div class="b3-label__text">${t(i18n, 'customDefaultValue')}${sc.val}${sc.tooltipSuffix}</div>
    </div>
    <span class="fn__space"></span>
    <div class="b3-tooltips b3-tooltips__n fn__flex-center" id="${sc.tooltipId}" aria-label="${sc.val}${sc.tooltipSuffix}">
      <input class="b3-slider fn__size200" id="${sc.id}" max="${sc.max}" min="${sc.min}" step="${sc.step}" type="range" value="${sc.val}">
    </div>
  </label>`;
}
function textFieldHTML(i18n: Record<string, string>, id: string, className: string, i18nKey: string, i18nTipKey: string, multiline = false): string {
  if (multiline) {
    return `<div class="b3-label config-item ${className}" data-config-item-id="${id}">
    <div class="fn__block">
        <div class="config-name">${t(i18n, i18nKey)}</div>
        <div class="b3-label__text">${t(i18n, i18nTipKey)}</div>
        <div class="fn__hr--small"></div>
        <textarea class="b3-text-field fn__block" id="${id}" spellcheck="true"></textarea>
    </div>
</div>`;
  }
  return `<label class="fn__flex b3-label ${className}">
    <div class="fn__flex-1">
      ${t(i18n, i18nKey)}
      <div class="b3-label__text">${t(i18n, i18nTipKey)}</div>
    </div>
    <span class="fn__space"></span>
    <input class="b3-text-field fn__flex-center fn__size200" id="${id}" spellcheck="false">
  </label>`;
}
function switchHTML(i18n: Record<string, string>, id: string, className: string, i18nKey: string, i18nTipKey: string): string {
  return `<label class="fn__flex b3-label ${className}">
    <div class="fn__flex-1">
      ${t(i18n, i18nKey)}
      <div class="b3-label__text">${t(i18n, i18nTipKey)}</div>
    </div>
    <span class="fn__space"></span>
    <input class="b3-switch fn__flex-center" id="${id}" type="checkbox">
  </label>`;
}
function effectSelectHTML(i18n: Record<string, string>, id: string, className: string, i18nKey: string): string {
  const opts = ['normal', 'multiply', 'luminosity', 'screen', 'color', 'overlay', 'soft-light', 'color-burn', 'color-dodge']
    .map(v => `<option value="${v}">${t(i18n, `customimageEffect${v.charAt(0).toUpperCase() + v.slice(1).replace(/-(\w)/g, (_, c) => c.toUpperCase())}`)}</option>`)
    .join('');
  return `<label class="fn__flex b3-label ${className}">
    <div class="fn__flex-1">
      ${t(i18n, i18nKey)}
      <div class="b3-label__text">${t(i18n, 'customDefaultValue')}${t(i18n, 'customimageEffectNormal')}</div>
    </div>
    <span class="fn__space"></span>
    <select class="b3-select fn__flex-center fn__size200" id="${id}">${opts}</select>
  </label>`;
}
function fillModeSelectHTML(i18n: Record<string, string>, id: string, className: string, i18nKey: string): string {
  const opts = ['scale', 'tile']
    .map(v => `<option value="${v}">${t(i18n, `customimageFillMode${v.charAt(0).toUpperCase() + v.slice(1)}`)}</option>`)
    .join('');
  return `<label class="fn__flex b3-label ${className}">
    <div class="fn__flex-1">
      ${t(i18n, i18nKey)}
      <div class="b3-label__text">${t(i18n, 'customDefaultValue')}${t(i18n, 'customimageFillModeScale')}</div>
    </div>
    <span class="fn__space"></span>
    <select class="b3-select fn__flex-center fn__size200" id="${id}">${opts}</select>
  </label>`;
}
function buildSettingsHTML(i18n: Record<string, string>): string {
  const basicSliderKeys = ['customimage-blur'];
  const basicSliders = basicSliderKeys.map(k => sliderHTML(i18n, getSliderConfig(k)!)).join('');
  const opacitySlider = sliderHTML(i18n, getSliderConfig('customimage-opacity')!);
  const effectSelect = effectSelectHTML(i18n, 'neo-customimage-effect', 'config__item-neo-customimage-effect', 'customimageEffect');
  const frosted = switchHTML(i18n, 'neo-customimage-frosted', 'config__item-neo-customimage-frosted', 'customimageFrosted', 'customimageFrostedTip');
  const positionSliderKeys = ['customimage-x', 'customimage-y'];
  const positionSliders = positionSliderKeys.map(k => sliderHTML(i18n, getSliderConfig(k)!)).join('');
  const moreSliderKeys = ['customimage-hue-rotate', 'customimage-brightness', 'customimage-saturation', 'customimage-contrast', 'customimage-grayscale'];
  const moreSliders = moreSliderKeys.map(k => sliderHTML(i18n, getSliderConfig(k)!)).join('');
  return `<div class="b3-dialog__content">
  <div class="config__tab-container">
    <div class="config-group">
      <div class="config-title">${t(i18n, 'customimagePresetTip')}</div>
      <div class="config-items">
        <label class="fn__flex b3-label">
          <div class="fn__flex-1">
            ${t(i18n, 'customimagePresetSelect')}
            <div class="b3-label__text">${t(i18n, 'customimagePresetSelectTip')}</div>
          </div>
          <span class="fn__space"></span>
          <select class="b3-select fn__flex-center fn__size200" id="neo-customimage-preset-select">
          </select>
        </label>
      </div>
    </div>
    <div class="config-group">
      <div class="config-title">${t(i18n, 'customimageImageInfo')}</div>
      <div class="config-items">
        ${textFieldHTML(i18n, 'neo-customimage-path', 'config__item-neo-customimage-path', 'customimagePath', 'customimagePathTip', true)}
      </div>
    </div>
    <div class="config-group">
      <div class="config-title">${t(i18n, 'customimageBasicParams')}</div>
      <div class="config-items">
        ${fillModeSelectHTML(i18n, 'neo-customimage-fill-mode', 'config__item-neo-customimage-fill-mode', 'customimageFillMode')}
        ${basicSliders}
        ${opacitySlider}
        ${effectSelect}
        ${frosted}
        ${positionSliders}
      </div>
    </div>
    <div class="config-group">
      <div class="config-title">${t(i18n, 'customimageMoreParams')}</div>
      <div class="config-items">
        ${moreSliders}
      </div>
    </div>
  </div>
</div>
<div class="b3-dialog__action">
  <button class="b3-button b3-button--cancel" id="neo-customimage-cancel">${t(i18n, 'cancel')}</button>
  <span class="fn__space"></span>
  <button class="b3-button b3-button--remove" id="neo-customimage-delete-preset">${t(i18n, 'customimageDeletePreset')}</button>
  <span class="fn__space"></span>
  <button class="b3-button" id="neo-customimage-new-preset">${t(i18n, 'customimageNewPreset')}</button>
  <span class="fn__space"></span>
  <button class="b3-button b3-button--text" id="neo-customimage-update-preset">${t(i18n, 'customimageUpdateApply')}</button>
</div>`;
}
export function showCustomImageSettings(): void {
  const plugin = getPlugin();
  if (!plugin) return;
  const dialog = new Dialog({
    title: `<div class="fn__flex">
    <div class="fn__ellipsis" style="white-space: nowrap">${plugin.i18n.customimageSettings || 'Custom Image Settings'}</div>
    <div class="fn__space"></div>
    <button class="b3-button b3-button--small fn__flex-center" id="neo-customimage-reset-preset">${plugin.i18n.customimageResetPreset}</button>
    <span class="fn__space" style="width: 8px"></span>
    <button class="b3-button b3-button--small fn__flex-center" id="neo-customimage-save-preset">${plugin.i18n.customimageSavePreset}</button>
  </div>`,
    content: buildSettingsHTML(plugin.i18n),
  });
  const container = dialog.element.querySelector('.b3-dialog__container') as HTMLElement;
  dialog.element.setAttribute('data-key', 'dialog-neo-customimage-settings');
  dialog.element.classList.add('neo-settings-dialog');
  const presetSelect = dialog.element.querySelector('#neo-customimage-preset-select') as HTMLSelectElement | null;
  const fieldDom = fieldDefs.map(f => ({
    field: f,
    input: dialog.element.querySelector('#' + f.inputId) as HTMLInputElement | HTMLSelectElement | null,
    tooltip: f.tooltipId ? dialog.element.querySelector('#' + f.tooltipId) as HTMLElement | null : null,
  }));
  const buildPresetFromDom = (): Record<string, any> => {
    const preset: Record<string, any> = {};
    for (const { field, input } of fieldDom) {
      if (input) {
        let v: string;
        if (input instanceof HTMLInputElement && input.type === 'checkbox') v = input.checked ? 'true' : 'false';
        else v = (input as HTMLInputElement | HTMLSelectElement).value;
        preset[field.configKey] = v;
      }
    }
    return preset;
  };
  loadConfig().then(c => {
    populateDialog(c, presetSelect, fieldDom, plugin.i18n);
  }).catch(() => {});
  const style = document.documentElement.style;
  for (const { field, input, tooltip } of fieldDom) {
    if (!input) continue;
    input.addEventListener(field.event, () => {
      let v: string;
      if (input instanceof HTMLInputElement && input.type === 'checkbox') v = input.checked ? 'true' : 'false';
      else v = (input as HTMLInputElement | HTMLSelectElement).value;
      if (tooltip && field.tooltipSuffix !== undefined) tooltip.setAttribute('aria-label', v + field.tooltipSuffix);
      style.setProperty(field.cssVar, field.toCss(v));
    });
  }
  const btn = (id: string) => dialog.element.querySelector(id) as HTMLButtonElement | null;
  const resetFormToDefaults = (): void => {
    for (const { field, input, tooltip } of fieldDom) {
      if (!input) continue;
      if (field.configKey === 'customimage-url') {
        (input as HTMLInputElement).value = '';
        style.setProperty(field.cssVar, 'unset');
        continue;
      }
      if (field.configKey === 'customimage-fill-mode') continue;
      const def = field.toCss(undefined);
      let disp = def;
      if (input instanceof HTMLInputElement && input.type === 'checkbox') input.checked = def === 'block';
      else {
        if (field.tooltipSuffix && def.endsWith(field.tooltipSuffix)) disp = def.slice(0, -field.tooltipSuffix.length);
        (input as HTMLInputElement | HTMLSelectElement).value = disp;
      }
      if (tooltip && field.tooltipSuffix !== undefined) tooltip.setAttribute('aria-label', def);
      style.setProperty(field.cssVar, def);
    }
    const fillModeInput = dialog.element.querySelector('#neo-customimage-fill-mode') as HTMLSelectElement | null;
    if (fillModeInput) {
      fillModeInput.value = 'scale';
      style.setProperty('--neo-customimage-repeat', 'no-repeat');
      style.setProperty('--neo-customimage-size', 'cover');
    }
  };
  btn('#neo-customimage-reset-preset')?.addEventListener('click', resetFormToDefaults);
  const originalDestroy = dialog.destroy.bind(dialog);
  dialog.destroy = async () => {
    try {
      const c = await loadConfig();
      const mode = document.documentElement.getAttribute('data-theme-mode') === 'dark' ? 'dark' : 'light';
      const texKey = mode === 'dark' ? 'texture-dark' : 'texture-light';
      const textureKey = c?.[texKey as keyof Config] as string | undefined;
      const html = document.documentElement;
      html.classList.remove(
        ...Array.from(html.classList).filter(cls => cls.startsWith('neo-texture-'))
      );
      removeCssByPrefix('texture-');
      if (textureKey && textureKey !== 'none') {
        ensureCss(`texture-${textureKey}`, featureCss[`texture-${textureKey}`]);
        if (textureKey === 'customimage') {
          html.classList.add('neo-texture-customimage');
          const currentKey = mode === 'dark' ? 'customimage-preset-current-dark' : 'customimage-preset-current-light';
          const presetName = c?.[currentKey as keyof Config] as string | undefined;
          if (presetName) {
            const preset = getPreset(c, presetName);
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
          clearCustomImageCss();
        }
      } else {
        clearCustomImageCss();
      }
    } catch {}
    originalDestroy();
  };
  btn('#neo-customimage-cancel')?.addEventListener('click', () => dialog.destroy());
  btn('#neo-customimage-delete-preset')?.addEventListener('click', async () => {
    if (!presetSelect) return;
    const name = presetSelect.value;
    if (!name) { showMessage(plugin.i18n.customimagePresetNotSelected || '未选择任何方案', 3000); return; }
    const cd = new Dialog({
      title: plugin.i18n.customimagePresetDeleteConfirmTitle,
      content: `<div class="b3-dialog__content">${plugin.i18n.customimagePresetDeleteConfirmContent?.replace('${name}', name)}</div><div class="b3-dialog__action"><button class="b3-button b3-button--cancel" id="ndc-cancel">${plugin.i18n.cancel}</button><span class="fn__space"></span><button class="b3-button b3-button--text" id="ndc-confirm">${plugin.i18n.confirm}</button></div>`,
    });
    cd.element.classList.add('neo-settings-dialog');
    cd.element.querySelector('#ndc-cancel')?.addEventListener('click', () => cd.destroy());
    cd.element.querySelector('#ndc-confirm')?.addEventListener('click', async () => {
      try {
        await saveConfig({ [getCurrentPresetKey()]: '' } as Partial<Config>);
        await deleteConfigKeys([`customimage-preset-${name}`]);
        const updatedCfg = await loadConfig();
        if (presetSelect) {
          Array.from(presetSelect.options).find(o => o.value === name)?.remove();
          presetSelect.value = '';
        }
        const otherKey = getCurrentPresetKey() === currentPresetKeyLight ? currentPresetKeyDark : currentPresetKeyLight;
        const patch: Record<string, any> = {};
        if ((updatedCfg as Record<string, any>)?.[otherKey] === name) patch[otherKey] = '';
        if (Object.keys(patch).length) await saveConfig(patch as Partial<Config>);
        populateDialog(updatedCfg, presetSelect, fieldDom, plugin.i18n);
        clearCustomImageCss();
        showMessage((plugin.i18n.customimagePresetDeleted || '').replace('${name}', name), 3000);
      } catch {} finally { cd.destroy(); }
    });
  });
  const savePresetToConfig = async (preset: Record<string, any>, presetName: string): Promise<void> => {
    const cfg = await loadConfig();
    const currentKey = getCurrentPresetKey();
    const patch: Record<string, any> = {
      [`customimage-preset-${presetName}`]: preset,
      [currentKey]: presetName,
    };
    await saveConfig(patch as Partial<Config>);
    applyCustomImageCss(preset);
  };
  btn('#neo-customimage-update-preset')?.addEventListener('click', async () => {
    if (!presetSelect) return;
    const name = presetSelect.value;
    if (!name) { showMessage(plugin.i18n.customimagePresetNotSelected || '未选择任何方案', 3000); return; }
    const preset = buildPresetFromDom();
    await savePresetToConfig(preset, name);
    showMessage((plugin.i18n.customimagePresetUpdated || '').replace('${name}', name), 3000);
    dialog.destroy();
  });
  const askPresetName = (title: string, onConfirm: (name: string) => Promise<boolean>): void => {
    const pd = new Dialog({
      title,
      content: `<div class="b3-dialog__content"><div class="fn__flex b3-label config__item"><div class="fn__flex-1">${plugin.i18n.customimagePresetName}<div class="b3-label__text">${plugin.i18n.customimagePresetNameTip}</div></div><span class="fn__space"></span><input class="b3-text-field fn__flex-center fn__size200" id="neo-customimage-preset-name" spellcheck="false"></div></div><div class="b3-dialog__action"><button class="b3-button b3-button--cancel" id="npc-cancel">${plugin.i18n.cancel}</button><span class="fn__space"></span><button class="b3-button b3-button--text" id="npc-confirm">${plugin.i18n.confirm}</button></div>`,
    });
    pd.element.classList.add('neo-settings-dialog');
    pd.element.querySelector('#npc-cancel')?.addEventListener('click', () => pd.destroy());
    pd.element.querySelector('#npc-confirm')?.addEventListener('click', async () => {
      const name = (pd.element.querySelector('#neo-customimage-preset-name') as HTMLInputElement)?.value?.trim();
      if (!name) { showMessage(plugin.i18n.customimagePresetNameEmpty, 3000); return; }
      if (['current', 'current-light', 'current-dark'].includes(name.toLowerCase())) {
        showMessage(plugin.i18n.customimagePresetNameReserved || 'Preset name cannot be "current"', 3000);
        return;
      }
      const saved = await onConfirm(name);
      if (saved) pd.destroy();
    });
  };
  const savePresetAs = async (name: string): Promise<boolean> => {
    const cfg = await loadConfig();
    const exists = (cfg as Record<string, any>)[`customimage-preset-${name}`] !== undefined;
    if (exists) {
      const confirmed = await new Promise<boolean>(resolve => {
        const cd = new Dialog({
          title: plugin.i18n.customimagePresetOverwriteTitle,
          content: `<div class="b3-dialog__content">${plugin.i18n.customimagePresetOverwriteContent?.replace('${name}', name)}</div><div class="b3-dialog__action"><button class="b3-button b3-button--cancel" id="npo-cancel">${plugin.i18n.cancel}</button><span class="fn__space"></span><button class="b3-button b3-button--text" id="npo-confirm">${plugin.i18n.confirm}</button></div>`,
        });
        cd.element.classList.add('neo-settings-dialog');
        const resolveFalse = () => resolve(false);
        const origDestroy = cd.destroy.bind(cd);
        cd.destroy = () => { resolveFalse(); origDestroy(); };
        cd.element.querySelector('#npo-cancel')?.addEventListener('click', () => cd.destroy());
        cd.element.querySelector('#npo-confirm')?.addEventListener('click', async () => {
          resolve(true);
          cd.destroy();
        });
      });
      if (!confirmed) return false;
    }
    const preset = buildPresetFromDom();
    await savePresetToConfig(preset, name);
    showMessage((plugin.i18n.customimagePresetSaved || '').replace('${name}', name), 3000);
    if (presetSelect && !Array.from(presetSelect.options).some(o => o.value === name)) {
      const opt = document.createElement('option'); opt.value = name; opt.textContent = name;
      presetSelect.appendChild(opt); presetSelect.value = name;
    }
    return true;
  };
  btn('#neo-customimage-save-preset')?.addEventListener('click', () => {
    askPresetName(plugin.i18n.customimageSavePresetTitle, savePresetAs);
  });
  btn('#neo-customimage-new-preset')?.addEventListener('click', () => {
    askPresetName(plugin.i18n.customimageNewPresetTitle, async (name) => {
      resetFormToDefaults();
      return savePresetAs(name);
    });
  });
  presetSelect?.addEventListener('change', async () => {
    const name = presetSelect.value;
    if (!name) return;
    try {
      const currentKey = getCurrentPresetKey();
      const patch: Record<string, any> = { [currentKey]: name };
      await saveConfig(patch as Partial<Config>);
      const updatedCfg = await loadConfig();
      const preset = getPreset(updatedCfg, name);
      populateDialog(updatedCfg, presetSelect, fieldDom, plugin.i18n);
      applyCustomImageCss(preset);
    } catch {}
  });
}
function populateDialog(
  config: Partial<Config> | null,
  presetSelect: HTMLSelectElement | null,
  fieldDom: Array<{ field: CustomImageField; input: HTMLInputElement | HTMLSelectElement | null; tooltip: HTMLElement | null }>,
  i18n: Record<string, string>,
): void {
  const currentKey = getCurrentPresetKey();
  const cpk = (config?.[currentKey] as string) || '';
  if (presetSelect) {
    presetSelect.innerHTML = '';
    if (config) Object.keys(config as Record<string, any>).forEach(k => {
      if (!k.startsWith('customimage-preset-') || k === currentPresetKeyLight || k === currentPresetKeyDark) return;
      const n = k.replace('customimage-preset-', '');
      if (n) {
        const o = document.createElement('option'); o.value = n; o.textContent = n;
        presetSelect.appendChild(o);
      }
    });
  }
  const presetAvailable = !!cpk && presetSelect !== null && Array.from(presetSelect.options).some(o => o.value === cpk);
  if (presetSelect) {
    if (presetAvailable) {
      presetSelect.value = cpk;
    } else {
      presetSelect.selectedIndex = -1;
    }
  }
  if (!presetAvailable) {
    for (const { field, input, tooltip } of fieldDom) {
      if (!input) continue;
      if (input instanceof HTMLInputElement && input.type === 'checkbox') input.checked = false;
      else (input as HTMLInputElement | HTMLSelectElement).value = '';
      if (tooltip && field.tooltipSuffix !== undefined) tooltip.setAttribute('aria-label', field.toCss(undefined));
    }
    return;
  }
  const preset = getPreset(config || null, cpk);
  for (const { field, input, tooltip } of fieldDom) {
    if (!input) continue;
    const raw = preset[field.configKey] as string | undefined;
    if (raw === undefined || raw === '') {
      if (field.configKey === 'customimage-url') (input as HTMLInputElement).value = '';
      continue;
    }
    if (input instanceof HTMLInputElement && input.type === 'checkbox') input.checked = raw === 'true';
    else (input as HTMLInputElement | HTMLSelectElement).value = raw;
    if (tooltip && field.tooltipSuffix !== undefined) tooltip.setAttribute('aria-label', raw + field.tooltipSuffix);
  }
}
