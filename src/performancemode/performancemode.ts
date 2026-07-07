import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
function withViewTransition(callback: () => void): void {
  if (document.startViewTransition) {
    document.startViewTransition(callback);
  } else {
    callback();
  }
}
export function initPerformance(): void {
  loadConfig().then((config) => {
    if (config['performance'] === true) {
      document.documentElement.classList.add('neo-performance-mode');
    }
  });
}
export function onPerformanceClick(): void {
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-performance-mode');
  withViewTransition(() => {
    if (isActive) {
      destroyPerformance();
      saveConfig({ 'performance': false } as Partial<Config>);
    } else {
      htmlEl.classList.add('neo-performance-mode');
      saveConfig({ 'performance': true } as Partial<Config>);
    }
  });
}
export function destroyPerformance(): void {
  document.documentElement?.classList.remove('neo-performance-mode');
}
