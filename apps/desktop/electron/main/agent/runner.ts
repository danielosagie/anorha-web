import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { executablePath } from 'puppeteer-core'; // Or rely on installed chrome? 
// For desktop apps, we often bundle or use a local chrome. 
// Since we installed puppeteer-core, we need to point to a browser.
// For dev, we can use the system browser or download one.
// Let's assume user has Chrome or we use a utility to find it.

puppeteer.use(StealthPlugin());

export class AgentRunner {
    private browser: any = null;

    async runJob(job: any) {
        console.log('[AgentRunner] Starting job:', job.type);

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
            throw error;
        }
    }

    private async ensureBrowser() {
        if (this.browser) return;

        console.log('[AgentRunner] Launching browser...');
        // We need to find a chrome executable. 
        // For macOS, common location:
        const macPath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

        this.browser = await puppeteer.launch({
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
    }

    private async runCreateListing(page: any, payload: any) {
        console.log('Running create listing for:', payload);
        await page.goto('https://facebook.com/marketplace');
        // TODO: Real logic
        await new Promise(r => setTimeout(r, 5000));
    }

    private async runCheckMessages(page: any, payload: any) {
        // TODO
    }

    private async runVerifyListing(page: any, payload: any) {
        // TODO
    }
}

export const agentRunner = new AgentRunner();
