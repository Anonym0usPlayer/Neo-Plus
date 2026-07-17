import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
const styleId = 'neo-scroll-effect-style';
const scrollEffectCSS = `
.b3-menu__item[data-id="neo-scroll-effect-button"]:not(.b3-menu__item--show):not(.b3-menu__item--current),
.b3-menu__item[data-id="neo-visual-button"]:not(.b3-menu__item--show):not(.b3-menu__item--current) {
  color: var(--b3-theme-accent);
}
.b3-menu__item[data-id="neo-scroll-effect-button"]:not(.b3-menu__item--show):not(.b3-menu__item--current) .b3-menu__icon,
.b3-menu__item[data-id="neo-visual-button"]:not(.b3-menu__item--show):not(.b3-menu__item--current) .b3-menu__icon {
  color: var(--b3-theme-accent);
}
#preview,
.export-img {
  [data-node-id],
  .protyle-title,
  .protyle-action,
  .callout-info {
    animation: none !important;
  }
}
.protyle-breadcrumb ~ .protyle-content {
  [data-node-id],
  .protyle-action,
  .callout-info {
    animation:
      neo-scroll-reveal-entry cubic-bezier(0.46, 0.03, 0.52, 0.96) both,
      neo-scroll-reveal-exit cubic-bezier(0.46, 0.03, 0.52, 0.96) forwards;
    animation-timeline: view(block), view(block);
    animation-range: entry 0% entry 120px, exit calc(100% - 120px) exit 100%;
  }
  .protyle-wysiwyg > [data-node-id]:first-child,
  .protyle-title {
    animation: neo-scroll-reveal-exit cubic-bezier(0.46, 0.03, 0.52, 0.96) forwards;
    animation-timeline: view(block);
    animation-range: exit calc(100% - 50px) exit 100%;
  }
}
@keyframes neo-scroll-reveal-entry {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.9);
    filter: blur(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}
@keyframes neo-scroll-reveal-exit {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
  to {
    opacity: 0;
    transform: translateY(-20px) scale(0.9);
    filter: blur(6px);
  }
}
`;
function injectScrollEffectStyle(): void {
  if (document.getElementById(styleId)) return;
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = scrollEffectCSS;
  document.head.appendChild(style);
}
function removeScrollEffectStyle(): void {
  const style = document.getElementById(styleId);
  if (style) style.remove();
}
function withViewTransition(callback: () => void): void {
  if (document.startViewTransition) {
    document.startViewTransition(callback);
  } else {
    callback();
  }
}
export function initScrollEffect(): void {
  loadConfig().then((config) => {
    if (config['scroll-effect'] === true) {
      document.documentElement.classList.add('neo-visual-scrolleffect');
      injectScrollEffectStyle();
    }
  });
}
export function onScrollEffectClick(): void {
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-visual-scrolleffect');
  withViewTransition(() => {
    if (isActive) {
      destroyScrollEffect();
      saveConfig({ 'scroll-effect': false } as Partial<Config>);
    } else {
      htmlEl.classList.add('neo-visual-scrolleffect');
      injectScrollEffectStyle();
      saveConfig({ 'scroll-effect': true } as Partial<Config>);
    }
  });
}
export function destroyScrollEffect(): void {
  document.documentElement?.classList.remove('neo-visual-scrolleffect');
  removeScrollEffectStyle();
}