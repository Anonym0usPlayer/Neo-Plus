import { Menu } from 'siyuan';
import { getPlugin } from './guard';
import { createColorPickerHTML, createFollowTimeColorPickerHTML, createSliderHTML, getPresetMenuItems, switchToCustomAuto, switchToFollowTimeAuto, switchToFollowBannerAuto } from '../palette/manager';
import { getTextureMenuItems } from '../texture/manager';
import { onSmoothCaretClick } from '../extension/smoothcaret';
import { onFluidCursorClick } from '../extension/fluidcursor';
import { onListBulletLineClick } from '../extension/listbulletline';
import { onFocusBlockIndicatorClick } from '../extension/focusblockindicator';
import { onScrollEffectClick } from '../extension/scrolleffect';
import { onColoredFoldersClick } from '../extension/coloredfolders';
import { onVerticalTabsClick } from '../extension/verticaltabs';
import { onColoredListsClick } from '../element/coloredlists';
import { onColoredHeadingsClick } from '../element/coloredheadings';
import { saveConfig } from './data';
import type { Config } from './data';
import { getCurrentThemeMode, getCustomColorKey, getCustomSaturationKey, getFollowTimeBaseColorKey } from '../palette/presets';
let menuListenerInitialized = false;
let _inputHandler: ((e: Event) => void) | null = null;
let _clickHandler: ((e: Event) => void) | null = null;
function initMenuEventDelegation(i18n: Record<string, string>): void {
  if (menuListenerInitialized) return;
  menuListenerInitialized = true;
  _inputHandler = (e: Event) => {
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
      saveConfig(patch);
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
      saveConfig(patch);
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
      saveConfig({ [satKey]: num } as Partial<Config>);
    }
  };
  _clickHandler = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target instanceof HTMLInputElement && target.type === 'color') {
      e.stopPropagation();
    }
  };
  document.addEventListener('input', _inputHandler, true);
  document.addEventListener('click', _clickHandler, true);
}
export function destroyMenuEventDelegation(): void {
  if (_inputHandler) {
    document.removeEventListener('input', _inputHandler, true);
    _inputHandler = null;
  }
  if (_clickHandler) {
    document.removeEventListener('click', _clickHandler, true);
    _clickHandler = null;
  }
  menuListenerInitialized = false;
}
export function buildMenu(
  onClose?: () => void,
): Menu {
  const plugin = getPlugin();
  if (!plugin) {
    throw new Error('Neo+ plugin not available');
  }
  const { i18n } = plugin;
  const menu = new Menu('topBarNeoPlus', () => {
    onClose?.();
  });
  menu.addItem({
    id: 'neo-scheme-button',
    icon: 'iconNeoPalette',
    label: i18n.colorScheme,
    submenu: getPresetMenuItems(i18n),
  });
  menu.addItem({
    id: 'neo-custom-color-button',
    iconHTML: createColorPickerHTML(),
    label: i18n.customThemeColor,
    click: () => {
      switchToCustomAuto();
      const colorInput = document.querySelector<HTMLInputElement>('[data-id="neo-custom-color-button"] input[type="color"]');
      colorInput?.click();
      return true;
    },
  });
  menu.addItem({
    id: 'neo-followtime-button',
    iconHTML: createFollowTimeColorPickerHTML(),
    label: i18n.customFollowTime,
    click: () => {
      switchToFollowTimeAuto();
      const colorInput = document.querySelector<HTMLInputElement>('[data-id="neo-followtime-button"] input[type="color"]');
      colorInput?.click();
      return true;
    },
  });
  menu.addItem({
    id: 'neo-followbanner-button',
    label: i18n.customFollowBanner,
    click: () => {
      switchToFollowBannerAuto();
      return true;
    },
  });
  menu.addItem({
    id: 'neo-custom-saturation-button',
    iconHTML: createSliderHTML(i18n),
    label: '',
    type: 'readonly',
  });
  menu.addSeparator();
  menu.addItem({
    id: 'neo-texture-button',
    icon: 'iconNeoTexture',
    label: i18n.texture,
    submenu: getTextureMenuItems(i18n),
  });
  menu.addItem({
    id: 'neo-element-button',
    icon: 'iconNeoElement',
    label: i18n.element,
    submenu: [
      {
        id: 'neo-colored-lists-button',
        icon: 'iconNeoList',
        label: i18n.coloredLists,
        click: () => {
          onColoredListsClick();
          return true;
        },
      },
      {
        id: 'neo-colored-headings-button',
        icon: 'iconNeoColoredHeadings',
        label: i18n.coloredHeadings,
        click: () => {
          onColoredHeadingsClick();
          return true;
        },
      },
    ],
  });
  menu.addItem({
    id: 'neo-extension-button',
    icon: 'iconNeoExtension',
    label: i18n.extension,
    submenu: [
      {
        id: 'neo-vertical-tabs-button',
        icon: 'iconNeoVerticalTabs',
        label: i18n.verticalTabs,
        click: () => {
          onVerticalTabsClick();
          return true;
        },
      },
      {
        id: 'neo-smooth-caret-button',
        icon: 'iconNeoSmoothCaret',
        label: i18n.smoothCaret,
        click: () => {
          onSmoothCaretClick();
          return true;
        },
      },
      {
        id: 'neo-fluid-cursor-button',
        icon: 'iconNeoFluidCursor',
        label: i18n.fluidCursor,
        click: () => {
          onFluidCursorClick();
          return true;
        },
      },
      {
        id: 'neo-list-bullet-line-button',
        icon: 'iconNeoList',
        label: i18n.listBulletLine,
        click: () => {
          onListBulletLineClick();
          return true;
        },
      },
      {
        id: 'neo-focus-block-indicator-button',
        icon: 'iconNeoFocusBlockIndicator',
        label: i18n.focusBlockIndicator,
        click: () => {
          onFocusBlockIndicatorClick();
          return true;
        },
      },
      {
        id: 'neo-scroll-effect-button',
        icon: 'iconNeoScrollEffect',
        label: i18n.scrollEffect,
        click: () => {
          onScrollEffectClick();
          return true;
        },
      },
      {
        id: 'neo-colored-folders-button',
        icon: 'iconNeoColoredFolders',
        label: i18n.coloredFolders,
        click: () => {
          onColoredFoldersClick();
          return true;
        },
      },
    ],
  });
  initMenuEventDelegation(i18n);
  return menu;
}
