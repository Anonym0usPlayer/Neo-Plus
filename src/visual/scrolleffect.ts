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
.protyle-wysiwyg [data-node-id],
.protyle-action,
.callout-info {
    animation:
      neo-scroll-reveal-entry cubic-bezier(0.46, 0.03, 0.52, 0.96) both,
      neo-scroll-reveal-exit  cubic-bezier(0.46, 0.03, 0.52, 0.96) forwards;
    animation-timeline: view(block), view(block);
    animation-range: entry 0% entry 180px, exit calc(100% - 180px) exit 100%;
}
@keyframes neo-scroll-reveal-entry {
  from {
    opacity: 0.2;
    transform: translate(12px, 25px);
    filter: blur(2px);
  }
  to {
    opacity: 1;
    transform: translate(0, 0);
    filter: blur(0);
  }
}
@keyframes neo-scroll-reveal-exit {
  from {
    opacity: 1;
    transform: translate(0, 0);
    filter: blur(0);
  }
  to {
    opacity: 0.5;
    transform: translate(-12px, -25px);
    filter: blur(2px);
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