"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// ----------------------------------------------------------------------
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
// ----------------------------------------------------------------------
electron_1.contextBridge.exposeInMainWorld('ipcRenderer', {
    send: (channel, data) => {
        // whitelist channels
        let validChannels = ['toMain'];
        if (validChannels.includes(channel)) {
            electron_1.ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        let validChannels = ['fromMain'];
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender` 
            electron_1.ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
    invoke: (channel, data) => {
        let validChannels = ['auth-worker-start', 'auth-worker-stop', 'ping'];
        if (validChannels.includes(channel)) {
            return electron_1.ipcRenderer.invoke(channel, data);
        }
    }
});
// Also exposing simple version for trusted internal app usage if contextIsolation is false (which we set in main/index.ts for now)
// But since we might move to contextIsolation: true, let's keep the window augmentation.
// @ts-ignore
window.ipcRenderer = electron_1.ipcRenderer;
//# sourceMappingURL=index.js.map