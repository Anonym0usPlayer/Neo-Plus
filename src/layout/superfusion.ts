import { isMobile } from '../modules/env';
import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
export function initSuperFusion(): void {
  if (isMobile()) return;
  loadConfig().then((config) => {
    if (config['super-fusion'] === true) {
      document.documentElement.classList.add('neo-layout-superfusion');
    }
  });
}
export function onSuperFusionClick(): void {
  if (isMobile()) return;
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-layout-superfusion');
  if (isActive) {
    destroySuperFusion();
    saveConfig({ 'super-fusion': false } as Partial<Config>);
  } else {
    htmlEl.classList.add('neo-layout-superfusion');
    saveConfig({ 'super-fusion': true } as Partial<Config>);
  }
}
export function destroySuperFusion(): void {
  document.documentElement?.classList.remove('neo-layout-superfusion');
}