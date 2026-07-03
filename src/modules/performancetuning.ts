import { fetchListener } from './fetchmonitor';
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
      selectorMatch: (s) => s.includes('.xfaLayer *:required') || s.includes('.xfaLayer :required'),
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
      selectorMatch: (s) => s.includes('.xfaLayer'),
      cssMatch: (c) => c.includes('pointer-events: none'),
    },
    saved: [],
  },
  {
    filter: {
      mediaMatch: (c) => c.includes('forced-colors'),
      selectorMatch: (s) => s.includes(':root') || s.includes('.xfaLayer :required'),
      cssMatch: (c) => c.includes('--xfa-focus-outline') || c.includes('outline: selecteditem'),
    },
    saved: [],
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('#layersView') && s.includes('treeItem') && s.includes('a') && s.includes('>'),
      cssMatch: (c) => c.includes('cursor: pointer'),
    },
    saved: [],
  },
  {
    filter: {
      selectorMatch: (s) => s.includes('.spread') && s.includes(':is(') && s.includes('.page') && s.includes('.pdfViewer') && s.includes('.scrollHorizontal'),
      cssMatch: (c) => c.includes('vertical-align'),
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
function removeMatchingRules(entries?: RuleFilterEntry[]): void {
  const targets = entries ?? _ruleFilters;
  for (const entry of targets) {
    entry.saved = [];
  }
  for (let i = 0; i < document.styleSheets.length; i++) {
    const ss = document.styleSheets[i];
    try {
      processAllRules(ss.cssRules, i, targets, null, null);
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
const _fetchListener = fetchListener();
_fetchListener.on('setUILayout', () => {
  const dynamicEntries = _ruleFilters.filter((e) => e.dynamic);
  if (dynamicEntries.length > 0) {
    removeMatchingRules(dynamicEntries);
  }
});
export function initPerformanceTuning(): void {
  removeMatchingRules();
  _fetchListener.attach();
}
export function destroyPerformanceTuning(): void {
  _fetchListener.detach();
  restoreAllRules();
}
