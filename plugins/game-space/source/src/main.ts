import './app.css';
import { attachListeners, modifyHost, mountMenu } from './utils';

let unmountMenu = mountMenu();
let restoreHost = modifyHost();
let removeListeners = attachListeners();

// @ts-ignore
scopedThis.Extension.subscribe("lifecycle::dirty-enable", () => {
  unmountMenu = mountMenu();
  restoreHost = modifyHost();
  removeListeners = attachListeners();
});
// @ts-ignore
scopedThis.Extension.subscribe("lifecycle::disable", () => {
  unmountMenu();
  restoreHost();
  removeListeners();
});
