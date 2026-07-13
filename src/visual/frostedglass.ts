import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
function withViewTransition(callback: () => void): void {
    if (document.startViewTransition) {
        document.startViewTransition(callback);
    } else {
        callback();
    }
}
export function initFrostedGlass(): void {
    loadConfig().then((config) => {
        if (config['frosted-glass'] === true) {
            document.documentElement.classList.add('neo-visual-frostedglass');
        }
    });
}
export function onFrostedGlassClick(): void {
    const htmlEl = document.documentElement;
    const isActive = htmlEl.classList.contains('neo-visual-frostedglass');
    withViewTransition(() => {
        if (isActive) {
            destroyFrostedGlass();
            saveConfig({ 'frosted-glass': false } as Partial<Config>);
        } else {
            htmlEl.classList.add('neo-visual-frostedglass');
            saveConfig({ 'frosted-glass': true } as Partial<Config>);
        }
    });
}
export function destroyFrostedGlass(): void {
    document.documentElement?.classList.remove('neo-visual-frostedglass');
}
