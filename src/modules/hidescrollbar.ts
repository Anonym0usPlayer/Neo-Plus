import { getFrontend } from 'siyuan';
const styleId = 'neo-hide-scrollbar-style';
function isMacDesktop(): boolean {
  return getFrontend() === 'desktop' && navigator.platform.includes('Mac');
}
let _savedScrollbarRules: { sheetIndex: number; cssText: string }[] = [];
function removeScrollbarStyles(): void {
  if (!isMacDesktop()) return;
  _savedScrollbarRules = [];
  for (let i = 0; i < document.styleSheets.length; i++) {
    const ss = document.styleSheets[i];
    try {
      for (let j = 0; j < ss.cssRules.length; j++) {
        const rule = ss.cssRules[j] as CSSStyleRule;
        if (rule.selectorText && rule.selectorText.includes('::-webkit-scrollbar')) {
          if (rule.style.width || rule.style.height || rule.style.backgroundColor) {
            _savedScrollbarRules.push({ sheetIndex: i, cssText: rule.cssText });
            ss.deleteRule(j);
            j--;
          }
        }
      }
    } catch (_e) {}
  }
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `*{scrollbar-width:thin!important;scrollbar-color:var(--b3-scroll-color-hover) var(--b3-theme-background-light)!important}`;
    document.head.appendChild(style);
  }
}
let styleObserver: MutationObserver | null = null;
function startObserving(): void {
  removeScrollbarStyles();
  styleObserver = new MutationObserver(() => {
    removeScrollbarStyles();
  });
  styleObserver.observe(document.head, {
    childList: true,
    subtree: true,
  });
}
function stopObserving(): void {
  if (styleObserver) {
    styleObserver.disconnect();
    styleObserver = null;
  }
  const el = document.getElementById(styleId);
  if (el) {
    el.remove();
  }
}
function restoreScrollbarStyles(): void {
  for (const saved of _savedScrollbarRules) {
    const ss = document.styleSheets[saved.sheetIndex];
    if (ss) {
      try {
        ss.insertRule(saved.cssText, ss.cssRules.length);
      } catch (_e) {}
    }
  }
  _savedScrollbarRules = [];
}
export function initHideScrollbar(): void {
  startObserving();
}
export function destroyHideScrollbar(): void {
  stopObserving();
  restoreScrollbarStyles();
}
