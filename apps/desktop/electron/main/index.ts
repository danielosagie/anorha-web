import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { release } from 'node:os'
import { join } from 'node:path'
import { convexWorker } from './convex-client'

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
    app.quit()
    process.exit(0)
}

let win: BrowserWindow | null = null
// Dist path for production
const distPath = join(__dirname, '../../.next/server/app')
// Url for dev
const url = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000'
const indexHtml = join(distPath, 'index.html')

async function createWindow() {
    win = new BrowserWindow({
        title: 'Anorha',
        width: 1200,
        height: 800,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            nodeIntegration: false,
            contextIsolation: true, // Switched to true as we implemented preload properly
        },
    })

    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
        // Wait for Next.js to start
        await win.loadURL(url)
        win.webContents.openDevTools()
    } else {
        await win.loadURL(url)
        // win.loadFile(indexHtml)
    }

    // Make all links open with the browser, not with the application
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:')) shell.openExternal(url)
        return { action: 'deny' }
    })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    win = null
    if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
    if (win) {
        if (win.isMinimized()) win.restore()
        win.focus()
    }
})

app.on('activate', () => {
    const allWindows = BrowserWindow.getAllWindows()
    if (allWindows.length) {
        allWindows[0].focus()
    } else {
        createWindow()
    }
})

// IPC Handlers
ipcMain.handle('auth-worker-start', async (_, { userId }: { userId: string }) => {
    console.log('[IPC] auth-worker-start', userId)
    if (!userId) return { success: false, error: 'No userId provided' }

    try {
        convexWorker.start(userId)
        return { success: true }
    } catch (e: any) {
        console.error(e)
        return { success: false, error: e.message }
    }
})

ipcMain.handle('auth-worker-stop', async () => {
    console.log('[IPC] auth-worker-stop')
    convexWorker.stop()
    return { success: true }
})

ipcMain.handle('ping', () => 'pong')
