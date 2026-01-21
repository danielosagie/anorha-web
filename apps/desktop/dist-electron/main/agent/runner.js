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
puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
class AgentRunner {
    constructor() {
        this.browser = null;
    }
    runJob(job) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[AgentRunner] Starting job:', job.type);
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
                throw error;
            }
        });
    }
    ensureBrowser() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.browser)
                return;
            console.log('[AgentRunner] Launching browser...');
            // We need to find a chrome executable. 
            // For macOS, common location:
            const macPath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
            this.browser = yield puppeteer_extra_1.default.launch({
                headless: false, // Visible for demo/debug
                executablePath: macPath, // TODO: Make robust across OS
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-infobars',
                    '--window-position=0,0',
                    '--ignore-certifcate-errors',
                    '--ignore-certifcate-errors-spki-list',
                ]
            });
            console.log('[AgentRunner] Browser launched');
            this.browser.on('disconnected', () => {
                this.browser = null;
            });
        });
    }
    runCreateListing(page, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Running create listing for:', payload);
            yield page.goto('https://facebook.com/marketplace');
            // TODO: Real logic
            yield new Promise(r => setTimeout(r, 5000));
        });
    }
    runCheckMessages(page, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO
        });
    }
    runVerifyListing(page, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO
        });
    }
}
exports.AgentRunner = AgentRunner;
exports.agentRunner = new AgentRunner();
//# sourceMappingURL=runner.js.map