const styleMap = new Map<string, HTMLStyleElement>();
export function ensureCss(key: string, cssText: string): void {
  if (!cssText) return;
  let el = styleMap.get(key);
  if (!el) {
    el = document.createElement('style');
    el.dataset.neoCss = key;
    document.head.appendChild(el);
    styleMap.set(key, el);
  }
  el.textContent = cssText;
}
export function removeCss(key: string): void {
  const el = styleMap.get(key);
  if (el) {
    el.remove();
    styleMap.delete(key);
  }
}
export function removeCssByPrefix(prefix: string): void {
  for (const [key, el] of styleMap) {
    if (key.startsWith(prefix)) {
      el.remove();
      styleMap.delete(key);
    }
  }
}
