import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
export function initColoredLists(): void {
  loadConfig().then((config) => {
    if (config['colored-lists'] === true) {
      document.documentElement.classList.add('neo-appearance-coloredlists');
    }
  });
}
export function onColoredListsClick(): void {
  const htmlEl = document.documentElement;
  if (!htmlEl) return;
  const isActive = htmlEl.classList.contains('neo-appearance-coloredlists');
  if (isActive) {
    destroyColoredLists();
    saveConfig({ 'colored-lists': false } as Partial<Config>);
  } else {
    htmlEl.classList.add('neo-appearance-coloredlists');
    saveConfig({ 'colored-lists': true } as Partial<Config>);
  }
}
export function destroyColoredLists(): void {
  document.documentElement?.classList.remove('neo-appearance-coloredlists');
}
