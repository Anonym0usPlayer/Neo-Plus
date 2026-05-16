import { Plugin } from 'siyuan';
import { initStatusHidden, destroyStatusHidden } from './modules/statushidden';
import { initHideScrollbar, destroyHideScrollbar } from './modules/hidescrollbar';
import { initFocusBlock, destroyFocusBlock } from './modules/focusblock';
import { initSlashNavigation, destroySlashNavigation } from './modules/slashnavigation';
import { addNeoIcons } from './main/addicons';
import { addTopBarButton } from './main/addtopbar';
import { initPalette, destroyPalette } from './palette/manager';
import { initTexture, destroyTexture } from './texture/manager';
import { initSmoothCaret, destroySmoothCaret } from './expand/smoothcaret';
import { initFluidCursor, destroyFluidCursor } from './expand/fluidcursor';
import { initListBulletLine, destroyListBulletLine } from './expand/listbulletline';
import { configKey } from './main/data';
export default class NeoPlusPlugin extends Plugin {
  onload(): void {
    addNeoIcons(this.addIcons.bind(this));
    initStatusHidden();
    initHideScrollbar();
    initFocusBlock();
    initSlashNavigation();
  }
  onLayoutReady(): void {
    initPalette(this);
    initTexture(this);
    initSmoothCaret(this);
    initFluidCursor(this);
    initListBulletLine(this);
    addTopBarButton(this.addTopBar.bind(this), false, this);
  }
  onunload(): void {
    destroyStatusHidden();
    destroyHideScrollbar();
    destroyFocusBlock();
    destroySlashNavigation();
    destroyPalette();
    destroyTexture();
    destroySmoothCaret();
    destroyFluidCursor();
    destroyListBulletLine();
  }
  uninstall(): void {
    this.removeData(configKey);
  }
}
