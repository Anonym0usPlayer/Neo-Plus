export interface PresetColors {
    baseColor: string;
    primary: string;
    accent: string;
    background: string;
    surface: string;
    onBackground: string;
    onSurface: string;
}
export interface PresetColorData {
    key: string;
    name: string;
    mode: 'all' | 'light' | 'dark';
    style: string;
    light?: PresetColors;
    dark?: PresetColors;
}
const modeLabels: Record<string, string> = { all: '亮暗通用', light: '仅亮色', dark: '仅暗色' };
const presetColors: Record<string, PresetColorData> = {
    default:        { key: 'default',        name: '默认',   mode: 'all',   style: 'Neo主题的默认配色',  light: { baseColor: '#6a85e3', primary: '#6a85e3', accent: '#6a85e3', background: '#ffffff', surface: '#f1f2ff', onBackground: '#181051', onSurface: '#6b668d' }, dark: { baseColor: '#636de1', primary: '#636de1', accent: '#8a93ff', background: '#282c34', surface: '#1e2227', onBackground: '#e1e4ec', onSurface: '#bfbec8' } },
    classic:        { key: 'classic',        name: '经典',   mode: 'all',   style: '经典黑白灰蓝',       light: { baseColor: '#548aee', primary: '#548aee', accent: '#548aee', background: '#feffff', surface: '#f2f2f1', onBackground: '#3b3b3b', onSurface: '#3b3b3bc2' }, dark: { baseColor: '#3a6ab5', primary: '#609eff', accent: '#609eff', background: '#161616', surface: '#2b2b2b', onBackground: '#e6e6e6', onSurface: '#e1e1e1bd' } },
    meridian:       { key: 'meridian',       name: '子午',   mode: 'all',   style: '极致黑白',           light: { baseColor: '#010101', primary: '#010101', accent: '#0050ff', background: '#fefefe', surface: '#ededed', onBackground: '#010101', onSurface: '#01010194' }, dark: { baseColor: '#fefefe', primary: '#fefefe', accent: '#4fff2d', background: '#010101', surface: '#232323', onBackground: '#fefefe', onSurface: '#fefefe92' } },
    amber:          { key: 'amber',          name: '琥珀',   mode: 'all',   style: '琥珀暖棕',           light: { baseColor: '#eecb9e', primary: '#b79d7b', accent: '#c58635', background: '#f8f5f1', surface: '#f2ece3', onBackground: '#654f2f', onSurface: '#7b5c30' }, dark: { baseColor: '#d5ab7c', primary: '#d5ab7c', accent: '#d5ab7c', background: '#221e1e', surface: '#423939', onBackground: '#f4e6d2', onSurface: '#9d8b8b' } },
    dusk:           { key: 'dusk',           name: '黄昏',   mode: 'light', style: '黄昏粉橘',           light: { baseColor: '#c9917c', primary: '#c9917c', accent: '#c9917c', background: '#fff3e5', surface: '#f8e5d3', onBackground: '#575279', onSurface: '#908d9f' } },
    gingko:         { key: 'gingko',         name: '银杏',   mode: 'light', style: '银杏朱黄',           light: { baseColor: '#d55a5a', primary: '#d55a5a', accent: '#d55a5a', background: '#fff5cc', surface: '#fae9b3', onBackground: '#4a2e1f', onSurface: '#7c7065' } },
    lavender:       { key: 'lavender',       name: '薰衣草', mode: 'all',   style: '薰衣草淡紫',         light: { baseColor: '#a095bd', primary: '#a095bd', accent: '#6364dd', background: '#faf4ed', surface: '#f2e9e1', onBackground: '#575279', onSurface: '#797593' }, dark: { baseColor: '#ebc3bc', primary: '#ebc3bc', accent: '#ebc3bc', background: '#151320', surface: '#1f1d2e', onBackground: '#e0def4', onSurface: '#8d89a6' } },
    midnight:       { key: 'midnight',       name: '午夜',   mode: 'dark',  style: '午夜深蓝',           dark: { baseColor: '#4875b3', primary: '#4875b3', accent: '#4875b3', background: '#17181c', surface: '#07080c', onBackground: '#fbfdff', onSurface: '#acadb3' } },
    ocean:          { key: 'ocean',          name: '深海',   mode: 'dark',  style: '深海青绿',           dark: { baseColor: '#b8e53f', primary: '#b8e53f', accent: '#b8e53f', background: '#1e253b', surface: '#11172c', onBackground: '#ebebeb', onSurface: '#919fb1' } },
    opalite:        { key: 'opalite',        name: '蛋白石', mode: 'light', style: '蛋白石灰蓝',         light: { baseColor: '#b8d2e8', primary: '#5e7cc6', accent: '#5e7cc6', background: '#f9f7e4', surface: '#f0efd0', onBackground: '#336260', onSurface: '#6c8687' } },
    oxygen:         { key: 'oxygen',         name: '氧',     mode: 'dark',  style: '氧系暖灰',           dark: { baseColor: '#efa685', primary: '#efa685', accent: '#efa685', background: '#272e33', surface: '#364852', onBackground: '#e2dac5', onSurface: '#d3cab4' } },
    sakura:         { key: 'sakura',         name: '樱花',   mode: 'light', style: '樱花淡粉',           light: { baseColor: '#ffcaca', primary: '#e68e94', accent: '#cf8b8b', background: '#fffaf4', surface: '#ffede7', onBackground: '#56487c', onSurface: '#7c758d' } },
    twilight:       { key: 'twilight',       name: '暮光',   mode: 'dark',  style: '暮光紫蓝',           dark: { baseColor: '#b7c9ff', primary: '#b7c9ff', accent: '#8ca9ff', background: '#1e2030', surface: '#24273a', onBackground: '#c5cff5', onSurface: '#8f97b7' } },
    wilderness:     { key: 'wilderness',     name: '旷野',   mode: 'all',   style: '旷野青绿',           light: { baseColor: '#beea9d', primary: '#74b49a', accent: '#008e9e', background: '#fdf6e3', surface: '#eaedc8', onBackground: '#46687c', onSurface: '#6f8892' }, dark: { baseColor: '#d8ed8d', primary: '#d8ed8d', accent: '#62e9b6', background: '#19393a', surface: '#214b4c', onBackground: '#dee2b9', onSurface: '#8c9d80' } },
    everbliss:      { key: 'everbliss',      name: '岁禧',   mode: 'all',   style: '岁禧朱红',           light: { baseColor: '#de6358', primary: '#f06255', accent: '#f06255', background: '#fefaf0', surface: '#f4ebd2', onBackground: '#4d3d5f', onSurface: '#4d3d5fa2' }, dark: { baseColor: '#c5594a', primary: '#d55f4f', accent: '#d55f4f', background: '#17151c', surface: '#2d2935', onBackground: '#e3c9b0', onSurface: '#e3c9b0a2' } },
    aerisland:      { key: 'aerisland',      name: '空屿',   mode: 'all',   style: '空屿青蓝',           light: { baseColor: '#a7e1da', primary: '#4fbdb0', accent: '#2ea5a2', background: '#f7fcf5', surface: '#e5efdf', onBackground: '#0c544c', onSurface: '#09423ba2' }, dark: { baseColor: '#3c8681', primary: '#44a197', accent: '#44a197', background: '#12161f', surface: '#252b3b', onBackground: '#c6c9b3', onSurface: '#c6c9b3a2' } },
    zerith:         { key: 'zerith',         name: '零域',   mode: 'all',   style: '零域冷绿',           light: { baseColor: '#d6eb53', primary: '#8bc600', accent: '#73a400', background: '#f7fbfb', surface: '#e5edec', onBackground: '#265970', onSurface: '#265970a2' }, dark: { baseColor: '#b4cb26', primary: '#dbf611', accent: '#dbf611', background: '#0d1721', surface: '#1c2d3c', onBackground: '#bfd1cc', onSurface: '#bfd1cca2' } },
    stellula:       { key: 'stellula',       name: '星漪',   mode: 'all',   style: '星漪蓝青',           light: { baseColor: '#97dbde', primary: '#48b2ba', accent: '#3ea2a9', background: '#fff8f2', surface: '#e0ece8', onBackground: '#424074', onSurface: '#373379a2' }, dark: { baseColor: '#3c7e83', primary: '#fc8b60', accent: '#fc8b60', background: '#232227', surface: '#313842', onBackground: '#e6cfbc', onSurface: '#e6cfbca2' } },
    vael:           { key: 'vael',           name: '远岫',   mode: 'all',   style: '远岫灰蓝',           light: { baseColor: '#aacde1', primary: '#5591b2', accent: '#31a7df', background: '#fff9ef', surface: '#f7eddc', onBackground: '#2a556d', onSurface: '#2a556db3' }, dark: { baseColor: '#4f8873', primary: '#7ec2a6', accent: '#7ec2a6', background: '#1b2328', surface: '#29353c', onBackground: '#bfd3ca', onSurface: '#bfd3cab3' } },
    savor:          { key: 'savor',          name: '写味',   mode: 'all',   style: '写味珊瑚',           light: { baseColor: '#ee705b', primary: '#ee705b', accent: '#ee705b', background: '#ffffff', surface: '#f4f4f3', onBackground: '#37352f', onSurface: '#868686' }, dark: { baseColor: '#ce5f4d', primary: '#ff7d68', accent: '#ff7d68', background: '#2f3437', surface: '#202528', onBackground: '#ebebeb', onSurface: '#81868a' } },
    sugar:          { key: 'sugar',          name: '糖',     mode: 'light', style: '糖系粉红',           light: { baseColor: '#ea566b', primary: '#ea566b', accent: '#ea566b', background: '#f9f8f5', surface: '#f3ede8', onBackground: '#37352f', onSurface: '#8a8682' } },
    salt:           { key: 'salt',           name: '盐',     mode: 'light', style: '盐系青灰',           light: { baseColor: '#007a95', primary: '#252830', accent: '#007a95', background: '#eaf2f2', surface: '#d7e0df', onBackground: '#252931', onSurface: '#5a5355' } },
    starry:         { key: 'starry',         name: '星穹',   mode: 'dark',  style: '星穹暗紫',           dark: { baseColor: '#707299', primary: '#aeb1ea', accent: '#aeb1ea', background: '#3a3845', surface: '#2f2e38', onBackground: '#ffe8d9', onSurface: '#d8c0ae' } },
    tundra:         { key: 'tundra',         name: '苔原',   mode: 'light', style: '苔原青绿',           light: { baseColor: '#2aa198', primary: '#2aa198', accent: '#2aa198', background: '#fdf6e3', surface: '#eee8d5', onBackground: '#43555c', onSurface: '#5b7179' } },
    abyss:          { key: 'abyss',          name: '深渊',   mode: 'dark',  style: '深渊荧青',           dark: { baseColor: '#28ece9', primary: '#28ece9', accent: '#28ece9', background: '#001e26', surface: '#032731', onBackground: '#d4eff1', onSurface: '#a1bcbe' } },
    violet:         { key: 'violet',         name: '紫罗兰', mode: 'light', style: '紫罗兰紫',           light: { baseColor: '#ad7a97', primary: '#ad7a97', accent: '#c35794', background: '#f8f6ff', surface: '#efebff', onBackground: '#160045', onSurface: '#5b4785' } },
    titaniumspace:  { key: 'titaniumspace',  name: '钛空',   mode: 'all',   style: '钛空蓝灰',           light: { baseColor: '#7287fd', primary: '#5e73e9', accent: '#5e73e9', background: '#eef1f5', surface: '#dce0e8', onBackground: '#4c4f69', onSurface: '#6c6f85' }, dark: { baseColor: '#90a0ff', primary: '#90a0ff', accent: '#90a0ff', background: '#262c37', surface: '#3a4353', onBackground: '#eceff4', onSurface: '#eceff49e' } },
    firefly:        { key: 'firefly',        name: '萤火',   mode: 'dark',  style: '萤火青绿',           dark: { baseColor: '#cef698', primary: '#cef698', accent: '#cef698', background: '#19192e', surface: '#212037', onBackground: '#e0ead3', onSurface: '#e0ead3d0' } },
    songyan:        { key: 'songyan',        name: '松烟',   mode: 'dark',  style: '松烟金黄',           dark: { baseColor: '#fff29d', primary: '#fff29d', accent: '#fff29d', background: '#2b383a', surface: '#364548', onBackground: '#fff8dd', onSurface: '#fff9debc' } },
};
export const allPresetKeys: string[] = Object.keys(presetColors);
export const presetNameMap: Record<string, string> = Object.fromEntries(Object.values(presetColors).map(p => [p.key, p.name]));
export const presetModes: Record<string, 'all' | 'light' | 'dark'> = Object.fromEntries(Object.values(presetColors).map(p => [p.key, p.mode]));
const presetStyleDesc: Record<string, string> = Object.fromEntries(Object.values(presetColors).map(p => [p.key, p.style]));
const nameToKey: Record<string, string> = Object.fromEntries(
    Object.entries(presetNameMap).map(([k, v]) => [v, k])
);
export function getPresetColors(key: string): PresetColorData | undefined {
    return presetColors[key];
}
export function buildPresetDescription(): string {
    return allPresetKeys.map(k => {
        const p = presetColors[k];
        return `${k}（${p.name}，${p.style}，${modeLabels[p.mode]}）`;
    }).join('、');
}
export function buildPresetsByMode(mode: 'light' | 'dark'): string {
    return allPresetKeys
        .filter(k => presetModes[k] === 'all' || presetModes[k] === mode)
        .map(k => `${k}（${presetNameMap[k]}，${presetStyleDesc[k]}）`)
        .join('、');
}
export function isPresetValidForMode(key: string, mode: 'light' | 'dark'): boolean {
    const m = presetModes[key];
    return m === 'all' || m === mode;
}
export function resolvePresetKey(input: string): string | null {
    const lower = input.trim().toLowerCase();
    if (allPresetKeys.includes(lower)) return lower;
    if (nameToKey[input.trim()]) return nameToKey[input.trim()];
    return null;
}
export function formatPresetDetail(key: string): string {
    const data = getPresetColors(key);
    if (!data) return `未找到预设 "${key}"`;
    const parts: string[] = [`预设「${data.name}」(${key}) 的完整配色参数：`];
    if (data.light) {
        const c = data.light;
        parts.push(`亮色模式：baseColor=${c.baseColor} primary=${c.primary} accent=${c.accent} background=${c.background} surface=${c.surface} onBackground=${c.onBackground} onSurface=${c.onSurface}`);
    }
    if (data.dark) {
        const c = data.dark;
        parts.push(`暗色模式：baseColor=${c.baseColor} primary=${c.primary} accent=${c.accent} background=${c.background} surface=${c.surface} onBackground=${c.onBackground} onSurface=${c.onSurface}`);
    }
    parts.push('提示：在预设基础上微调等于使用 craft 模式。保留不需要改的色值不变，只修改用户要求调整的那几个色值，然后调用 generateCraftPreset 传入完整的 7 个色值（含未修改的原始色值）来应用。不要用 autoColorScheme，那会丢失其他 6 个色值导致效果完全不同。');
    parts.push('craft 模式支持 oklch 相对颜色语法：用户要求"更暗/更亮/更饱和/偏暖/偏冷"时使用。语法：oklch(from #6b8f32 l c h) 将 hex 转为 oklch，调整亮度 l(0~1)、饱和度 c(0~1)、色相 h(0~360)。例如 oklch(from #6b8f32 calc(l - 0.1) calc(c + 0.1) calc(h + 180)) 得到更暗更饱和的互补色，支持可见度 /0.3，直接传入 generateCraftPreset 即可。能直接选 hex 就不用 oklch（hex 兼容性更强）。🔴 oklch 字符串就是最终形态，浏览器原生支持，不要手动换算成 hex！');
    return parts.join('\n');
}
