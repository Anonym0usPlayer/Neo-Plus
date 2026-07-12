import { Plugin } from 'siyuan';
import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
import {
    getCurrentThemeMode,
    getCustomColorKey,
    getSaturationKey,
    getFollowTimeBaseColorKey,
    getInvertKey,
    getHighContrastKey,
    applyPreset,
    destroyPaletteClasses,
    applyCurrentPlan,
} from '../palette/presets';
import { initCustomColor, destroyCustomColor } from '../palette/customcolor';
import { initFollowTime, destroyFollowTime } from '../palette/followtime';
import { initRandom, destroyRandom } from '../palette/random';
import { initSaturation, destroySaturation } from '../palette/saturation';
import { initInvert, destroyInvert } from '../palette/invert';
import { initHighContrast, destroyHighContrast } from '../palette/highcontrast';
import { initCraft, destroyCraft, type CraftPreset } from '../palette/craft';
type ActionResult = { result?: string; error?: string };
const allPresetKeys = [
    'default', 'classic', 'meridian', 'amber',
    'dusk', 'gingko', 'lavender', 'midnight', 'ocean',
    'opalite', 'oxygen', 'sakura', 'twilight', 'wilderness',
    'everbliss', 'aerisland', 'zerith', 'stellula', 'vael',
    'savor', 'sugar', 'salt', 'starry', 'tundra',
    'abyss', 'violet', 'titaniumspace', 'firefly', 'songyan',
];
const presetNameMap: Record<string, string> = {
    default: '默认', classic: '经典', meridian: '子午', amber: '琥珀',
    dusk: '黄昏', gingko: '银杏', lavender: '薰衣草', midnight: '午夜',
    ocean: '深海', opalite: '蛋白石', oxygen: '氧', sakura: '樱花',
    twilight: '暮光', wilderness: '旷野', everbliss: '岁禧', aerisland: '空屿',
    zerith: '零域', stellula: '星漪', vael: '远岫', savor: '写味',
    sugar: '糖', salt: '盐', starry: '星穹', tundra: '苔原',
    abyss: '深渊', violet: '紫罗兰', titaniumspace: '钛空', firefly: '萤火',
    songyan: '松烟',
};
const presetModes: Record<string, 'all' | 'light' | 'dark'> = {
    default: 'all', classic: 'all', meridian: 'all', amber: 'all',
    dusk: 'light', gingko: 'light', lavender: 'all', midnight: 'dark',
    ocean: 'dark', opalite: 'light', oxygen: 'dark', sakura: 'light',
    twilight: 'dark', wilderness: 'all', everbliss: 'all', aerisland: 'all',
    zerith: 'all', stellula: 'all', vael: 'all', savor: 'all',
    sugar: 'light', salt: 'light', starry: 'dark', tundra: 'light',
    abyss: 'dark', violet: 'light', titaniumspace: 'all', firefly: 'dark',
    songyan: 'dark',
};
const modeLabels: Record<string, string> = { all: '亮暗通用', light: '仅亮色', dark: '仅暗色' };
function buildPresetDescription(): string {
    return allPresetKeys.map(k => `${k}（${presetNameMap[k] || k}，${modeLabels[presetModes[k]]}）`).join('、');
}
function buildPresetsByMode(mode: 'light' | 'dark'): string {
    return allPresetKeys
        .filter(k => presetModes[k] === 'all' || presetModes[k] === mode)
        .map(k => `${k}（${presetNameMap[k] || k}）`)
        .join('、');
}
function isPresetValidForMode(key: string, mode: 'light' | 'dark'): boolean {
    const m = presetModes[key];
    return m === 'all' || m === mode;
}
const nameToKey: Record<string, string> = Object.fromEntries(
    Object.entries(presetNameMap).map(([k, v]) => [v, k])
);
function resolvePresetKey(input: string): string | null {
    const lower = input.trim().toLowerCase();
    if (allPresetKeys.includes(lower)) return lower;
    if (nameToKey[input.trim()]) return nameToKey[input.trim()];
    return null;
}
function isValidHex(s: string): boolean {
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s);
}
function normalizeHex(s: string): string {
    const h = s.replace('#', '');
    return '#' + (h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h).toLowerCase();
}
function extractParams(args: Record<string, unknown>): Record<string, unknown> {
    if (typeof args.key === 'string' || typeof args.baseColor === 'string' ||
        args.saturation !== undefined || typeof args.enable === 'boolean' ||
        args.value !== undefined || typeof args.mode === 'string') {
        return args;
    }
    if (typeof args.query === 'string' && args.query.trim()) {
        try {
            const p = JSON.parse(args.query);
            if (p && typeof p === 'object' && !Array.isArray(p)) return p;
        } catch { }
        const t = args.query.trim();
        if (isValidHex(t)) return { baseColor: t };
        if (allPresetKeys.includes(t)) return { key: t };
    }
    return args;
}
function destroyAllEffects(): void {
    destroyRandom();
    destroyCustomColor();
    destroyFollowTime();
    destroyCraft();
    destroySaturation();
    destroyInvert();
    destroyHighContrast();
    destroyPaletteClasses();
}
async function applyCustomScheme(raw: Record<string, unknown>): Promise<string> {
    const args = extractParams(raw);
    const baseColor = typeof args.baseColor === 'string' ? args.baseColor.trim() : '';
    if (!baseColor) throw new Error('缺少必填参数 baseColor。query 示例：{"baseColor":"#e67e22"}');
    if (!isValidHex(baseColor)) throw new Error(`baseColor 格式无效："${baseColor}"，请用 hex（如 "#e67e22"）`);
    let saturation = 1;
    if (args.saturation !== undefined && args.saturation !== null) {
        saturation = Number(args.saturation);
        if (isNaN(saturation) || saturation < 0 || saturation > 5) throw new Error('saturation 需要 0~5');
        saturation = Math.round(saturation * 100) / 100;
    }
    const current = getCurrentThemeMode();
    let targetMode: 'light' | 'dark' | 'both' = current;
    if (args.mode !== undefined && args.mode !== null) {
        const m = String(args.mode);
        if (m !== 'light' && m !== 'dark' && m !== 'both') throw new Error('mode 只能为 light/dark/both');
        targetMode = m;
    }
    const color = normalizeHex(baseColor);
    const needsUIRefresh = targetMode === 'both' || targetMode === current;
    const patch: Partial<Config> = {};
    if (targetMode === 'both' || targetMode === 'light') {
        patch[getCustomColorKey('light')] = color;
        patch[getSaturationKey('light')] = saturation;
        patch['color-plan-light'] = 'custom';
    }
    if (targetMode === 'both' || targetMode === 'dark') {
        patch[getCustomColorKey('dark')] = color;
        patch[getSaturationKey('dark')] = saturation;
        patch['color-plan-dark'] = 'custom';
    }
    await saveConfig(patch);
    if (needsUIRefresh) {
        destroyAllEffects();
        const config = await loadConfig();
        applyCurrentPlan(config);
        initCustomColor(config);
        initSaturation(config);
        initInvert(config);
        initHighContrast(config);
    }
    const modeLabel = targetMode === 'both' ? '浅色+深色' : targetMode === 'dark' ? '深色' : '浅色';
    return `已应用自定义配色：基色 ${color}，饱和度 ${saturation}，目标 ${modeLabel}（当前${current === 'dark' ? '深色' : '浅色'}模式）`;
}
async function applyPresetScheme(raw: Record<string, unknown>): Promise<string> {
    const args = extractParams(raw);
    const rawKey = (typeof args.key === 'string' ? args.key : typeof args.preset === 'string' ? args.preset : '').trim();
    const key = resolvePresetKey(rawKey);
    if (!key) {
        throw new Error(`未知预设 "${rawKey || '(空)'}"。query 示例：{"key":"titaniumspace"}。可选：${buildPresetDescription()}`);
    }
    const current = getCurrentThemeMode();
    let targetMode: 'light' | 'dark' | 'both' = current;
    if (args.mode !== undefined && args.mode !== null) {
        const m = String(args.mode);
        if (m === 'light' || m === 'dark' || m === 'both') targetMode = m;
    }
    {
        const mismatches: string[] = [];
        if (targetMode === 'both' || targetMode === 'light') {
            if (!isPresetValidForMode(key, 'light')) mismatches.push('亮色');
        }
        if (targetMode === 'both' || targetMode === 'dark') {
            if (!isPresetValidForMode(key, 'dark')) mismatches.push('暗色');
        }
        if (mismatches.length > 0) {
            const valid = buildPresetsByMode(current);
            throw new Error(`预设"${key}（${presetNameMap[key]}）"在${mismatches.join('和')}模式下不可用（${modeLabels[presetModes[key]]}）。` +
                `当前模式下可用的预设：${valid}`);
        }
    }
    const needsUIRefresh = targetMode === 'both' || targetMode === current;
    if (targetMode === 'both' || targetMode === 'light') {
        await saveConfig({ 'color-plan-light': 'preset', 'preset-light': key });
    }
    if (targetMode === 'both' || targetMode === 'dark') {
        await saveConfig({ 'color-plan-dark': 'preset', 'preset-dark': key });
    }
    if (needsUIRefresh) {
        destroyAllEffects();
        applyPreset(key);
        const config = await loadConfig();
        initSaturation(config);
        initInvert(config);
        initHighContrast(config);
    }
    const modeLabel = targetMode === 'both' ? '浅色+深色' : targetMode === 'dark' ? '深色' : '浅色';
    return `已切换 ${modeLabel} 模式至预设配色：${key}`;
}
async function applyRandomScheme(raw?: Record<string, unknown>): Promise<string> {
    const args = raw ? extractParams(raw) : {};
    const current = getCurrentThemeMode();
    let targetMode: 'light' | 'dark' | 'both' = current;
    if (args.mode !== undefined && args.mode !== null) {
        const m = String(args.mode);
        if (m === 'light' || m === 'dark' || m === 'both') targetMode = m;
    }
    const needsUIRefresh = targetMode === 'both' || targetMode === current;
    const patch: Partial<Config> = {};
    if (targetMode === 'both' || targetMode === 'light') {
        patch['color-plan-light'] = 'random';
    }
    if (targetMode === 'both' || targetMode === 'dark') {
        patch['color-plan-dark'] = 'random';
    }
    await saveConfig(patch);
    if (needsUIRefresh) {
        destroyAllEffects();
        initRandom();
    }
    const modeLabel = targetMode === 'both' ? '浅色+深色' : targetMode === 'dark' ? '深色' : '浅色';
    return `已启用随机配色 🎲（${modeLabel}模式）`;
}
async function applyFollowTimeScheme(raw: Record<string, unknown>): Promise<string> {
    const args = extractParams(raw);
    const rawColor = typeof args.baseColor === 'string' ? args.baseColor.trim() : '';
    const baseColor = rawColor && isValidHex(rawColor) ? normalizeHex(rawColor) : undefined;
    const current = getCurrentThemeMode();
    let targetMode: 'light' | 'dark' | 'both' = current;
    if (args.mode !== undefined && args.mode !== null) {
        const m = String(args.mode);
        if (m === 'light' || m === 'dark' || m === 'both') targetMode = m;
    }
    const needsUIRefresh = targetMode === 'both' || targetMode === current;
    const patch: Partial<Config> = {};
    if (targetMode === 'both' || targetMode === 'light') {
        patch['color-plan-light'] = 'followtime';
        if (baseColor) patch[getFollowTimeBaseColorKey('light')] = baseColor;
    }
    if (targetMode === 'both' || targetMode === 'dark') {
        patch['color-plan-dark'] = 'followtime';
        if (baseColor) patch[getFollowTimeBaseColorKey('dark')] = baseColor;
    }
    await saveConfig(patch);
    if (needsUIRefresh) {
        destroyAllEffects();
        const config = await loadConfig();
        applyCurrentPlan(config);
        initFollowTime(config);
        initSaturation(config);
        initInvert(config);
        initHighContrast(config);
    }
    const modeLabel = targetMode === 'both' ? '浅色+深色' : targetMode === 'dark' ? '深色' : '浅色';
    return baseColor
        ? `已启用跟随时间配色，基色 ${baseColor}（${modeLabel}模式，当前${current === 'dark' ? '深色' : '浅色'})`
        : `已启用跟随时间配色（${modeLabel}模式，当前${current === 'dark' ? '深色' : '浅色'})`;
}
async function applySaturation(raw: Record<string, unknown>): Promise<string> {
    const args = extractParams(raw);
    const val = args.value !== undefined ? Number(args.value)
        : args.saturation !== undefined ? Number(args.saturation)
        : NaN;
    if (isNaN(val) || val < 0 || val > 5) throw new Error('饱和度需要 0~5 之间的数字。query 示例：{"value":0.7}');
    const current = getCurrentThemeMode();
    const sat = Math.round(val * 100) / 100;
    document.documentElement.style.setProperty('--neo-saturation', String(sat));
    await saveConfig({
        [getSaturationKey('light')]: sat,
        [getSaturationKey('dark')]: sat,
    });
    return `饱和度已设为 ${sat}（当前${current === 'dark' ? '深色' : '浅色'}模式）`;
}
async function applyInvertToggle(raw: Record<string, unknown>): Promise<string> {
    const args = extractParams(raw);
    const enable = typeof args.enable === 'boolean' ? args.enable
        : typeof args.value === 'boolean' ? args.value
        : true;
    const current = getCurrentThemeMode();
    const html = document.documentElement;
    if (enable) html.classList.add('neo-palette-invert');
    else html.classList.remove('neo-palette-invert');
    await saveConfig({
        [getInvertKey('light')]: enable,
        [getInvertKey('dark')]: enable,
    });
    return enable ? '反色已开启' : '反色已关闭';
}
async function applyHighContrastToggle(raw: Record<string, unknown>): Promise<string> {
    const args = extractParams(raw);
    const enable = typeof args.enable === 'boolean' ? args.enable
        : typeof args.value === 'boolean' ? args.value
        : true;
    const current = getCurrentThemeMode();
    const html = document.documentElement;
    if (enable) html.classList.add('neo-palette-highcontrast');
    else html.classList.remove('neo-palette-highcontrast');
    await saveConfig({
        [getHighContrastKey('light')]: enable,
        [getHighContrastKey('dark')]: enable,
    });
    return enable ? '高对比度已开启' : '高对比度已关闭';
}
const craftVarNames: Array<{ key: keyof CraftPreset; cssVar: string; label: string }> = [
    { key: 'background', cssVar: '--b3-theme-background', label: '主背景' },
    { key: 'surface', cssVar: '--b3-theme-surface', label: '面板/侧边栏表面' },
    { key: 'baseColor', cssVar: '--b3-base-color', label: '强调色(按钮/高亮)' },
    { key: 'primary', cssVar: '--b3-theme-primary', label: '主品牌色' },
    { key: 'accent', cssVar: '--b3-theme-accent', label: '次要强调色' },
    { key: 'onBackground', cssVar: '--b3-theme-on-background', label: '编辑区文字' },
    { key: 'onSurface', cssVar: '--b3-theme-on-surface', label: '侧栏/面板文字' },
];
function getCraftPresetKey(mode: 'light' | 'dark'): 'craft-preset-light' | 'craft-preset-dark' {
    return mode === 'dark' ? 'craft-preset-dark' : 'craft-preset-light';
}
async function applyCraftScheme(raw: Record<string, unknown>): Promise<string> {
    const args = extractParams(raw);
    const preset: CraftPreset = {} as CraftPreset;
    for (const { key, label } of craftVarNames) {
        const val = typeof args[key] === 'string' ? (args[key] as string).trim() : '';
        if (!val) throw new Error(`缺少 ${label}（${key}），hex 格式如 "#f8f5f1"`);
        if (!isValidHex(val)) throw new Error(`${label}（${key}）格式无效："${val}"，请用 hex`);
        preset[key] = normalizeHex(val);
    }
    const current = getCurrentThemeMode();
    let targetMode: 'light' | 'dark' | 'both' = current;
    if (args.mode !== undefined && args.mode !== null) {
        const m = String(args.mode);
        if (m === 'light' || m === 'dark' || m === 'both') targetMode = m;
    }
    const needsUIRefresh = targetMode === 'both' || targetMode === current;
    const json = JSON.stringify(preset);
    if (targetMode === 'both' || targetMode === 'light') {
        await saveConfig({ 'craft-preset-light': json, 'color-plan-light': 'craft' });
    }
    if (targetMode === 'both' || targetMode === 'dark') {
        await saveConfig({ 'craft-preset-dark': json, 'color-plan-dark': 'craft' });
    }
    if (needsUIRefresh) {
        destroyAllEffects();
        const config = await loadConfig();
        applyCurrentPlan(config);
        initCraft(config);
        initSaturation(config);
        initInvert(config);
        initHighContrast(config);
    }
    const modeLabel = targetMode === 'both' ? '浅色+深色' : targetMode === 'dark' ? '深色' : '浅色';
    return `已应用全量配色（craft plan）：强调色 ${preset.baseColor}，${modeLabel}模式`;
}
export function registerColorAgentActions(plugin: Plugin): void {
    const presetDesc = buildPresetDescription();
    const modeHint =
        '"暗色/暗夜/深色/dark" 指 dark 主题模式，"亮色/明亮/浅色/light" 指 light 主题模式。' +
        '每次执行配色操作前，如果用户没有明确说要改哪种模式，必须先询问用户：' +
        '"要应用到当前模式、亮色模式、暗色模式，还是两个都改？"（传 mode="dark"/"light"/"both"/不传=当前）。';
    const actions: Array<{
        name: string;
        description: string;
        handler: (args: Record<string, unknown>) => Promise<ActionResult>;
    }> = [
        {
            name: 'applyColorScheme',
            description:
                modeHint +
                '应用自定义配色方案（custom plan），通过单一 hex 基色生成整套配色，SCSS 自动派生其余颜色。' +
                '通过 query 传 JSON：{"baseColor":"#e67e22","saturation":0.7}。' +
                'baseColor 必填（hex 如 "#e67e22"），saturation 选填（0~5，默认1）。' +
                '如果用户提到的是预设名（钛空、深海、琥珀、紫罗兰等），必须用 setPreset，不要自己编 hex 值！' +
                '当用户的换色请求未命中预设名时，必须同时给出三个选项并让用户选：' +
                '"快速换色（只设一个基色） 、完整定制（我帮你精细设计各个颜色） 、先看看预设配色里有没有喜欢的"',
            handler: wrapHandler(applyCustomScheme),
        },
        {
            name: 'setPreset',
            description:
                modeHint +
                '切换到内置预设配色（preset plan）。' +
                '通过 query 传 JSON：{"key":"titaniumspace"}。指定模式时 {"key":"amber","mode":"dark"}。' +
                '所有预设（key=中文名=适用范围）：' + presetDesc + '。' +
                '重要：推荐或切换预设时必须匹配目标模式——"仅暗色"的预设不能用于亮色模式，"仅亮色"的不能用于暗色模式，"亮暗通用"的都可以。' +
                '例如用户要改亮色，只能推荐"亮暗通用"或"仅亮色"的预设，不能推荐"仅暗色"的。' +
                '用户说"换成钛空""切换到深海""暗色改成琥珀""看看有哪些预设"等时用这个。' +
                '注意：预设的饱和度/亮度/基色是固定的，无法调整。切换完成即结束，不要主动建议调整。',
            handler: wrapHandler(applyPresetScheme),
        },
        {
            name: 'randomColor',
            description:
                modeHint +
                '启用随机配色（random plan）。参数可选：{"mode":"dark"}。每次都会随机生成一组全新配色。' +
                '用户说"随机一个""换随机配色""来点随机的""暗色随机"时调用。' +
                '注意：随机配色无法调整饱和度或亮度，切换完成即结束，不要主动建议调整。',
            handler: wrapHandler(applyRandomScheme),
        },
        {
            name: 'followTimeColor',
            description:
                modeHint +
                '启用跟随时间配色（followtime plan）。' +
                '通过 query 传 JSON：{"baseColor":"#e67e22"}，baseColor 可选。' +
                '如果用户未提供基色，先询问"要不要指定一个基色？"',
            handler: wrapHandler(applyFollowTimeScheme),
        },
        {
            name: 'generateCraftPreset',
            description:
                modeHint +
                '生成完整配色方案（craft plan），精细定制界面风格。' +
                '通过 query 传 JSON：{"background":"#f8f5f1","surface":"#f2ece3","baseColor":"#eecb9e","primary":"#b79d7b","accent":"#c58635","onBackground":"#654f2f","onSurface":"#7b5c30"}。' +
                '各字段含义及约束：' +
                'background：编辑区背景色，决定整体基调（亮色浅底/暗色深底）；' +
                'surface：侧栏颜色，与背景要有区别，并且要和谐；' +
                'onBackground：编辑区正文文字颜色，需与背景有足够对比度保证可读（必填，不可省略）；' +
                'onSurface：侧栏/面板文字颜色，必须比 onBackground 更浅（暗色模式下 hex 数值更大、视觉更暗/更淡，亮色模式下数值更小、视觉更暗），独立于 onBackground，需与 surface 有对比度（必填，不可省略，必须单独提供色值）；' +
                'baseColor：基础色/强调色，可深可浅（主题会自动根据其明度调整其上文字颜色以保证可读性），用于按钮/高亮/选中；' +
                'primary：主题色，必须是深色以保文字可读性（会作为文字色出现在彩色元素上）；' +
                'accent：强调色，必须是深色且饱和度不能过低。' +
                '用户要求"完整定制一套配色""帮我设计全部颜色""我要自己配全部颜色""给我设计一个主题"时调用。' +
                '必须由你自行构思各个颜色，不要询问用户具体色值。' +
                '注意：craft 模式下所有颜色是绝对色值，饱和度(--neo-saturation)不起作用，切换完成即结束，不要主动建议调整饱和度或基色。',
            handler: wrapHandler(applyCraftScheme),
        },
        {
            name: 'adjustSaturation',
            description:
                '调整配色饱和度。通过 query 传 JSON：{"value":0.7}。value 0~5（0=灰度，1=默认）。' +
                '仅对自定义配色(custom)和跟随时间(followtime)配色生效。不要在用户使用预设、随机或完整定制(craft)配色时主动建议调饱和度——craft 模式下所有颜色是绝对色值，--neo-saturation 不起作用。' +
                '用户说"降低饱和度""太艳了""饱和度调高"时调用。',
            handler: wrapHandler(applySaturation),
        },
        {
            name: 'toggleInvert',
            description:
                '开关反色效果。通过 query 传 JSON：{"enable":true} 开启，{"enable":false} 关闭。' +
                '用户说"开启反色""关掉反色""反转颜色"时调用。',
            handler: wrapHandler(applyInvertToggle),
        },
        {
            name: 'toggleHighContrast',
            description:
                '开关高对比度。通过 query 传 JSON：{"enable":true} 开启，{"enable":false} 关闭。' +
                '用户说"开高对比度""对比度调高""关掉高对比"时调用。',
            handler: wrapHandler(applyHighContrastToggle),
        },
    ];
    for (const action of actions) {
        plugin.addAgentAction(action);
    }
}
function isNeoTheme(): boolean {
    const mode = document.documentElement.getAttribute('data-theme-mode');
    if (mode === 'dark') {
        return document.documentElement.getAttribute('data-dark-theme') === 'Neo';
    }
    return document.documentElement.getAttribute('data-light-theme') === 'Neo';
}
function wrapHandler(
    fn: (args: Record<string, unknown>) => Promise<string>
): (args: Record<string, unknown>) => Promise<ActionResult> {
    return async (args: Record<string, unknown>) => {
        try {
            if (!isNeoTheme()) {
                return { error: '当前未使用 Neo 主题，配色功能仅在 Neo 主题下可用。请先在「设置 → 外观 → 主题」中切换到 Neo 主题（亮色或暗色均可）。' };
            }
            return { result: await fn(args) };
        } catch (e: unknown) {
            return { error: e instanceof Error ? e.message : String(e) };
        }
    };
}
