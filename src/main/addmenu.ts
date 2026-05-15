import { Plugin, Menu } from 'siyuan';
import { createColorPickerHTML, createFollowTimeColorPickerHTML, createSliderHTML, getPresetMenuItems, switchToCustomAuto, switchToFollowTimeAuto, switchToFollowBannerAuto } from '../palette/manager';
import { getTextureMenuItems } from '../texture/manager';
import { onSmoothCaretClick } from '../expand/smoothcaret';
import { onFluidCursorClick } from '../expand/fluidcursor';
import { onListBulletLineClick } from '../expand/listbulletline';
import { saveConfig } from './data';
import type { Config } from './data';
import { getCurrentThemeMode, getCustomColorKey, getCustomSaturationKey, getFollowTimeBaseColorKey } from '../palette/presets';
let menuListenerInitialized = false;
function initMenuEventDelegation(plugin: Plugin, i18n: Record<string, string>): void {
  if (menuListenerInitialized) return;
  menuListenerInitialized = true;
  document.addEventListener('input', (e: Event) => {
    const target = e.target as HTMLElement;
    const menuItem = target.closest('[data-id]') as HTMLElement | null;
    if (!menuItem) return;
    const dataId = menuItem.getAttribute('data-id');
    if (dataId === 'neo-custom-color-button' && target instanceof HTMLInputElement && target.type === 'color') {
      const value = target.value;
      document.documentElement.style.setProperty('--neo-custom-base-color', value);
      const mode = getCurrentThemeMode();
      const colorKey = getCustomColorKey(mode);
      const patch: Partial<Config> = { [colorKey]: value };
      if (mode === 'dark') {
        patch['color-plan-dark'] = 'custom';
      } else {
        patch['color-plan-light'] = 'custom';
      }
      saveConfig(plugin, patch);
    } else if (dataId === 'neo-followtime-button' && target instanceof HTMLInputElement && target.type === 'color') {
      const value = target.value;
      document.documentElement.style.setProperty('--neo-followtime-base-color', value);
      const mode = getCurrentThemeMode();
      const colorKey = getFollowTimeBaseColorKey(mode);
      const patch: Partial<Config> = { [colorKey]: value };
      if (mode === 'dark') {
        patch['color-plan-dark'] = 'followtime';
      } else {
        patch['color-plan-light'] = 'followtime';
      }
      saveConfig(plugin, patch);
    } else if (dataId === 'neo-custom-saturation-button' && target instanceof HTMLInputElement && target.type === 'range') {
      const num = parseFloat(target.value);
      document.documentElement.style.setProperty('--neo-custom-saturation', target.value);
      const tooltip = target.closest('.b3-tooltips') as HTMLElement | null;
      if (tooltip) {
        const label = i18n.customSaturation ?? 'Saturation';
        tooltip.setAttribute('aria-label', `${label}：${num.toFixed(2)}`);
      }
      const mode = getCurrentThemeMode();
      const satKey = getCustomSaturationKey(mode);
      saveConfig(plugin, { [satKey]: num } as Partial<Config>);
    }
  }, true);
  document.addEventListener('click', (e: Event) => {
    const target = e.target as HTMLElement;
    if (target instanceof HTMLInputElement && target.type === 'color') {
      e.stopPropagation();
    }
  }, true);
}
export function buildMenu(
  plugin: Plugin,
  onClose?: () => void,
): Menu {
  const { i18n } = plugin;
  const menu = new Menu('topBarNeoPlus', () => {
    onClose?.();
  });
  menu.addItem({
    id: 'neo-scheme-button',
    icon: 'iconNeoPalette',
    label: i18n.colorScheme,
    submenu: getPresetMenuItems(i18n, plugin),
  });
  menu.addItem({
    id: 'neo-custom-color-button',
    iconHTML: createColorPickerHTML(plugin),
    label: i18n.customThemeColor,
    click: () => {
      switchToCustomAuto(plugin);
      const colorInput = document.querySelector<HTMLInputElement>('[data-id="neo-custom-color-button"] input[type="color"]');
      colorInput?.click();
      return true;
    },
  });
  menu.addItem({
    id: 'neo-followtime-button',
    iconHTML: createFollowTimeColorPickerHTML(plugin),
    label: i18n.customFollowTime,
    click: () => {
      switchToFollowTimeAuto(plugin);
      const colorInput = document.querySelector<HTMLInputElement>('[data-id="neo-followtime-button"] input[type="color"]');
      colorInput?.click();
      return true;
    },
  });
  menu.addItem({
    id: 'neo-followbanner-button',
    label: i18n.customFollowBanner,
    click: () => {
      switchToFollowBannerAuto(plugin);
      return true;
    },
  });
  menu.addItem({
    id: 'neo-custom-saturation-button',
    iconHTML: createSliderHTML(plugin, i18n),
    label: '',
    type: 'readonly',
  });
  menu.addSeparator();
  menu.addItem({
    id: 'neo-texture-button',
    icon: 'iconNeoTexture',
    label: i18n.texture,
    submenu: getTextureMenuItems(i18n, plugin),
  });
  menu.addItem({
    id: 'neo-expand-button',
    icon: 'iconNeoExpand',
    label: i18n.expand,
    submenu: [
      {
        id: 'neo-smooth-caret-button',
        icon: 'iconNeoSmoothCaret',
        label: i18n.smoothCaret,
        click: () => {
          onSmoothCaretClick(plugin);
          return true;
        },
      },
      {
        id: 'neo-fluid-cursor-button',
        icon: 'iconNeoFluidCursor',
        label: i18n.fluidCursor,
        click: () => {
          onFluidCursorClick(plugin);
          return true;
        },
      },
      {
        id: 'neo-list-bullet-line-button',
        icon: 'iconNeoListBulletLine',
        label: i18n.listBulletLine,
        click: () => {
          onListBulletLineClick(plugin);
          return true;
        },
      },
    ],
  });
  initMenuEventDelegation(plugin, i18n);
  return menu;
}
