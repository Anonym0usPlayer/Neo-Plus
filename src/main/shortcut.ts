import { getPlugin } from './guard';
import { switchToPlan } from '../palette/manager';
export function initShortcuts(): void {
  const plugin = getPlugin();
  if (!plugin) return;
  plugin.addCommand({
    langKey: 'random',
    hotkey: '',
    callback: () => {
      switchToPlan('random');
    },
  });
}
export function destroyShortcuts(): void {}
