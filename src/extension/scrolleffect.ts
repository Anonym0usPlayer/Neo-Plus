import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
export function initScrollEffect(): void {
  loadConfig().then((config) => {
    if (config['scroll-effect'] === true) {
      document.documentElement.classList.add('neo-extension-scrolleffect');
    }
  });
}
export function onScrollEffectClick(): void {
  const htmlEl = document.documentElement;
  if (!htmlEl) return;
  const isActive = htmlEl.classList.contains('neo-extension-scrolleffect');
  if (isActive) {
    destroyScrollEffect();
    saveConfig({ 'scroll-effect': false } as Partial<Config>);
  } else {
    htmlEl.classList.add('neo-extension-scrolleffect');
    saveConfig({ 'scroll-effect': true } as Partial<Config>);
  }
}
export function destroyScrollEffect(): void {
  document.documentElement?.classList.remove('neo-extension-scrolleffect');
}
