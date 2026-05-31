import { Menu } from 'siyuan';
import { getPlugin } from './guard';
import { loadConfig } from './data';
import { createColorPickerHTML, createFollowTimeColorPickerHTML, createSliderHTML, getPresetMenuItems, getThemeColor, initPaletteMenuEvents, onInvertClick, switchToPlan } from '../palette/manager';
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
    id: 'neo-random-button',
    icon: 'iconNeoRandom',
    label: i18n.random,
    click: () => {
      switchToPlan('random');
      return true;
    },
  });
  menu.addItem({
    id: 'neo-scheme-button',
    icon: 'iconNeoPalette',
    label: i18n.colorScheme,
    submenu: getPresetMenuItems(i18n),
  });
  const configPromise = loadConfig();
  menu.addItem({
    id: 'neo-custom-color-button',
    iconHTML: createColorPickerHTML(),
    label: i18n.customThemeColor,
    click: () => {
      switchToPlan('custom');
      const colorInput = document.querySelector<HTMLInputElement>('[data-id="neo-custom-color-button"] input[type="color"]');
      colorInput?.click();
      return true;
    },
  });
  menu.addItem({
    id: 'neo-followtime-button',
    iconHTML: createFollowTimeColorPickerHTML(),
    label: i18n.followTime,
    click: () => {
      switchToPlan('followtime');
      const colorInput = document.querySelector<HTMLInputElement>('[data-id="neo-followtime-button"] input[type="color"]');
      colorInput?.click();
      return true;
    },
  });
  configPromise.then((config) => {
    requestAnimationFrame(() => {
      const customPicker = document.querySelector<HTMLInputElement>('[data-id="neo-custom-color-button"] input[type="color"]');
      if (customPicker) {
        customPicker.value = getThemeColor(config);
      }
      const followtimePicker = document.querySelector<HTMLInputElement>('[data-id="neo-followtime-button"] input[type="color"]');
      if (followtimePicker) {
        followtimePicker.value = createFollowTimeColorPickerHTML(config).match(/value="([^"]+)"/)?.[1] || followtimePicker.value;
      }
    });
  });
  menu.addItem({
    id: 'neo-followbanner-button',
    icon: '',
    label: i18n.followBanner,
    click: () => {
      switchToPlan('followbanner');
      return true;
    },
  });
  menu.addItem({
    id: 'neo-followsystem-button',
    icon: '',
    label: i18n.followSystem,
    click: () => {
      switchToPlan('followsystem');
      return true;
    },
  });
  menu.addItem({
    id: 'neo-saturation-button',
    icon: 'iconNeoSaturation',
    label: createSliderHTML(i18n),
    type: 'readonly',
  });
  menu.addItem({
    id: 'neo-invert-button',
    icon: 'iconNeoInvert',
    label: i18n.invertColor,
    click: () => {
      onInvertClick();
      return true;
    },
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
  initPaletteMenuEvents(i18n);
  return menu;
}
