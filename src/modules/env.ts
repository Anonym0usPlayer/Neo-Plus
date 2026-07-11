import { getFrontend } from 'siyuan';
export function isMobile(): boolean {
  return getFrontend().endsWith('mobile');
}
export function isDesktop(): boolean {
  return getFrontend() === 'desktop';
}
export function isMac(): boolean {
  return getFrontend() === 'desktop' && navigator.platform.includes('Mac');
}
export function initEnv(): void {
  if (isMobile()) {
    document.body.classList.add('neo-mobile');
  }
  if (isDesktop()) {
    document.body.classList.add('neo-desktop');
  }
}
export function destroyEnv(): void {
  document.body.classList.remove('neo-mobile', 'neo-desktop');
}
