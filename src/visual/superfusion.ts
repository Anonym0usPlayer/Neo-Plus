import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
export function initSuperFusion(): void {
  loadConfig().then((config) => {
    if (config['super-fusion'] === true) {
      document.documentElement.classList.add('neo-visual-superfusion');
    }
  });
}
export function onSuperFusionClick(): void {
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-visual-superfusion');
  if (isActive) {
    destroySuperFusion();
    saveConfig({ 'super-fusion': false } as Partial<Config>);
  } else {
    htmlEl.classList.add('neo-visual-superfusion');
    saveConfig({ 'super-fusion': true } as Partial<Config>);
  }
}
export function destroySuperFusion(): void {
  document.documentElement?.classList.remove('neo-visual-superfusion');
}