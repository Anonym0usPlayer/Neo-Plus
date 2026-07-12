import { Plugin } from 'siyuan';
import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
import {
    getCurrentThemeMode,
    getCurrentPlan,
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
const modeLabels: Record<string, string> = { all: '亮暗通用', light: '仅亮色', dark: '仅暗色' };
const presets: Array<{ key: string; name: string; mode: 'all' | 'light' | 'dark'; style: string }> = [
    { key: 'default', name: '默认', mode: 'all', style: '跟随思源原生' },
    { key: 'classic', name: '经典', mode: 'all', style: '经典蓝白' },
    { key: 'meridian', name: '子午', mode: 'all', style: '极致黑白' },
    { key: 'amber', name: '琥珀', mode: 'all', style: '琥珀暖棕' },
    { key: 'dusk', name: '黄昏', mode: 'light', style: '黄昏粉橘' },
    { key: 'gingko', name: '银杏', mode: 'light', style: '银杏朱黄' },
    { key: 'lavender', name: '薰衣草', mode: 'all', style: '薰衣草淡紫' },
    { key: 'midnight', name: '午夜', mode: 'dark', style: '午夜深蓝' },
    { key: 'ocean', name: '深海', mode: 'dark', style: '深海青绿' },
    { key: 'opalite', name: '蛋白石', mode: 'light', style: '蛋白石灰蓝' },
    { key: 'oxygen', name: '氧', mode: 'dark', style: '氧系暖灰' },
    { key: 'sakura', name: '樱花', mode: 'light', style: '樱花淡粉' },
    { key: 'twilight', name: '暮光', mode: 'dark', style: '暮光紫蓝' },
    { key: 'wilderness', name: '旷野', mode: 'all', style: '旷野青绿' },
    { key: 'everbliss', name: '岁禧', mode: 'all', style: '岁禧朱红' },
    { key: 'aerisland', name: '空屿', mode: 'all', style: '空屿青蓝' },
    { key: 'zerith', name: '零域', mode: 'all', style: '零域冷绿' },
    { key: 'stellula', name: '星漪', mode: 'all', style: '星漪蓝青' },
    { key: 'vael', name: '远岫', mode: 'all', style: '远岫灰蓝' },
    { key: 'savor', name: '写味', mode: 'all', style: '写味珊瑚' },
    { key: 'sugar', name: '糖', mode: 'light', style: '糖系粉红' },
    { key: 'salt', name: '盐', mode: 'light', style: '盐系青灰' },
    { key: 'starry', name: '星穹', mode: 'dark', style: '星穹暗紫' },
    { key: 'tundra', name: '苔原', mode: 'light', style: '苔原青绿' },
    { key: 'abyss', name: '深渊', mode: 'dark', style: '深渊荧青' },
    { key: 'violet', name: '紫罗兰', mode: 'light', style: '紫罗兰紫' },
    { key: 'titaniumspace', name: '钛空', mode: 'all', style: '钛空蓝灰' },
    { key: 'firefly', name: '萤火', mode: 'dark', style: '萤火青绿' },
    { key: 'songyan', name: '松烟', mode: 'dark', style: '松烟金黄' },
];
const allPresetKeys = presets.map(p => p.key);
const presetNameMap: Record<string, string> = Object.fromEntries(presets.map(p => [p.key, p.name]));
const presetModes: Record<string, 'all' | 'light' | 'dark'> = Object.fromEntries(presets.map(p => [p.key, p.mode]));
const presetStyleDesc: Record<string, string> = Object.fromEntries(presets.map(p => [p.key, p.style]));
function buildPresetDescription(): string {
    return allPresetKeys.map(k => `${k}（${presetNameMap[k] || k}，${presetStyleDesc[k] || ''}，${modeLabels[presetModes[k]]}）`).join('、');
}
function buildPresetsByMode(mode: 'light' | 'dark'): string {
    return allPresetKeys
        .filter(k => presetModes[k] === 'all' || presetModes[k] === mode)
        .map(k => `${k}（${presetNameMap[k] || k}，${presetStyleDesc[k] || ''}）`)
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
    return await statusPrefix() + '\n' + `已应用自定义配色：基色 ${color}，饱和度 ${saturation}，目标 ${modeLabel}（当前${current === 'dark' ? '深色' : '浅色'}模式）`;
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
    return await statusPrefix() + '\n' + `已切换 ${modeLabel} 模式至预设配色：${key}`;
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
    return await statusPrefix() + '\n' + `已启用随机配色 🎲（${modeLabel}模式）`;
}
async function applyFollowTimeScheme(raw: Record<string, unknown>): Promise<string> {
    const args = extractParams(raw);
    const rawColor = typeof args.baseColor === 'string' ? args.baseColor.trim() : '';
    const baseColor = rawColor && isValidHex(rawColor) ? normalizeHex(rawColor) : undefined;
    let saturation: number | undefined;
    if (args.saturation !== undefined && args.saturation !== null) {
        saturation = Number(args.saturation);
        if (isNaN(saturation) || saturation < 0 || saturation > 5) saturation = undefined;
    }
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
        if (saturation !== undefined) patch[getSaturationKey('light')] = saturation;
    }
    if (targetMode === 'both' || targetMode === 'dark') {
        patch['color-plan-dark'] = 'followtime';
        if (baseColor) patch[getFollowTimeBaseColorKey('dark')] = baseColor;
        if (saturation !== undefined) patch[getSaturationKey('dark')] = saturation;
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
    const prefix = await statusPrefix() + '\n';
    return baseColor
        ? prefix + `已启用跟随时间配色，基色 ${baseColor}，饱和度 ${saturation ?? '默认'}（${modeLabel}模式，当前${current === 'dark' ? '深色' : '浅色'})`
        : prefix + `已启用跟随时间配色，饱和度 ${saturation ?? '默认'}（${modeLabel}模式，当前${current === 'dark' ? '深色' : '浅色'})`;
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
    const config = await loadConfig();
    initInvert(config);
    return await statusPrefix() + '\n' + (enable ? '反色已开启' : '反色已关闭');
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
    return await statusPrefix() + '\n' + (enable ? '高对比度已开启' : '高对比度已关闭');
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
    return await statusPrefix() + '\n' + `已应用全量配色（craft plan）：强调色 ${preset.baseColor}，${modeLabel}模式`;
}
async function getColorStatus(_raw: Record<string, unknown>): Promise<string> {
    const config = await loadConfig();
    const mode = getCurrentThemeMode();
    const plan = getCurrentPlan(config, mode);
    const invert = config[getInvertKey(mode)] ?? false;
    const highContrast = config[getHighContrastKey(mode)] ?? false;
    const parts = [`当前模式：${mode === 'dark' ? '暗色(dark)' : '亮色(light)'}`];
    parts.push(`当前配色方案：${plan}`);
    if (plan === 'preset') parts.push(`当前预设：${config[mode === 'dark' ? 'preset-dark' : 'preset-light'] || 'default'}`);
    if (plan === 'custom') parts.push(`当前基色：${config[getCustomColorKey(mode)]}`);
    parts.push(`高对比度：${highContrast ? '已开启' : '未开启'}（仅亮色生效）`);
    parts.push(`反色：${invert ? '已开启' : '未开启'}（仅暗色生效）`);
    return parts.join('；');
}
async function statusPrefix(): Promise<string> {
    const s = await getColorStatus({});
    return `【当前状态】${s}`;
}
export function registerColorAgentActions(plugin: Plugin): void {
    const presetDesc = buildPresetDescription();
    const baseHint =
        '"暗色/暗夜/深色/dark" 指 dark 主题模式，"亮色/明亮/浅色/light" 指 light 主题模式。' +
        '默认直接应用到当前主题模式（不传 mode），不要询问用户要改哪个模式。' +
        '只有用户明确说要改亮色/暗色/两个都改时，才传 mode="light"/"dark"/"both"。';
    const modeHint = baseHint +
        '重要：换色前先调"查看当前配色状态"拿状态（弹窗有中文说明，用户看了就懂），拿到模式和高对比/反色状态后，再给出三个选项让用户选：' +
        '"使用AI配色 设计整套配色方案 、使用自动配色 根据描述自动选基色生成全套主题色 、使用预设配色 在Neo提供的预设配色中寻找接近的方案"。' +
        '用户表态后调用对应 action。选中"自动配色"后根据用户的主题描述自行选一个基色和饱和度（不要默认用1），直接传 baseColor 和 saturation，不要对用户说"指定""给我"之类的话。选中"AI配色"后全部颜色由你构思，不要再问用户。' +
        '最后一步：配色应用完成后，根据之前拿到的状态，暗色且反色未开→问"要不要开反色？"，亮色且高对比未开→问"要不要开高对比？"，已开就别问。两个平等对待，不要只问其中一个。仅在本次对话首次配色后问一次。';
    const actions: Array<{
        name: string;
        description: string;
        handler: (args: Record<string, unknown>) => Promise<ActionResult>;
    }> = [
        {
            name: plugin.i18n.colorStatus,
            description:
                '返回当前亮色/暗色模式、使用的配色方案、高对比度和反色是否已开启。纯查询，不做任何修改。' +
                '配色前先调这个拿状态，拿到后不用再问用户当前是什么模式。',
            handler: wrapHandler(getColorStatus),
        },
        {
            name: plugin.i18n.autoColorScheme,
            description:
                modeHint +
                '通过一个基色自动生成全套主题色（custom plan），根据用户的主题描述自行选择基色和饱和度，直接传 baseColor 和 saturation 参数。' +
                '饱和度根据用户描述的风格灵活决定（0=黑白灰/1=几乎无色/2=淡色/3=明显/4=鲜艳/5=极度鲜艳）：' +
                '复古/素雅/性冷淡→0~1，清新/柔和→1.5~2，活泼/鲜明→2.5~3，浓烈/高饱和→3.5~5。不要默认设1，不要对用户说"指定基色""给我一个基色"。' +
                '通过 query 传 JSON：{"baseColor":"#e67e22","saturation":0.7}。' +
                'baseColor 和 saturation 由你根据主题描述自行填入。saturation 选填（0~5）。' +
                '如果用户提到的是预设名（钛空、深海、琥珀、紫罗兰等），必须用 setPreset，不要自己编 hex 值！' +
                '用户说"自动配色""快速换色""设个基色""根据描述自动选基色"时调用。',
            handler: wrapHandler(applyCustomScheme),
        },
        {
            name: plugin.i18n.setPreset,
            description:
                modeHint +
                '切换到内置预设配色（preset plan）。' +
                '通过 query 传 JSON：{"key":"titaniumspace"}。指定模式时 {"key":"amber","mode":"dark"}。' +
                '所有预设（key=中文名=适用范围）：' + presetDesc + '。' +
                '重要：推荐或切换预设时必须匹配目标模式——"仅暗色"的预设不能用于亮色模式，"仅亮色"的不能用于暗色模式，"亮暗通用"的都可以。' +
                '例如用户要改亮色，只能推荐"亮暗通用"或"仅亮色"的预设，不能推荐"仅暗色"的。' +
                '用户说"换成钛空""切换到深海""暗色改成琥珀""使用预设配色""有哪些预设"等时用这个。切换完成即结束，不要主动建议调整。',
            handler: wrapHandler(applyPresetScheme),
        },
        {
            name: plugin.i18n.randomColor,
            description:
                baseHint +
                '启用随机配色（random plan）。参数可选：{"mode":"dark"}。每次都会随机生成一组全新配色。' +
                '用户说"随机一个""换随机配色""来点随机的""暗色随机"时调用。' +
                '注意：随机配色无法调整饱和度或亮度，切换完成即结束，不要主动建议调整。',
            handler: wrapHandler(applyRandomScheme),
        },
        {
            name: plugin.i18n.followTimeColor,
            description:
                baseHint +
                '启用跟随时间配色（followtime plan），根据用户的主题描述自行选定基色和饱和度。' +
                '饱和度（0=黑白灰/1=几乎无色/2=淡色/3=明显/4=鲜艳/5=极度鲜艳）：复古/素雅→0~1，清新/柔和→1.5~2，活泼/鲜明→2.5~3，浓烈→3.5~5，不要默认设1。' +
                '通过 query 传 JSON：{"baseColor":"#e67e22","saturation":0.7}，两个参数都由你自行填入。',
            handler: wrapHandler(applyFollowTimeScheme),
        },
        {
            name: plugin.i18n.generateCraftPreset,
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
                'accent：强调色，必须是深色且饱和度不能过低，亮度与 primary 接近以确保可读性。' +
                '用户要求"AI配色""设计整套配色方案""帮我设计全部颜色""给我设计一个主题"时调用。' +
                '必须由你自行构思各个颜色，不要询问用户具体色值。' +
                '注意：craft 模式下所有颜色是绝对色值，饱和度(--neo-saturation)不起作用，切换完成即结束，不要主动建议调整饱和度或基色。',
            handler: wrapHandler(applyCraftScheme),
        },
        {
            name: plugin.i18n.adjustSaturation,
            description:
                '调整配色饱和度。通过 query 传 JSON：{"value":0.7}。value 0~5，不同档位视觉参考：' +
                '0=黑白灰（主题色/强调色/基色不受影响）、1=低饱和度，几乎看不出颜色、2=较明显的颜色但饱和度不高、3=明显颜色、4=鲜艳、5=极度鲜艳。' +
                '对自定义配色(custom)、跟随时间(followtime)和高对比度(highcontrast)生效。' +
                '注意：高对比度模式下，自定义/跟随时间配色的饱和度同时影响编辑区和四周深色区域，预设/craft 配色的饱和度仅影响四周深色区域（工具栏/dock栏/窗口背景）。' +
                '不要在用户使用预设、随机或完整定制(craft)配色时主动建议调饱和度——craft 模式下所有颜色是绝对色值，--neo-saturation 不起作用。' +
                '用户说"降低饱和度""太艳了""饱和度调高"时调用。',
            handler: wrapHandler(applySaturation),
        },
        {
            name: plugin.i18n.toggleInvert,
            description:
                '开关反色效果。通过 query 传 JSON：{"enable":true} 开启，{"enable":false} 关闭。' +
                '用户说"开启反色""关掉反色""反转颜色"时调用。',
            handler: wrapHandler(applyInvertToggle),
        },
        {
            name: plugin.i18n.toggleHighContrast,
            description:
                '开关高对比度。仅亮色模式生效，四周变深色突出编辑区。开启后饱和度可调：自定义/跟随时间配色影响全局，预设/craft 仅影响深色区域。通过 query 传 JSON：{"enable":true} 开启，{"enable":false} 关闭。' +
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
