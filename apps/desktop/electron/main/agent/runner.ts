import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { sendAgentLog } from "../index";
import { findChromeExecutable } from "./browser-utils";

puppeteer.use(StealthPlugin());

export class AgentRunner {
    private browser: any = null;

    async runJob(job: any) {
        console.log('[AgentRunner] Starting job:', job.type);
        sendAgentLog(`[AgentRunner] Starting job: ${job.type}`, 'info');

        try {
            await this.ensureBrowser();

            const page = await this.browser.newPage();
            await page.setViewport({ width: 1280, height: 800 });

            // Basic router based on job type
            switch (job.type) {
                case 'create_listing':
                    await this.runCreateListing(page, job.payload);
                    break;
                case 'check_messages':
                    await this.runCheckMessages(page, job.payload);
                    break;
                case 'verify_listing':
                    await this.runVerifyListing(page, job.payload);
                    break;
                default:
                    console.warn('Unknown job type:', job.type);
                    // Just go to google as a test
                    await page.goto('https://whatismybrowser.com');
                    await new Promise(r => setTimeout(r, 5000));
            }

            await page.close();
            return { status: 'success', message: 'Job executed' };

        } catch (error: any) {
            console.error('[AgentRunner] Error:', error);
            sendAgentLog(`[AgentRunner] Error: ${error.message}`, 'error');
            throw error;
        }
    }

    private async ensureBrowser() {
        if (this.browser) return;

        console.log('[AgentRunner] Launching browser...');
        sendAgentLog('[AgentRunner] Launching browser...', 'info');

        let foundPath = '';
        try {
            foundPath = findChromeExecutable();
            console.log(`[AgentRunner] Found browser at: ${foundPath}`);
        } catch (error: any) {
            const msg = `[AgentRunner] CRITICAL: ${error.message}`;
            console.error(msg);
            sendAgentLog(msg, 'error');
            throw error;
        }

        sendAgentLog(`[AgentRunner] Using browser: ${foundPath}`, 'success');

        try {
            this.browser = await puppeteer.launch({
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
        } catch (e: any) {
            console.error('[AgentRunner] Failed to launch puppeteer:', e);
            sendAgentLog(`[AgentRunner] Launch Failed: ${e.message}`, 'error');
            throw e;
        }

        this.browser.on('disconnected', () => {
            console.log('[AgentRunner] Browser disconnected');
            this.browser = null;
        });
    }

    private async runCreateListing(page: any, payload: any) {
        sendAgentLog('[AgentRunner] specialized: create_listing', 'info');
        console.log('Running create listing for:', payload);

        sendAgentLog('[AgentRunner] Navigating to Facebook Marketplace...', 'info');
        await page.goto('https://www.facebook.com/marketplace', { waitUntil: 'networkidle2' });

        sendAgentLog('[AgentRunner] Loaded Facebook. Waiting 30s for user to see...', 'success');

        // Wait long enough for the user to see the window
        await new Promise(r => setTimeout(r, 30000));
    }

    private async runCheckMessages(page: any, payload: any) {
        sendAgentLog('[AgentRunner] specialized: check_messages', 'info');
        await page.goto('https://m.facebook.com/messages');
        await new Promise(r => setTimeout(r, 10000));
    }

    private async runVerifyListing(page: any, payload: any) {
        sendAgentLog('[AgentRunner] specialized: verify_listing', 'info');
        await page.goto('https://www.facebook.com/marketplace');
        await new Promise(r => setTimeout(r, 10000));
    }
}

export const agentRunner = new AgentRunner();
