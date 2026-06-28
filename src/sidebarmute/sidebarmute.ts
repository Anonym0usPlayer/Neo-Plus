import { isMobile } from '../modules/env';
import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
function withViewTransition(callback: () => void): void {
  if (document.startViewTransition) {
    document.startViewTransition(callback);
  } else {
    callback();
  }
}
export function initSidebarMute(): void {
  if (isMobile()) return;
  loadConfig().then((config) => {
    if (config['sidebar-mute'] === true) {
      document.documentElement.classList.add('neo-sidebar-mute');
    }
  });
}
export function onSidebarMuteClick(): void {
  if (isMobile()) return;
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-sidebar-mute');
  withViewTransition(() => {
    if (isActive) {
      destroySidebarMute();
      saveConfig({ 'sidebar-mute': false } as Partial<Config>);
    } else {
      htmlEl.classList.add('neo-sidebar-mute');
      saveConfig({ 'sidebar-mute': true } as Partial<Config>);
    }
  });
}
export function destroySidebarMute(): void {
  document.documentElement?.classList.remove('neo-sidebar-mute');
}
