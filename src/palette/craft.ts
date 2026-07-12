import type { Config } from '../main/data';
import { getCurrentThemeMode } from './presets';
export interface CraftPreset {
    background: string;
    surface: string;
    baseColor: string;
    primary: string;
    accent: string;
    onBackground: string;
    onSurface: string;
}
const CRAFT_VARS: Array<{ key: keyof CraftPreset; varName: string }> = [
    { key: 'background', varName: '--b3-theme-background' },
    { key: 'surface', varName: '--b3-theme-surface' },
    { key: 'baseColor', varName: '--b3-base-color' },
    { key: 'primary', varName: '--b3-theme-primary' },
    { key: 'accent', varName: '--b3-theme-accent' },
    { key: 'onBackground', varName: '--b3-theme-on-background' },
    { key: 'onSurface', varName: '--b3-theme-on-surface' },
];
export function initCraft(config: Config): void {
    const mode = getCurrentThemeMode();
    const key: 'craft-preset-light' | 'craft-preset-dark' =
        mode === 'dark' ? 'craft-preset-dark' : 'craft-preset-light';
    const json = config[key];
    if (!json) return;
    try {
        const preset: CraftPreset = JSON.parse(json);
        for (const { key: k, varName } of CRAFT_VARS) {
            const val = preset[k];
            if (val) {
                document.documentElement.style.setProperty(varName, val);
            }
        }
    } catch { }
}
export function destroyCraft(): void {
    for (const { varName } of CRAFT_VARS) {
        document.documentElement.style.removeProperty(varName);
    }
}
