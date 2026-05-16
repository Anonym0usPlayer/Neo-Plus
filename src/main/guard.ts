import { Plugin } from 'siyuan';
import { initStatusHidden, destroyStatusHidden } from '../modules/statushidden';
import { initHideScrollbar, destroyHideScrollbar } from '../modules/hidescrollbar';
import { initFocusBlock, destroyFocusBlock } from '../modules/focusblock';
import { initSlashNavigation, destroySlashNavigation } from '../modules/slashnavigation';
import { initNeoIcons, destroyNeoIcons } from './addicons';
import { initTopBarButton, destroyTopBarButton } from './addtopbar';
import { initPalette, destroyPalette } from '../palette/manager';
import { initTexture, destroyTexture } from '../texture/manager';
import { initSmoothCaret, destroySmoothCaret } from '../expand/smoothcaret';
import { initFluidCursor, destroyFluidCursor } from '../expand/fluidcursor';
import { initListBulletLine, destroyListBulletLine } from '../expand/listbulletline';
import { destroyMenuEventDelegation } from './addmenu';
function isNeoTheme(): boolean {
  const mode = document.documentElement.getAttribute('data-theme-mode');
  if (mode === 'dark') {
    return document.documentElement.getAttribute('data-dark-theme') === 'Neo';
  }
  return document.documentElement.getAttribute('data-light-theme') === 'Neo';
}
let _plugin: Plugin | null = null;
export function getPlugin(): Plugin | null {
  return _plugin;
}
export class NeoPlusController {
  private themeObserver: MutationObserver | null = null;
  private isNeoTheme: boolean = false;
  constructor(plugin: Plugin) {
    _plugin = plugin;
  }
  init(): void {
    this.syncWithTheme();
    this.themeObserver = new MutationObserver(() => {
      this.syncWithTheme();
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme-mode', 'data-light-theme', 'data-dark-theme'],
    });
  }
  destroy(): void {
    this.themeObserver?.disconnect();
    this.themeObserver = null;
    if (this.isNeoTheme) {
      this.destroyNeoPlus();
    }
    this.isNeoTheme = false;
    _plugin = null;
  }
  private syncWithTheme(): void {
    const isNowNeo = isNeoTheme();
    if (isNowNeo && !this.isNeoTheme) {
      this.initNeoPlus();
    } else if (!isNowNeo && this.isNeoTheme) {
      this.destroyNeoPlus();
    }
    this.isNeoTheme = isNowNeo;
  }
  private initNeoPlus(): void {
    initNeoIcons();
    initTopBarButton();
    initStatusHidden();
    initHideScrollbar();
    initFocusBlock();
    initSlashNavigation();
    initPalette();
    initTexture();
    initSmoothCaret();
    initFluidCursor();
    initListBulletLine();
  }
  private destroyNeoPlus(): void {
    destroyNeoIcons();
    destroyTopBarButton();
    destroyStatusHidden();
    destroyHideScrollbar();
    destroyFocusBlock();
    destroySlashNavigation();
    destroyPalette();
    destroyTexture();
    destroySmoothCaret();
    destroyFluidCursor();
    destroyListBulletLine();
    destroyMenuEventDelegation();
  }
}
