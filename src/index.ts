import { Plugin } from 'siyuan';
import { NeoPlusController } from './main/guard';
import { configKey } from './main/data';
import { registerColorAgentActions } from './mcp/colorscheme';
export default class NeoPlusPlugin extends Plugin {
  private controller: NeoPlusController | null = null;
  onload(): void {
    this.controller = new NeoPlusController(this);
    this.controller.init();
    registerColorAgentActions(this);
  }
  onunload(): void {
    this.controller?.destroy();
    this.controller = null;
  }
  uninstall(): void {
    this.removeData(configKey);
  }
}
