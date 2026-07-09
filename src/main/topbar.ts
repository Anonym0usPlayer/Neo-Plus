import { getPlugin } from './guard';
import { buildMenu } from './menu';
let topBarButton: HTMLElement | null = null;
export function initTopBarButton(): HTMLElement | null {
  const plugin = getPlugin();
  if (!plugin) return null;
  const button = plugin.addTopBar({
    icon: 'iconNeo',
    title: 'Neo+',
    position: 'right',
    callback: () => {
        let rect = button.getBoundingClientRect();
        if (rect.width === 0) {
          rect = document.querySelector('#barMore')?.getBoundingClientRect() as DOMRect;
        }
        if (rect.width === 0) {
          rect = document.querySelector('#barPlugins')?.getBoundingClientRect() as DOMRect;
        }
        const menu = buildMenu();
        menu.open({ x: rect.right, y: rect.bottom, isLeft: true });
    },
  });
  topBarButton = button;
  return button;
}
export function destroyTopBarButton(): void {
  if (topBarButton) {
    topBarButton.remove();
    topBarButton = null;
  }
}
