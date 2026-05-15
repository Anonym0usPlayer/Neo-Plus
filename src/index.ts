import { Plugin } from 'siyuan';
import { initStatusHidden, destroyStatusHidden } from './modules/statushidden';
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
    destroyPalette();
    destroyTexture();
    destroySmoothCaret();
    destroyFluidCursor();
    destroyListBulletLine();
  }
  uninstall(): void {
    this.onunload();
    this.removeData(configKey);
  }
}
