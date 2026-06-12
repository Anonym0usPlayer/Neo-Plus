import { isMobile } from '../modules/env';
import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
let destroyed = false;
export function initSuperFusion(): void {
  if (isMobile()) return;
  loadConfig().then((config) => {
    if (config['super-fusion'] === true) {
      document.documentElement.classList.add('neo-extension-superfusion');
      destroyed = false;
    }
  });
}
export function onSuperFusionClick(): void {
  if (isMobile()) return;
  const htmlEl = document.documentElement;
  if (!htmlEl) return;
  const isActive = htmlEl.classList.contains('neo-extension-superfusion');
  if (isActive) {
    destroySuperFusion();
    saveConfig({ 'super-fusion': false } as Partial<Config>);
  } else {
    htmlEl.classList.add('neo-extension-superfusion');
    saveConfig({ 'super-fusion': true } as Partial<Config>);
    destroyed = false;
  }
}
export function destroySuperFusion(): void {
  destroyed = true;
  document.documentElement?.classList.remove('neo-extension-superfusion');
}