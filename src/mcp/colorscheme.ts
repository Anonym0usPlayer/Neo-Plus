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
import { initFollowSystem, destroyFollowSystem } from '../palette/followsystem';
import { initFollowBanner, destroyFollowBanner } from '../palette/followbanner';
import { isDesktop } from '../modules/env';
import { initRandom, destroyRandom } from '../palette/random';
import { initSaturation, destroySaturation } from '../palette/saturation';
import { initInvert, destroyInvert } from '../palette/invert';
import { initHighContrast, destroyHighContrast } from '../palette/highcontrast';
import { initCraft, destroyCraft, type CraftPreset } from '../palette/craft';
import {
    allPresetKeys,
    presetNameMap,
    presetModes,
    formatPresetDetail,
    buildPresetDescription,
    buildPresetsByMode,
    isPresetValidForMode,
    resolvePresetKey,
} from './presetcolordata';
type ActionResult = { result?: string; error?: string };
const modeLabels: Record<string, string> = { all: '亮暗通用', light: '仅亮色', dark: '仅暗色' };
function isValidHex(s: string): boolean {
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s);
}
function normalizeHex(s: string): string {
    const h = s.replace('#', '');
    if (h.length === 3) return '#' + h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length === 4) return '#' + h[0] + h[0] + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
    return '#' + h.toLowerCase();
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
    destroyFollowSystem();
    destroyFollowBanner();
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
async function applyFollowSystemScheme(raw: Record<string, unknown>): Promise<string> {
    const args = extractParams(raw);
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
        patch['color-plan-light'] = 'followsystem';
        if (saturation !== undefined) patch[getSaturationKey('light')] = saturation;
    }
    if (targetMode === 'both' || targetMode === 'dark') {
        patch['color-plan-dark'] = 'followsystem';
        if (saturation !== undefined) patch[getSaturationKey('dark')] = saturation;
    }
    await saveConfig(patch);
    if (needsUIRefresh) {
        destroyAllEffects();
        const config = await loadConfig();
        applyCurrentPlan(config);
        initFollowSystem(config);
        initSaturation(config);
        initInvert(config);
        initHighContrast(config);
    }
    const modeLabel = targetMode === 'both' ? '浅色+深色' : targetMode === 'dark' ? '深色' : '浅色';
    return await statusPrefix() + '\n' + `已启用跟随系统配色，饱和度 ${saturation ?? '默认'}（${modeLabel}模式，当前${current === 'dark' ? '深色' : '浅色'}），将跟随操作系统强调色`;
}
async function applyFollowBannerScheme(raw: Record<string, unknown>): Promise<string> {
    const args = extractParams(raw);
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
        patch['color-plan-light'] = 'followbanner';
        if (saturation !== undefined) patch[getSaturationKey('light')] = saturation;
    }
    if (targetMode === 'both' || targetMode === 'dark') {
        patch['color-plan-dark'] = 'followbanner';
        if (saturation !== undefined) patch[getSaturationKey('dark')] = saturation;
    }
    await saveConfig(patch);
    if (needsUIRefresh) {
        destroyAllEffects();
        const config = await loadConfig();
        applyCurrentPlan(config);
        initFollowBanner(config);
        initSaturation(config);
        initInvert(config);
        initHighContrast(config);
    }
    const modeLabel = targetMode === 'both' ? '浅色+深色' : targetMode === 'dark' ? '深色' : '浅色';
    return await statusPrefix() + '\n' + `已启用跟随题头图配色，饱和度 ${saturation ?? '默认'}（${modeLabel}模式，当前${current === 'dark' ? '深色' : '浅色'}），将从题头图提取主题色`;
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
    if (enable && current === 'light') {
        throw new Error('反转仅支持暗色（dark）模式，当前为亮色（light）模式，无法开启。请先切换到暗色模式后再试。');
    }
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
    if (enable && current === 'dark') {
        throw new Error('高对比度仅支持亮色（light）模式，当前为暗色（dark）模式，无法开启。请先切换到亮色模式后再试。');
    }
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
    { key: 'background', cssVar: '--b3-theme-background', label: '编辑区背景色（编辑区主底色，决定整体基调）' },
    { key: 'surface', cssVar: '--b3-theme-surface', label: '侧栏背景色（侧栏/面板底色。暗黑模式下 surface 比 background 稍亮，即侧栏比编辑区亮，形成层次）' },
    { key: 'baseColor', cssVar: '--b3-base-color', label: '基色（核心强调色，用于按钮、高亮选中、开关、输入框聚焦环，可深可浅如亮黄或深蓝。极端例子：既可以是亮度为1的亮色，也可以是亮度为0的暗色）' },
    { key: 'primary', cssVar: '--b3-theme-primary', label: '主题色（主品牌色，用于大面积的界面元素，定义主题视觉性格。死限制：明亮模式 oklch 亮度 l≤0.75，暗黑模式 l≥0.68）' },
    { key: 'accent', cssVar: '--b3-theme-accent', label: '强调色（彩色点缀色，用于列表项/文档树标题/文件夹名等，要鲜艳醒目有活力，是主题中色彩最跳的颜色。同时兼顾文字可读性——不能太亮刺眼，也不能太暗发闷。死限制：明亮模式 oklch 亮度 l≤0.75，暗黑模式 l≥0.68）' },
    { key: 'onBackground', cssVar: '--b3-theme-on-background', label: '文字颜色（编辑区正文文字色，与背景对比度要够）' },
    { key: 'onSurface', cssVar: '--b3-theme-on-surface', label: '次要文字颜色（侧栏/面板文字，对比度须低于 onBackground：亮色模式下表现为更浅，暗色模式下表现为更深更弱）' },
];
function getCraftPresetKey(mode: 'light' | 'dark'): 'craft-preset-light' | 'craft-preset-dark' {
    return mode === 'dark' ? 'craft-preset-dark' : 'craft-preset-light';
}
async function applyCraftScheme(raw: Record<string, unknown>): Promise<string> {
    const args = extractParams(raw);
    const preset: CraftPreset = {} as CraftPreset;
    for (const { key, label } of craftVarNames) {
        const val = typeof args[key] === 'string' ? (args[key] as string).trim() : '';
        if (!val) throw new Error(`缺少 ${label}（${key}），支持 hex（如 "#f8f5f1"）或 oklch 相对颜色语法（如 "oklch(from #6b8f32 calc(l - 0.1) calc(c + 0.1) calc(h + 180))"）`);
        preset[key] = isValidHex(val) ? normalizeHex(val) : val;
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
    const saturation = config[getSaturationKey(mode)];
    const parts = [`当前模式：${mode === 'dark' ? '暗色(dark)' : '亮色(light)'}`];
    parts.push(`当前配色方案：${plan === 'craft' ? 'craft（即AI配色方案，上次由AI设计的配色）' : plan}`);
    if (plan === 'preset') {
        parts.push(`当前预设：${config[mode === 'dark' ? 'preset-dark' : 'preset-light'] || 'default'}`);
    }
    if (plan === 'custom') {
        parts.push(`当前基色：${config[getCustomColorKey(mode)]}`);
        parts.push('提示：custom 模式下背景亮度由 Neo 主题内置算法决定，无法单独调整。若要精确控制亮度等全部参数，请使用 craft（AI配色方案）模式。');
    }
    if (plan === 'followtime') {
        const ftBase = config[getFollowTimeBaseColorKey(mode)];
        if (ftBase) parts.push(`跟随时间基色：${ftBase}`);
    }
    if (plan === 'craft') {
        const craftKey: 'craft-preset-light' | 'craft-preset-dark' =
            mode === 'dark' ? 'craft-preset-dark' : 'craft-preset-light';
        const craftRaw = config[craftKey];
        if (craftRaw) {
            try {
                const craft: CraftPreset = JSON.parse(craftRaw);
                parts.push(`craft配色：编辑区背景色${craft.background}，侧栏背景色${craft.surface}，基色${craft.baseColor}，主题色${craft.primary}，强调色${craft.accent}，文字颜色${craft.onBackground}，次要文字颜色${craft.onSurface}`);
            } catch { }
        }
    }
    if (saturation !== undefined && saturation !== null) {
        parts.push(`当前饱和度：${saturation}`);
    }
    parts.push(`高对比度：${highContrast ? '已开启' : '未开启'}（仅亮色生效）`);
    parts.push(`反转：${invert ? '已开启' : '未开启'}（仅暗色生效）`);
    parts.push(`运行平台：${isDesktop() ? '桌面端（支持跟随系统）' : '移动端/Web端（不支持跟随系统）'}`);
    return parts.join('；');
}
async function statusPrefix(): Promise<string> {
    const s = await getColorStatus({});
    return `【当前状态】${s}`;
}
export function registerColorAgentActions(plugin: Plugin): void {
    const knowledgeBase =
        '"暗色/暗夜/深色/dark" 指 dark 主题模式，"亮色/明亮/浅色/light" 指 light 主题模式。' +
        '默认直接应用到当前主题模式（不传 mode），不要询问用户要改哪个模式。' +
        '只有用户明确说要改亮色/暗色/两个都改时，才传 mode="light"/"dark"/"both"。' +
        '配色功能仅在 Neo 主题下可用。' +
        '重要：收到用户的配色需求后，任何配色操作之前，必须无例外地先调"查看配色状态"。禁止跳过这一步直接调用其他配色工具。拿到模式和高对比/反转状态后，给出三个选项让用户选：' +
        '"AI 配色（精细定制全色值） 由你自主构思全套颜色 、自动配色（基色+饱和度） 你根据描述自行设计基色和饱和度 、使用预设配色 在Neo提供的预设中找"。' +
        '用户表态后调用对应 action。选中"自动配色"后根据用户的主题描述自行选一个基色和饱和度（不要默认用1），Neo 会根据基色自动生成背景/侧栏/文字等全套颜色。' +
        '选中"AI 配色"后你自行构思全部颜色，不要再问用户。' +
        '配色应用完成后，根据之前拿到的状态，暗色且反转未开→问"要不要开反转？"，亮色且高对比未开→问"要不要开高对比？"，已开就别问。' +
        '两个平等对待，不要只问其中一个。仅在本次对话首次配色后问一次。' +
        'oklch 相对颜色语法（仅 craft/AI配色 模式可用，autoColorScheme 不支持）：' +
        '何时用 oklch：①用户要求基于现有颜色做调整（如"背景再暗一点""更饱和""色相偏暖/偏冷"）；' +
        '②在预设基础上微调时，用 oklch(from 预设色值 calc(...)) 派生；③需要一组同色系颜色时，从 baseColor 派生 background/surface 等。' +
        '何时不用：能直接选 hex 就直接用 hex（兼容性更强）；autoColorScheme 只需 hex 基色。' +
        '语法：l 亮度 0~1，c 饱和度 0~1，h 色相 0~360（+180 互补色）。支持透明度/可见度：oklch(from #6b8f32 l c h / 0.3) 即可见度 0.3。' +
        '例：oklch(from #6b8f32 calc(l - 0.1) calc(c + 0.1) calc(h + 180)) 更暗更艳互补色，直接传入 generateCraftPreset 任意色值字段。' +
        '注意：oklch 值以原始字符串存入配置，在 CSS 中动态生效。查看配色状态时读回的 oklch 字符串是正常的，不要误以为未被解析或转换失败。后续微调时直接基于读回的色值用 oklch 再次派生即可。' +
        '🔴 oklch 重要警告（绝对禁止）：不要把 oklch 字符串手动转成 hex！浏览器原生支持 oklch(from ...) 这种 CSS 颜色语法，' +
        '系统就是把它作为 CSS 变量值存进去的。看到状态输出里显示 "oklch(from ...)" 字符串是完全正确的，不是 bug，不需要你手动换算 hex。' +
        '你手动换算 hex 反而会丢失精度，完全违背了使用 oklch 的目的。直接传 oklch 字符串，不要试图"计算"它。' +
        '🔴 primary 和 accent 的死限制（必须遵守）：明亮模式 oklch 亮度 l≤0.75，暗黑模式 l≥0.68，违规会导致文字完全看不清。' +
        '🔴 accent（强调色）的核心定位：accent 不是正文色，是彩色点缀色，要鲜艳醒目、有活力，是主题中最跳的颜色。构思时先想：这个颜色够鲜艳、够有辨识度吗？然后再检验文字可读性——不能太亮刺眼，也不能太暗发闷。宁可稍鲜艳也不要太保守。primary 是大面积主题色，accent 是小面积彩色点缀，两者定位不同。' +
        'QA知识库（用户问哪个就只答哪个，不要连带回答其他）：' +
        '①问"为什么开启高对比没效果"→答：IDE风格不支持高对比度，请在Neo+菜单中关闭IDE风格。' +
        '②问"为什么侧栏和编辑区背景色没区别"→答：可能开启了IDE风格，可在Neo+菜单中开启侧栏静音增强区分度。' +
        '③问"Neo-Plus是什么"、"和Neo主题什么关系"→答：Neo+是Neo主题的配套插件，提供界面美化与配色功能。' +
        '④彩色列表/文档树/标题看不清→答：由accent（强调色）决定，需调高accent饱和度或调整明度（亮色模式加深、暗色模式加亮）。' +
        '⑤菜单项悬浮/选中颜色、switch、输入框聚焦环→答：由baseColor决定。' +
        '⑥custom模式要求调整背景亮度→答：custom只能调基色和饱和度，亮度由算法自动计算，要精确控制请用craft。' +
        '⑦问"oklch没有被解析/被存成了文本"→答：oklch(from ...) 本身就是浏览器原生支持的 CSS 颜色语法，以字符串存储后在运行时由浏览器动态渲染，完全正常。绝对不要手动把 oklch 换算成 hex，那会丢失精度。';
    const actions: Array<{
        name: string;
        description: string;
        handler: (args: Record<string, unknown>) => Promise<ActionResult>;
    }> = [
        {
            name: plugin.i18n.colorStatus,
            description:
                '返回当前配色状态 + 配色系统全局知识与行为准则。所有配色操作前必须无例外地先调用此工具，禁止跳过。纯查询，不做任何修改。',
            handler: wrapHandler(async () => {
                const status = await getColorStatus({});
                return knowledgeBase + '\n\n' + status;
            }),
        },
        {
            name: plugin.i18n.autoColorScheme,
            description:
                '调用前必须先调 colorStatus 拿当前模式。' +
                '根据用户的主题描述自行设计一个基色和饱和度，用Neo的配色系统自动生成全套主题色（custom plan）。' +
                '基色（baseColor）：基础色/强调色，浅色深色均可，用于按钮、高亮、选中等位置。' +
                '饱和度（0~5）：复古/素雅→0~1，清新/柔和→1.5~2，活泼/鲜明→2.5~3，浓烈→3.5~5。' +
                '通过 query 传 JSON：{"baseColor":"#e67e22","saturation":0.7}。saturation 选填。' +
                '不要对用户说"请提供基色"或"指定一个颜色"之类的话，你根据用户的主题描述自行构思 hex 值即可。' +
                '如果用户提到预设名（钛空、深海、琥珀等），必须用 setPreset。' +
                'custom模式只能调基色和饱和度，背景亮度由算法决定，用户要调亮度请引导用craft（craft 支持 oklch 相对颜色语法精细调整）。' +
                '用户说"自动配色""快速换色""设个基色"时调用。',
            handler: wrapHandler(applyCustomScheme),
        },
        {
            name: plugin.i18n.setPreset,
            description:
                '调用前必须先调 colorStatus 拿当前模式。' +
                '切换到内置预设配色（preset plan）。通过 query 传 JSON：{"key":"titaniumspace"}。指定模式时 {"key":"amber","mode":"dark"}。' +
                '推荐预设时必须匹配目标模式——"仅暗色"不能用于亮色，"仅亮色"不能用于暗色，"亮暗通用"都可以。' +
                '需查看预设列表时先调用 listPresets，不要自己编预设名。' +
                '用户说"换成钛空""切换到深海""暗色改成琥珀""使用预设配色"时调用。切换完成即结束。',
            handler: wrapHandler(applyPresetScheme),
        },
        {
            name: plugin.i18n.listPresets,
            description:
                '返回所有可用预设的名称、key、适用范围和风格描述。' +
                '用户说"有哪些预设""预设列表"时调用。无参数。',
            handler: wrapHandler(async () => buildPresetDescription()),
        },
        {
            name: plugin.i18n.getPresetDetail,
            description:
                '查询某个预设的完整7个色值（亮/暗各一份）。' +
                '用户要在某预设基础上微调时，先调此工具拿色值，保留不变的色值，只改用户要求的部分，' +
                '然后用 generateCraftPreset 传入完整7个色值。不要用 autoColorScheme。' +
                '通过 query 传 JSON：{"key":"amber"}。',
            handler: wrapHandler(async (raw: Record<string, unknown>) => {
                const args = extractParams(raw);
                const key = resolvePresetKey(typeof args.key === 'string' ? args.key : '');
                if (!key) throw new Error(`未知预设 "${String(args.key ?? '') || '(空)'}"。可选：${buildPresetDescription()}`);
                return formatPresetDetail(key);
            }),
        },
        {
            name: plugin.i18n.randomColor,
            description:
                '调用前必须先调 colorStatus 拿当前模式。' +
                '启用随机配色（random plan）。参数可选：{"mode":"dark"}。' +
                '用户说"随机一个""来点随机的"时调用。切换完成即结束。',
            handler: wrapHandler(applyRandomScheme),
        },
        {
            name: plugin.i18n.followTimeColor,
            description:
                '调用前必须先调 colorStatus 拿当前模式。' +
                '启用跟随时间配色（followtime plan），根据用户描述自行选基色和饱和度。' +
                '饱和度复古/素雅→0~1，清新→1.5~2，活泼→2.5~3，浓烈→3.5~5。' +
                '通过 query 传 JSON：{"baseColor":"#e67e22","saturation":0.7}。',
            handler: wrapHandler(applyFollowTimeScheme),
        },
        {
            name: plugin.i18n.generateCraftPreset,
            description:
                '调用前必须先调 colorStatus 拿当前模式。' +
                '生成完整配色方案（craft plan），精细定制界面。' +
                '通过 query 传 JSON：{"background":"#f8f5f1","surface":"#f2ece3","baseColor":"#eecb9e","primary":"#b79d7b","accent":"#d4732a","onBackground":"#654f2f","onSurface":"#7b5c30"}。' +
                '各字段约束：' +
                'background=编辑区背景色（编辑区主底色，决定整体基调）；' +
                'surface=侧栏背景色（侧栏/面板底色。暗黑模式下 surface 比 background 稍亮，即侧栏比编辑区亮，形成层次）；' +
                'baseColor=基色（核心强调色，用于按钮、高亮选中、开关、聚焦环，可深可浅如亮黄或深蓝。极端例子：既可以是亮度为1的亮色，也可以是亮度为0的暗色）；' +
                'primary=主题色（主品牌色，用于大面积的界面元素，定义主题视觉性格。死限制：明亮模式 oklch 亮度 l≤0.75，暗黑模式 l≥0.68）；' +
                'accent=强调色（彩色点缀色，用于列表项/文档树标题/文件夹名等，要鲜艳醒目有活力，是主题中色彩最跳的颜色。同时兼顾文字可读性——不能太亮刺眼，也不能太暗发闷。死限制：明亮模式 oklch 亮度 l≤0.75，暗黑模式 l≥0.68）；' +
                'onBackground=文字颜色（编辑区正文文字色，与background对比度要够）；' +
                'onSurface=次要文字颜色（侧栏/面板文字，对比度须低于 onBackground：亮色模式下表现为更浅，暗色模式下表现为更深更弱）；' +
                '用户要求"AI配色""设计全套"时调用。你自行构思所有颜色，不要问用户具体色值。' +
                'craft模式饱和度不起作用。' +
                '配色单调/想要更丰富时：①拉开 baseColor、primary、accent 三者之间的色相差距；' +
                '②surface 和 background 不一定要同色系，可以有差异但不突兀且不影响文字可读性。' +
                '例如亮色方案中，background 用米黄色 #fdf6e3，surface 用暖绿色 #eaedc8，形成柔和反差（这只是例子，不代表你要用暖绿，根据你的整体配色自由选择）。' +
                '暗色方案中，background 用低饱和暗紫 #232227，surface 用稍亮的蓝色系 #313842，有碰撞感又不突兀，也保证了文字可读性。' +
                '支持 oklch 相对颜色语法：用户要求"更暗/更亮/更饱和/偏暖/偏冷/互补色"时使用 oklch，' +
                '如 oklch(from #6b8f32 calc(l - 0.1) calc(c + 0.1) calc(h + 180))，支持可见度 /0.3。' +
                '🔴 oklch 字符串就是最终形态，浏览器原生支持，不要手动换算成 hex！',
            handler: wrapHandler(applyCraftScheme),
        },
        {
            name: plugin.i18n.followBannerColor,
            description:
                '调用前必须先调 colorStatus 拿当前模式。' +
                '启用跟随题头图配色（followbanner plan），自动从文档题头图提取主题色。' +
                '饱和度同上，通过 query 传 JSON：{"saturation":0.7}，saturation 选填。' +
                '用户说"跟随题头图""banner配色"时调用。',
            handler: wrapHandler(applyFollowBannerScheme),
        },
        {
            name: plugin.i18n.followSystemColor,
            description:
                '调用前必须先调 colorStatus 拿当前模式。' +
                '启用跟随系统配色（followsystem plan），读取操作系统强调色作为主题色。' +
                '饱和度同上，通过 query 传 JSON：{"saturation":0.7}。仅桌面端有效。' +
                '调用前先查看配色状态，若平台非桌面端则告知用户不支持。' +
                '用户说"跟随系统""用系统配色"时调用。',
            handler: wrapHandler(applyFollowSystemScheme),
        },
        {
            name: plugin.i18n.adjustSaturation,
            description:
                '调整饱和度。通过 query 传 JSON：{"value":0.7}。value 0~5。' +
                '对 custom、followtime、highcontrast 生效。' +
                '注意：高对比度下 custom/followtime 的饱和度影响全局，preset/craft 仅影响四周深色区域。' +
                '不要在 preset、random、craft 模式时主动建议调饱和度。' +
                '用户说"降低饱和度""太艳了"时调用。',
            handler: wrapHandler(applySaturation),
        },
        {
            name: plugin.i18n.toggleInvert,
            description:
                '开关反转。仅暗色模式生效。通过 query 传 JSON：{"enable":true|false}。' +
                '用户说"开启反转""关掉反转""反转颜色"时调用。亮色下用户要求开反转时告知不支持。',
            handler: wrapHandler(applyInvertToggle),
        },
        {
            name: plugin.i18n.toggleHighContrast,
            description:
                '开关高对比度。仅亮色模式生效。开启后四周变深色突出编辑区，深色颜色取自 accent。' +
                '通过 query 传 JSON：{"enable":true|false}。' +
                '用户说"开高对比度""关掉高对比"时调用。暗色下告知不支持。',
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
