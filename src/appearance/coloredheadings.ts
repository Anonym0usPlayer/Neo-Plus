import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
export function initColoredHeadings(): void {
  loadConfig().then((config) => {
    if (config['colored-headings'] === true) {
      document.documentElement.classList.add('neo-appearance-coloredheadings');
    }
  });
}
export function onColoredHeadingsClick(): void {
  const htmlEl = document.documentElement;
  if (!htmlEl) return;
  const isActive = htmlEl.classList.contains('neo-appearance-coloredheadings');
  if (isActive) {
    destroyColoredHeadings();
    saveConfig({ 'colored-headings': false } as Partial<Config>);
  } else {
    htmlEl.classList.add('neo-appearance-coloredheadings');
    saveConfig({ 'colored-headings': true } as Partial<Config>);
  }
}
export function destroyColoredHeadings(): void {
  document.documentElement?.classList.remove('neo-appearance-coloredheadings');
}
