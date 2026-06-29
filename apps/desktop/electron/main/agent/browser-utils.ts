import fs from 'node:fs';

export function findChromeExecutable(): string {
    const possiblePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        '/usr/bin/google-chrome',
        '/usr/local/bin/google-chrome',
        '/opt/google/chrome/google-chrome'
    ];

    for (const path of possiblePaths) {
        try {
            if (fs.existsSync(path)) {
                return path;
            }
        } catch (error) {
            console.warn(`Error checking path ${path}:`, error);
        }
    }

    throw new Error('Chrome executable not found. Please install Google Chrome.');
}
