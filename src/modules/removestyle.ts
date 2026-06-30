interface StyleRuleFilter {
  selectorMatch: (selector: string) => boolean;
  cssMatch: (cssText: string) => boolean;
  mediaMatch?: (conditionText: string) => boolean;
}
interface SavedRule {
  sheetIndex: number;
  cssText: string;
}
interface RuleFilterEntry {
  filter: StyleRuleFilter;
  saved: SavedRule[];
}
const _ruleFilters: RuleFilterEntry[] = [
  {
    filter: {
      selectorMatch: (s) => s.includes('.b3-snackbars--show'),
      cssMatch: (c) => c.includes('transform'),
    },
    saved: [],
  },
];
function processAllRules(
  rules: CSSRuleList,
  sheetIndex: number,
  entries: RuleFilterEntry[],
  parentRule: CSSRule | null,
  mediaContext: Map<RuleFilterEntry, boolean> | null,
): void {
  for (let j = 0; j < rules.length; j++) {
    const rule = rules[j];
    if (rule instanceof CSSMediaRule) {
      const childContext = new Map<RuleFilterEntry, boolean>();
      for (const entry of entries) {
        const parentMatch = mediaContext?.get(entry) ?? true;
        const selfMatch = entry.filter.mediaMatch?.(rule.conditionText) ?? true;
        childContext.set(entry, parentMatch && selfMatch);
      }
      processAllRules(rule.cssRules, sheetIndex, entries, rule, childContext);
    } else if (rule instanceof CSSStyleRule) {
      for (const entry of entries) {
        const inMatchingMedia = mediaContext?.get(entry) ?? true;
        if (parentRule instanceof CSSMediaRule && !inMatchingMedia) {
          continue;
        }
        if (rule.selectorText && entry.filter.selectorMatch(rule.selectorText)) {
          if (entry.filter.cssMatch(rule.cssText)) {
            entry.saved.push({ sheetIndex, cssText: rule.cssText });
            if (parentRule instanceof CSSMediaRule) {
              parentRule.deleteRule(j);
            } else {
              (rule.parentStyleSheet as CSSStyleSheet).deleteRule(j);
            }
            j--;
            break;
          }
        }
      }
    }
  }
}
function removeMatchingRules(): void {
  for (const entry of _ruleFilters) {
    entry.saved = [];
  }
  for (let i = 0; i < document.styleSheets.length; i++) {
    const ss = document.styleSheets[i];
    try {
      processAllRules(ss.cssRules, i, _ruleFilters, null, null);
    } catch (_e) {}
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
export function initRemoveStyle(): void {
  removeMatchingRules();
}
export function destroyRemoveStyle(): void {
  restoreAllRules();
}
