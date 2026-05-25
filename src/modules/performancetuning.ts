interface StyleRuleFilter {
  selectorMatch: (selector: string) => boolean;
  cssMatch: (cssText: string) => boolean;
}
interface SavedRule {
  sheetIndex: number;
  cssText: string;
}
const _ruleFilters: { filter: StyleRuleFilter; saved: SavedRule[] }[] = [
  {
    filter: {
      selectorMatch: (s) => s.includes('::selection'),
      cssMatch: (c) => c.includes('background-color: var(--b3-theme-primary-lighter)'),
    },
    saved: [],
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.xfaLeft') || s.includes('.xfaRight'),
      cssMatch: (c) => c.includes('max-height: 100%'),
    },
    saved: [],
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.av__gallery-content') && s.includes('~ div'),
      cssMatch: (c) => c.includes('content: ""'),
    },
    saved: [],
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.xfaTop') || s.includes('.xfaBottom'),
      cssMatch: (c) => c.includes('width: 100%'),
    },
    saved: [],
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.xfaTop') || s.includes('.xfaBottom'),
      cssMatch: (c) => c.includes('flex: 0 1 auto'),
    },
    saved: [],
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.xfaNonInteractive') || s.includes('.xfaDisabled') || s.includes('.xfaReadOnly'),
      cssMatch: (c) => c.includes('background: initial'),
    },
    saved: [],
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('#documentPropertiesOverlay .row > *'),
      cssMatch: (c) => c.includes('min-width: 100px'),
    },
    saved: [],
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('#documentPropertiesOverlay .row > *'),
      cssMatch: (c) => c.includes('text-align: left'),
    },
    saved: [],
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.rect-to-annotation') && s.includes(':not'),
      cssMatch: (c) => c.includes('cursor: inherit'),
    },
    saved: [],
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.grab-to-pan-grab') && s.includes(':not'),
      cssMatch: (c) => c.includes('cursor: inherit'),
    },
    saved: [],
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.xfaLayer *') && !s.includes(':required'),
      cssMatch: (c) => c.includes('color: inherit') && c.includes('font: inherit'),
    },
    saved: [],
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.xfaLayer *:required'),
      cssMatch: (c) => c.includes('outline: 1.5px solid red'),
    },
    saved: [],
  },
  {
    filter: {
      selectorMatch: (s) => s === '.katex *',
      cssMatch: () => true,
    },
    saved: [],
  },
];
function removeMatchingRules(): void {
  for (const entry of _ruleFilters) {
    entry.saved = [];
    for (let i = 0; i < document.styleSheets.length; i++) {
      const ss = document.styleSheets[i];
      try {
        for (let j = 0; j < ss.cssRules.length; j++) {
          const rule = ss.cssRules[j] as CSSStyleRule;
          if (rule.selectorText && entry.filter.selectorMatch(rule.selectorText)) {
            if (entry.filter.cssMatch(rule.cssText)) {
              entry.saved.push({ sheetIndex: i, cssText: rule.cssText });
              ss.deleteRule(j);
              j--;
            }
          }
        }
      } catch (_e) {}
    }
  }
}
function restoreAllRules(): void {
  for (const entry of _ruleFilters) {
    for (const saved of entry.saved) {
      const ss = document.styleSheets[saved.sheetIndex];
      if (ss) {
        try {
          ss.insertRule(saved.cssText, ss.cssRules.length);
        } catch (_e) {}
      }
    }
    entry.saved = [];
  }
}
let _katexObserver: MutationObserver | null = null;
function removeKatexRuleFromSheet(): void {
  for (let i = 0; i < document.styleSheets.length; i++) {
    const ss = document.styleSheets[i];
    try {
      for (let j = 0; j < ss.cssRules.length; j++) {
        const rule = ss.cssRules[j] as CSSStyleRule;
        if (rule.selectorText && rule.selectorText === '.katex *') {
          ss.deleteRule(j);
          return;
        }
      }
    } catch (_e) {}
  }
}
export function initPerformanceTuning(): void {
  removeMatchingRules();
  removeKatexRuleFromSheet();
  if (!_katexObserver) {
    _katexObserver = new MutationObserver(() => {
      removeKatexRuleFromSheet();
      // 检查是否已成功删除，如果是则断开观察器
      let found = false;
      for (let i = 0; i < document.styleSheets.length; i++) {
        const ss = document.styleSheets[i];
        try {
          for (let j = 0; j < ss.cssRules.length; j++) {
            const rule = ss.cssRules[j] as CSSStyleRule;
            if (rule.selectorText && rule.selectorText === '.katex *') {
              found = true;
              break;
            }
          }
        } catch (_e) {}
        if (found) break;
      }
      if (!found && _katexObserver) {
        _katexObserver.disconnect();
        _katexObserver = null;
      }
    });
    _katexObserver.observe(document.head, { childList: true, subtree: true });
  }
}
export function destroyPerformanceTuning(): void {
  restoreAllRules();
  if (_katexObserver) {
    _katexObserver.disconnect();
    _katexObserver = null;
  }
}
