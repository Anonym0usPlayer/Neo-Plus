import { Menu } from 'siyuan';
import { createColorPickerHTML, createFollowTimeColorPickerHTML, createSliderHTML, getPresetMenuItems, switchToCustomAuto, switchToFollowTimeAuto, switchToFollowBannerAuto } from '../palette/manager';
export function buildMenu(
  i18n: Record<string, string>,
  buttonRect: DOMRect,
  plugin?: any,
  onClose?: () => void,
): Menu {
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
  const el2 = (menu as any).element as HTMLElement;
  const input = el2?.querySelector('[data-id="neo-custom-color-button"] input[type="color"]') as HTMLInputElement | null;
  if (input) {
    input.addEventListener('click', (e: Event) => {
      e.stopPropagation();
    });
  }
  const followtimeInput = el2?.querySelector('[data-id="neo-followtime-button"] input[type="color"]') as HTMLInputElement | null;
  if (followtimeInput) {
    followtimeInput.addEventListener('click', (e: Event) => {
      e.stopPropagation();
    });
  }
  return menu;
}
