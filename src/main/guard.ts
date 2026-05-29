import { Plugin } from 'siyuan';
import { initStatusHidden, destroyStatusHidden } from '../modules/statushidden';
import { initFetchMonitor, destroyFetchMonitor } from '../modules/fetchmonitor';
import { initHasWnd, destroyHasWnd } from '../modules/haswnd';
import { initHasSearchGroup, destroyHasSearchGroup } from '../modules/hassearchgroup';
import { initHideScrollbar, destroyHideScrollbar } from '../modules/hidescrollbar';
import { initEnv, destroyEnv } from '../modules/env';
import { initPerformanceTuning, destroyPerformanceTuning } from '../modules/performancetuning';
import { initSlashNavigation, destroySlashNavigation } from '../modules/slashnavigation';
import { initNeoIcons, destroyNeoIcons } from './icons';
import { initTopBarButton, destroyTopBarButton } from './topbar';
import { initShortcuts, destroyShortcuts } from './shortcut';
import { initPalette, destroyPalette } from '../palette/manager';
import { initTexture, destroyTexture } from '../texture/manager';
import { initColoredLists, destroyColoredLists } from '../element/coloredlists';
import { initColoredHeadings, destroyColoredHeadings } from '../element/coloredheadings';
import { initSmoothCaret, destroySmoothCaret } from '../extension/smoothcaret';
import { initColoredFolders, destroyColoredFolders } from '../extension/coloredfolders';
import { initScrollEffect, destroyScrollEffect } from '../extension/scrolleffect';
import { initFluidCursor, destroyFluidCursor } from '../extension/fluidcursor';
import { initListBulletLine, destroyListBulletLine } from '../extension/listbulletline';
import { initFocusBlockIndicator, destroyFocusBlockIndicator } from '../extension/focusblockindicator';
import { initVerticalTabs, destroyVerticalTabs } from '../extension/verticaltabs';
function initNeoEnabled(): void {
  document.documentElement.classList.add('neo-enabled');
}
function destroyNeoEnabled(): void {
  document.documentElement.classList.remove('neo-enabled');
}
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
    initNeoEnabled();
    initEnv();
    initNeoIcons();
    initTopBarButton();
    initShortcuts();
    initStatusHidden();
    initHideScrollbar();
    initSlashNavigation();
    initPalette();
    initTexture();
    initColoredFolders();
    initColoredLists();
    initColoredHeadings();
    initSmoothCaret();
    initScrollEffect();
    initFluidCursor();
    initListBulletLine();
    initFocusBlockIndicator();
    initVerticalTabs();
    initFetchMonitor();
    initHasWnd();
    initPerformanceTuning();
    initHasSearchGroup();
  }
  private destroyNeoPlus(): void {
    destroyNeoEnabled();
    destroyEnv();
    destroyNeoIcons();
    destroyTopBarButton();
    destroyShortcuts();
    destroyStatusHidden();
    destroyHideScrollbar();
    destroySlashNavigation();
    destroyPalette();
    destroyTexture();
    destroyColoredFolders();
    destroyColoredLists();
    destroyColoredHeadings();
    destroySmoothCaret();
    destroyScrollEffect();
    destroyFluidCursor();
    destroyListBulletLine();
    destroyFocusBlockIndicator();
    destroyVerticalTabs();
    destroyPerformanceTuning();
    destroyHasSearchGroup();
    destroyHasWnd();
    destroyFetchMonitor();
  }
}
