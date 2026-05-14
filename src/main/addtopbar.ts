import { buildMenu } from './addmenu';
export function addTopBarButton(
  addTopBar: (config: {
    icon: string;
    title: string;
    position: 'left' | 'right';
    callback: () => void;
  }) => HTMLElement,
  isMobile: boolean,
  i18n: Record<string, string>,
  plugin: any,
): void {
  const button = addTopBar({
    icon: 'iconNeo',
    title: 'Neo+',
    position: 'right',
    callback: () => {
      if (isMobile) {
        const menu = buildMenu(i18n, {} as DOMRect, plugin);
        menu.fullscreen();
      } else {
        let rect = button.getBoundingClientRect();
        if (rect.width === 0) {
          rect = document.querySelector('#barMore')?.getBoundingClientRect() as DOMRect;
        }
        if (rect.width === 0) {
          rect = document.querySelector('#barPlugins')?.getBoundingClientRect() as DOMRect;
        }
        const menu = buildMenu(i18n, rect, plugin);
        menu.open({ x: rect.right, y: rect.bottom, isLeft: true });
      }
    },
  });
}