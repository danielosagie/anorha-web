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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentRunner = exports.AgentRunner = void 0;
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
// For desktop apps, we often bundle or use a local chrome. 
// Since we installed puppeteer-core, we need to point to a browser.
// For dev, we can use the system browser or download one.
// Let's assume user has Chrome or we use a utility to find it.
const index_1 = require("../index");
puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
class AgentRunner {
    constructor() {
        this.browser = null;
    }
    runJob(job) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[AgentRunner] Starting job:', job.type);
            (0, index_1.sendAgentLog)(`[AgentRunner] Starting job: ${job.type}`, 'info');
            try {
                yield this.ensureBrowser();
                const page = yield this.browser.newPage();
                yield page.setViewport({ width: 1280, height: 800 });
                // Basic router based on job type
                switch (job.type) {
                    case 'create_listing':
                        yield this.runCreateListing(page, job.payload);
                        break;
                    case 'check_messages':
                        yield this.runCheckMessages(page, job.payload);
                        break;
                    case 'verify_listing':
                        yield this.runVerifyListing(page, job.payload);
                        break;
                    default:
                        console.warn('Unknown job type:', job.type);
                        // Just go to google as a test
                        yield page.goto('https://whatismybrowser.com');
                        yield new Promise(r => setTimeout(r, 5000));
                }
                yield page.close();
                return { status: 'success', message: 'Job executed' };
            }
            catch (error) {
                console.error('[AgentRunner] Error:', error);
                (0, index_1.sendAgentLog)(`[AgentRunner] Error: ${error.message}`, 'error');
                throw error;
            }
        });
    }
    ensureBrowser() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.browser)
                return;
            console.log('[AgentRunner] Launching browser...');
            (0, index_1.sendAgentLog)('[AgentRunner] Launching browser...', 'info');
            const possiblePaths = [
                '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
                '/Applications/Chromium.app/Contents/MacOS/Chromium',
                '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
                '/usr/bin/google-chrome',
                '/usr/local/bin/google-chrome',
                '/opt/google/chrome/google-chrome'
            ];
            let foundPath = '';
            const fs = require('fs');
            for (const path of possiblePaths) {
                try {
                    if (fs.existsSync(path)) {
                        foundPath = path;
                        console.log(`[AgentRunner] Found browser at: ${path}`);
                        break;
                    }
                }
                catch (e) {
                    console.error(`Error checking path ${path}:`, e);
                }
            }
            if (!foundPath) {
                const msg = '[AgentRunner] CRITICAL: Could not find Chrome! Please make sure Google Chrome is installed in /Applications.';
                console.error(msg);
                (0, index_1.sendAgentLog)(msg, 'error');
                throw new Error("Chrome executable not found. Please install Google Chrome.");
            }
            (0, index_1.sendAgentLog)(`[AgentRunner] Using browser: ${foundPath}`, 'success');
            try {
                this.browser = yield puppeteer_extra_1.default.launch({
                    headless: false,
                    executablePath: foundPath,
                    defaultViewport: null, // Allows full size
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-infobars',
                        '--window-position=0,0',
                        '--start-maximized', // Try to start maximized
                        // Security bypasses for testing
                        '--ignore-certificate-errors',
                        '--ignore-certificate-errors-spki-list',
                        '--disable-web-security',
                        '--disable-features=IsolateOrigins,site-per-process'
                    ]
                });
                console.log('[AgentRunner] Browser process started');
            }
            catch (e) {
                console.error('[AgentRunner] Failed to launch puppeteer:', e);
                (0, index_1.sendAgentLog)(`[AgentRunner] Launch Failed: ${e.message}`, 'error');
                throw e;
            }
            this.browser.on('disconnected', () => {
                console.log('[AgentRunner] Browser disconnected');
                this.browser = null;
            });
        });
    }
    runCreateListing(page, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, index_1.sendAgentLog)('[AgentRunner] specialized: create_listing', 'info');
            console.log('Running create listing for:', payload);
            (0, index_1.sendAgentLog)('[AgentRunner] Navigating to Facebook Marketplace...', 'info');
            yield page.goto('https://www.facebook.com/marketplace', { waitUntil: 'networkidle2' });
            (0, index_1.sendAgentLog)('[AgentRunner] Loaded Facebook. Waiting 30s for user to see...', 'success');
            // Wait long enough for the user to see the window
            yield new Promise(r => setTimeout(r, 30000));
        });
    }
    runCheckMessages(page, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, index_1.sendAgentLog)('[AgentRunner] specialized: check_messages', 'info');
            yield page.goto('https://m.facebook.com/messages');
            yield new Promise(r => setTimeout(r, 10000));
        });
    }
    runVerifyListing(page, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, index_1.sendAgentLog)('[AgentRunner] specialized: verify_listing', 'info');
            yield page.goto('https://www.facebook.com/marketplace');
            yield new Promise(r => setTimeout(r, 10000));
        });
    }
}
exports.AgentRunner = AgentRunner;
exports.agentRunner = new AgentRunner();
//# sourceMappingURL=runner.js.map