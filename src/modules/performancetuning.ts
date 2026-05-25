let _savedSelectionRules: { sheetIndex: number; cssText: string }[] = [];
function removeSelectionStyle(): void {
  _savedSelectionRules = [];
  for (let i = 0; i < document.styleSheets.length; i++) {
    const ss = document.styleSheets[i];
    try {
      for (let j = 0; j < ss.cssRules.length; j++) {
        const rule = ss.cssRules[j] as CSSStyleRule;
        if (rule.selectorText && rule.selectorText.includes('::selection')) {
          const cssText = rule.cssText;
          if (cssText.includes('background-color: var(--b3-theme-primary-lighter)')) {
            _savedSelectionRules.push({ sheetIndex: i, cssText: rule.cssText });
            ss.deleteRule(j);
            j--;
          }
        }
      }
    } catch (_e) {}
  }
}
function restoreSelectionStyles(): void {
  for (const saved of _savedSelectionRules) {
    const ss = document.styleSheets[saved.sheetIndex];
    if (ss) {
      try {
        ss.insertRule(saved.cssText, ss.cssRules.length);
      } catch (_e) {}
    }
  }
  _savedSelectionRules = [];
}
let styleObserver: MutationObserver | null = null;
function startObserving(): void {
  removeSelectionStyle();
  styleObserver = new MutationObserver(() => {
    removeSelectionStyle();
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
}
export function initPerformanceTuning(): void {
  startObserving();
}
export function destroyPerformanceTuning(): void {
  stopObserving();
  restoreSelectionStyles();
}
