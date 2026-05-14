import { Plugin, getFrontend } from 'siyuan';
import { initStatusHidden, destroyStatusHidden } from './modules/statushidden';
import { addNeoIcons } from './main/addicons';
import { addTopBarButton } from './main/addtopbar';
import { loadAndApplyConfig, destroyPluginEffects } from './palette/manager';
const DATA_KEY = 'config';
export default class NeoPlusPlugin extends Plugin {
  onload(): void {
    addNeoIcons(this.addIcons.bind(this));
    initStatusHidden();
  }
  onLayoutReady(): void {
    loadAndApplyConfig(this);
    const isMobile = getFrontend() === 'mobile' || getFrontend() === 'browser-mobile';
    addTopBarButton(this.addTopBar.bind(this), isMobile, this.i18n, this);
  }
  onunload(): void {
    destroyStatusHidden();
    destroyPluginEffects();
  }
  uninstall(): void {
    this.onunload();
    this.removeData(DATA_KEY);
  }
}
