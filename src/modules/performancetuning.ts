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
function removeKatexUniversalRule(): void {
  const link = document.getElementById('protyleKatexStyle') as HTMLLinkElement | null;
  if (!link) return;
  const sheet = link.sheet;
  if (!sheet) return;
  const rules = sheet.cssRules || sheet.rules;
  if (!rules) return;
  for (let j = 0; j < rules.length; j++) {
    const rule = rules[j] as CSSStyleRule;
    if (rule.selectorText && rule.selectorText === '.katex *') {
      sheet.deleteRule(j);
      return;
    }
  }
}
export function initPerformanceTuning(): void {
  removeMatchingRules();
  removeKatexUniversalRule();
  const link = document.getElementById('protyleKatexStyle') as HTMLLinkElement | null;
  if (link && !link.sheet) {
    link.addEventListener('load', () => removeKatexUniversalRule(), { once: true });
  }
}
export function destroyPerformanceTuning(): void {
  restoreAllRules();
}
