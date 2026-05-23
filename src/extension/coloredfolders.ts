import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
export function initColoredFolders(): void {
  loadConfig().then((config) => {
    if (config['colored-folders'] === true) {
      document.documentElement.classList.add('neo-extension-coloredfolders');
    }
  });
}
export function onColoredFoldersClick(): void {
  const htmlEl = document.documentElement;
  if (!htmlEl) return;
  const isActive = htmlEl.classList.contains('neo-extension-coloredfolders');
  if (isActive) {
    destroyColoredFolders();
    saveConfig({ 'colored-folders': false } as Partial<Config>);
  } else {
    htmlEl.classList.add('neo-extension-coloredfolders');
    saveConfig({ 'colored-folders': true } as Partial<Config>);
  }
}
export function destroyColoredFolders(): void {
  document.documentElement?.classList.remove('neo-extension-coloredfolders');
}
