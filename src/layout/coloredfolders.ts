import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
export function initColoredFolders(): void {
  loadConfig().then((config) => {
    if (config['colored-folders'] === true) {
      document.documentElement.classList.add('neo-layout-coloredfolders');
    }
  });
}
export function onColoredFoldersClick(): void {
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-layout-coloredfolders');
  if (isActive) {
    destroyColoredFolders();
    saveConfig({ 'colored-folders': false } as Partial<Config>);
  } else {
    htmlEl.classList.add('neo-layout-coloredfolders');
    saveConfig({ 'colored-folders': true } as Partial<Config>);
  }
}
export function destroyColoredFolders(): void {
  document.documentElement?.classList.remove('neo-layout-coloredfolders');
}