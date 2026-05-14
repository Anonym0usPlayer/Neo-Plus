import { Menu } from 'siyuan';
import { createColorPickerHTML, createSliderHTML, getPresetMenuItems, switchToCustomAuto } from '../palette/manager';
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
  return menu;
}