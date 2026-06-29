import fs from 'node:fs';
import path from 'node:path';

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

    const programFiles = process.env.PROGRAMFILES;
    const programFilesX86 = process.env['PROGRAMFILES(X86)'];
    const localAppData = process.env.LOCALAPPDATA;
    const windowsCandidates: Array<[string | undefined, string[]]> = [
        [programFiles, ['Google', 'Chrome', 'Application', 'chrome.exe']],
        [programFilesX86, ['Google', 'Chrome', 'Application', 'chrome.exe']],
        [localAppData, ['Google', 'Chrome', 'Application', 'chrome.exe']],
        [programFiles, ['Microsoft', 'Edge', 'Application', 'msedge.exe']],
        [programFilesX86, ['Microsoft', 'Edge', 'Application', 'msedge.exe']]
    ];
    for (const [base, segments] of windowsCandidates) {
        if (base) {
            possiblePaths.push(path.join(base, ...segments));
        }
    }

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
