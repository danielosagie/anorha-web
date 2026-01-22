"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.win = void 0;
exports.sendAgentLog = sendAgentLog;
const electron_1 = require("electron");
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const convex_client_1 = require("./convex-client");
// Disable GPU Acceleration for Windows 7
if ((0, node_os_1.release)().startsWith('6.1'))
    electron_1.app.disableHardwareAcceleration();
// Set application name for Windows 10+ notifications
if (process.platform === 'win32')
    electron_1.app.setAppUserModelId(electron_1.app.getName());
electron_1.app.setName('Anorha');
if (!electron_1.app.requestSingleInstanceLock()) {
    electron_1.app.quit();
    process.exit(0);
}
exports.win = null;
// Helper to send logs to renderer
function sendAgentLog(message, type = 'info') {
    if (exports.win) {
        exports.win.webContents.send('agent-log', { message, type, timestamp: new Date().toISOString() });
    }
}
// Dist path for production
const distPath = (0, node_path_1.join)(__dirname, '../../.next/server/app');
// Url for dev
const url = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';
const indexHtml = (0, node_path_1.join)(distPath, 'index.html');
function createWindow() {
    return __awaiter(this, void 0, void 0, function* () {
        exports.win = new electron_1.BrowserWindow({
            title: 'Anorha',
            icon: (0, node_path_1.join)(__dirname, '../../assets/logo.png'),
            width: 1200,
            height: 800,
            titleBarStyle: 'hidden', // Frameless on Mac
            trafficLightPosition: { x: 16, y: 16 }, // Adjusted traffic lights
            webPreferences: {
                preload: (0, node_path_1.join)(__dirname, '../preload/index.js'),
                nodeIntegration: false,
                contextIsolation: true,
            },
        });
        if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
            // Wait for Next.js to start
            yield exports.win.loadURL(url);
            // win.webContents.openDevTools() 
        }
        else {
            yield exports.win.loadURL(url);
            // win.loadFile(indexHtml)
        }
        // Make all links open with the browser, not with the application
        exports.win.webContents.setWindowOpenHandler(({ url }) => {
            if (url.startsWith('https:'))
                electron_1.shell.openExternal(url);
            return { action: 'deny' };
        });
    });
}
electron_1.app.whenReady().then(createWindow);
electron_1.app.on('window-all-closed', () => {
    exports.win = null;
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
electron_1.app.on('second-instance', () => {
    if (exports.win) {
        if (exports.win.isMinimized())
            exports.win.restore();
        exports.win.focus();
    }
});
electron_1.app.on('activate', () => {
    const allWindows = electron_1.BrowserWindow.getAllWindows();
    if (allWindows.length) {
        allWindows[0].focus();
    }
    else {
        createWindow();
    }
});
// IPC Handlers
electron_1.ipcMain.handle('auth-worker-start', (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { userId }) {
    console.log('[IPC] auth-worker-start', userId);
    if (!userId)
        return { success: false, error: 'No userId provided' };
    try {
        convex_client_1.convexWorker.start(userId);
        return { success: true };
    }
    catch (e) {
        console.error(e);
        return { success: false, error: e.message };
    }
}));
electron_1.ipcMain.handle('auth-worker-stop', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('[IPC] auth-worker-stop');
    convex_client_1.convexWorker.stop();
    return { success: true };
}));
electron_1.ipcMain.handle('ping', () => 'pong');
//# sourceMappingURL=index.js.map