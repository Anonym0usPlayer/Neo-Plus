import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
export function initColoredSelection(): void {
  loadConfig().then((config) => {
    if (config['colored-selection'] === true) {
      document.documentElement.classList.add('neo-element-coloredselection');
    }
  });
}
export function onColoredSelectionClick(): void {
  const htmlEl = document.documentElement;
  if (!htmlEl) return;
  const isActive = htmlEl.classList.contains('neo-element-coloredselection');
  if (isActive) {
    destroyColoredSelection();
    saveConfig({ 'colored-selection': false } as Partial<Config>);
  } else {
    htmlEl.classList.add('neo-element-coloredselection');
    saveConfig({ 'colored-selection': true } as Partial<Config>);
  }
}
export function destroyColoredSelection(): void {
  document.documentElement?.classList.remove('neo-element-coloredselection');
}
