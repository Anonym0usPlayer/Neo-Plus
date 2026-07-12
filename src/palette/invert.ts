import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
import { getCurrentThemeMode, getInvertKey, getCurrentPlan } from './presets';
import { initCraft, destroyCraft } from './craft';
const swapVars = ['--b3-theme-background', '--b3-theme-surface', '--b3-theme-on-background', '--b3-theme-on-surface'];
function swapCraftVars(): void {
    if (getCurrentThemeMode() !== 'dark') return;
    const html = document.documentElement;
    const bg = html.style.getPropertyValue(swapVars[0]);
    const sf = html.style.getPropertyValue(swapVars[1]);
    const ob = html.style.getPropertyValue(swapVars[2]);
    const os = html.style.getPropertyValue(swapVars[3]);
    if (!bg || !sf) return;
    html.style.setProperty(swapVars[0], sf);
    html.style.setProperty(swapVars[1], bg);
    html.style.setProperty(swapVars[2], os);
    html.style.setProperty(swapVars[3], ob);
}
function refreshCraftInvert(): void {
    if (getCurrentThemeMode() !== 'dark') return;
    loadConfig().then(config => {
        const mode = getCurrentThemeMode();
        if (getCurrentPlan(config, mode) !== 'craft') return;
        destroyCraft();
        initCraft(config);
        if (config[getInvertKey(mode)]) {
            swapCraftVars();
        }
    });
}
export async function onInvertClick(): Promise<void> {
  const html = document.documentElement;
  const enabled = html.classList.contains('neo-palette-invert');
  const callback = () => {
    if (enabled) {
      html.classList.remove('neo-palette-invert');
    } else {
      html.classList.add('neo-palette-invert');
    }
  };
  if (document.startViewTransition) {
    document.startViewTransition(callback);
  } else {
    callback();
  }
  const mode = getCurrentThemeMode();
  const key = getInvertKey(mode);
  await saveConfig({ [key]: !enabled } as Partial<Config>);
  refreshCraftInvert();
}
export function initInvert(config: Config): void {
  const mode = getCurrentThemeMode();
  const key = getInvertKey(mode);
  const enabled = config[key] ?? false;
  if (enabled) {
    document.documentElement.classList.add('neo-palette-invert');
  }
  if (enabled && mode === 'dark' && getCurrentPlan(config, mode) === 'craft') {
    swapCraftVars();
  }
}
export function destroyInvert(): void {
  document.documentElement.classList.remove('neo-palette-invert');
}
