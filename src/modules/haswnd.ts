import { onFetch, offFetch } from './fetchmonitor';
let _onSetUILayout: (() => void) | null = null;
function updateWndClass(): void {
  document.querySelectorAll('.neo-haswnd').forEach((el) => {
    el.classList.remove('neo-haswnd');
  });
  document.querySelectorAll('[data-type="wnd"]').forEach((wnd) => {
    const parent = wnd.parentElement;
    if (parent) {
      parent.classList.add('neo-haswnd');
    }
  });
}
export function initHasWnd(): void {
  _onSetUILayout = () => {
    updateWndClass();
  };
  onFetch('setUILayout', _onSetUILayout);
  updateWndClass();
}
export function destroyHasWnd(): void {
  if (_onSetUILayout) {
    offFetch('setUILayout', _onSetUILayout);
    _onSetUILayout = null;
  }
  document.querySelectorAll('.neo-haswnd').forEach((el) => {
    el.classList.remove('neo-haswnd');
  });
}
