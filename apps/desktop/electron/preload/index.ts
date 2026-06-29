import { ipcRenderer, contextBridge } from 'electron'

// ----------------------------------------------------------------------
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
// ----------------------------------------------------------------------
contextBridge.exposeInMainWorld('ipcRenderer', {
    send: (channel: string, data: any) => {
        // whitelist channels
        let validChannels = ['toMain']
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data)
        }
    },
    receive: (channel: string, func: any) => {
        let validChannels = ['fromMain', 'agent-log']
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender` 
            ipcRenderer.on(channel, (event, ...args) => func(...args))
        }
    },
    invoke: (channel: string, data: any) => {
        let validChannels = [
            'auth-worker-start',
            'auth-worker-stop',
            'ping',
            'extension-bridge-status',
            'extension-bridge-rotate-code',
            'extension-bridge-unpair',
            'open-extension-install'
        ]
        if (validChannels.includes(channel)) {
            return ipcRenderer.invoke(channel, data)
        }
    }
})

export { }
