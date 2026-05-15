import { Plugin } from 'siyuan';
import { buildMenu } from './addmenu';
export function addTopBarButton(
  addTopBar: (config: {
    icon: string;
    title: string;
    position: 'left' | 'right';
    callback: () => void;
  }) => HTMLElement,
  isMobile: boolean,
  plugin: Plugin,
): void {
  const button = addTopBar({
    icon: 'iconNeo',
    title: 'Neo+',
    position: 'right',
    callback: () => {
      if (isMobile) {
        const menu = buildMenu(plugin);
        menu.fullscreen();
      } else {
        let rect = button.getBoundingClientRect();
        if (rect.width === 0) {
          rect = document.querySelector('#barMore')?.getBoundingClientRect() as DOMRect;
        }
        if (rect.width === 0) {
          rect = document.querySelector('#barPlugins')?.getBoundingClientRect() as DOMRect;
        }
        const menu = buildMenu(plugin);
        menu.open({ x: rect.right, y: rect.bottom, isLeft: true });
      }
    },
  });
}
