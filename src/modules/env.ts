import { getFrontend } from 'siyuan';
function isMobile(): boolean {
  return getFrontend().endsWith('mobile');
}
export function initEnv(): void {
  if (isMobile()) {
    document.body.classList.add('neo-mobile');
  }
}
export function destroyEnv(): void {
  document.body.classList.remove('neo-mobile');
}
