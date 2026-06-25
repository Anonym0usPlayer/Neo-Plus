import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
const styleId = 'neo-colorful-selection-style';
const selectionCSS = `
:root {
    ::selection {
        color: currentColor;
        background-color: oklch(from currentColor l c h / 0.2);
    }
    .hljs ::selection {
        color: currentColor;
        background-color: oklch(from currentColor l c h / 0.2);
    }
}
`;
function injectSelectionStyle(): void {
  if (document.getElementById(styleId)) return;
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = selectionCSS;
  document.head.appendChild(style);
}
function removeSelectionStyle(): void {
  const style = document.getElementById(styleId);
  if (style) style.remove();
}
export function initColorfulSelection(): void {
  loadConfig().then((config) => {
    if (config['colorful-selection'] === true) {
      document.documentElement.classList.add('neo-element-colorfulselection');
      injectSelectionStyle();
    }
  });
}
export function onColorfulSelectionClick(): void {
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-element-colorfulselection');
  if (isActive) {
    destroyColorfulSelection();
    saveConfig({ 'colorful-selection': false } as Partial<Config>);
  } else {
    htmlEl.classList.add('neo-element-colorfulselection');
    injectSelectionStyle();
    saveConfig({ 'colorful-selection': true } as Partial<Config>);
  }
}
export function destroyColorfulSelection(): void {
  document.documentElement?.classList.remove('neo-element-colorfulselection');
  removeSelectionStyle();
}