import { getPlugin } from './guard';
import { switchToPlan } from '../palette/manager';
import { onImmersiveModeClick } from '../extension/immersivemode';
import { onVerticalTabsClick } from '../extension/verticaltabs';
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
  plugin.addCommand({
    langKey: 'verticalTabs',
    hotkey: '',
    callback: () => {
      onVerticalTabsClick();
    },
  });
  plugin.addCommand({
    langKey: 'immersiveMode',
    hotkey: '',
    callback: () => {
      onImmersiveModeClick();
    },
  });
}
export function destroyShortcuts(): void {}
