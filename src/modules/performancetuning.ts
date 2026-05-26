import { onFetch, offFetch } from './fetchmonitor';
interface StyleRuleFilter {
  selectorMatch: (selector: string) => boolean;
  cssMatch: (cssText: string) => boolean;
}
interface SavedRule {
  sheetIndex: number;
  cssText: string;
}
interface RuleFilterEntry {
  filter: StyleRuleFilter;
  saved: SavedRule[];
  /** If true, re-scan and remove on every setUILayout; otherwise only remove once at init. */
  dynamic?: boolean;
}
const _ruleFilters: RuleFilterEntry[] = [
  {
    filter: {
      selectorMatch: (s) => s.includes('::selection'),
      cssMatch: () => true,
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
      cssMatch: () => true,
    },
    saved: [],
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.annotationLayer .textWidgetAnnotation') && s.includes(':is('),
      cssMatch: (c) => true,
    },
    saved: [],
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.annotationLayer .richText') && s.includes('> *'),
      cssMatch: (c) => true,
    },
    saved: [],
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('hljs') && s.includes('::selection'),
      cssMatch: (c) => true,
    },
    saved: [],
    dynamic: true,
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.katex *'),
      cssMatch: (c) => true,
    },
    saved: [],
    dynamic: true,
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.pdfPresentationMode.pdfPresentationModeControls') && s.includes('> *'),
      cssMatch: (c) => c.includes('cursor: default'),
    },
    saved: [],
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.pdfPresentationMode.pdfPresentationModeControls .textLayer span'),
      cssMatch: (c) => c.includes('cursor: default'),
    },
    saved: [],
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.annotationLayer .popup') && s.includes('*'),
      cssMatch: (c) => true,
    },
    saved: [],
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('#dialogContainer') && s.includes('.row') && s.includes('*'),
      cssMatch: () => true,
    },
    saved: [],
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.b3-menu__item') && s.includes('[disabled') && s.includes(':not(.b3-menu__submenu)'),
      cssMatch: (c) => c.includes('opacity'),
    },
    saved: [],
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.file-tree') && s.includes('.sy__file--disablehover') && s.includes('.b3-list-item') && s.includes('*'),
      cssMatch: (c) => c.includes('pointer-events: none'),
    },
    saved: [],
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.xfaLayer') && (s.includes('div') || s.includes('svg')),
      cssMatch: (c) => c.includes('pointer-events: none'),
    },
    saved: [],
  },
];
function processRules(
  rules: CSSRuleList,
  sheetIndex: number,
  entry: RuleFilterEntry,
  parentRule: CSSRule | null,
): void {
  for (let j = 0; j < rules.length; j++) {
    const rule = rules[j];
    if (rule instanceof CSSMediaRule) {
      processRules(rule.cssRules, sheetIndex, entry, rule);
    } else if (rule instanceof CSSStyleRule) {
      if (rule.selectorText && entry.filter.selectorMatch(rule.selectorText)) {
        if (entry.filter.cssMatch(rule.cssText)) {
          entry.saved.push({ sheetIndex, cssText: rule.cssText });
          if (parentRule instanceof CSSMediaRule) {
            parentRule.deleteRule(j);
          } else {
            (rule.parentStyleSheet as CSSStyleSheet).deleteRule(j);
          }
          j--;
        }
      }
    }
  }
}
function removeMatchingRules(entries?: RuleFilterEntry[]): void {
  const targets = entries ?? _ruleFilters;
  for (const entry of targets) {
    entry.saved = [];
    for (let i = 0; i < document.styleSheets.length; i++) {
      const ss = document.styleSheets[i];
      try {
        processRules(ss.cssRules, i, entry, null);
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
let _onSetUILayout: (() => void) | null = null;
function attachListener(): void {
  _onSetUILayout = () => {
    const dynamicEntries = _ruleFilters.filter((e) => e.dynamic);
    if (dynamicEntries.length > 0) {
      removeMatchingRules(dynamicEntries);
    }
  };
  onFetch('setUILayout', _onSetUILayout);
}
function detachListener(): void {
  if (_onSetUILayout) {
    offFetch('setUILayout', _onSetUILayout);
    _onSetUILayout = null;
  }
}
export function initPerformanceTuning(): void {
  removeMatchingRules();
  attachListener();
}
export function destroyPerformanceTuning(): void {
  detachListener();
  restoreAllRules();
}
