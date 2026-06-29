import { chromium, type Browser, type Page } from 'playwright-core';
import { sendAgentLog } from '../index';
import { findChromeExecutable } from './browser-utils';
import type { BrowserRecipe } from './recipe-store';

export class PlaywrightRecipeRunner {
    private browser: Browser | null = null;

    async run(recipe: BrowserRecipe, inputs?: Record<string, any>) {
        sendAgentLog(`[PlaywrightRunner] Running recipe ${recipe.id}`, 'info');

        const browser = await this.ensureBrowser();
        const context = await browser.newContext({
            storageState: recipe.storageStateRef || undefined,
        });
        const page = await context.newPage();

        try {
            for (const step of recipe.steps) {
                await this.executeStep(page, step, inputs);
            }

            if (recipe.expectedChecks?.length) {
                for (const check of recipe.expectedChecks) {
                    if (check.type === 'url_contains') {
                        const url = page.url();
                        if (!url.includes(check.value)) {
                            throw new Error(`Expected URL to contain ${check.value}`);
                        }
                    }
                    if (check.type === 'text') {
                        if (check.selector) {
                            await page.waitForSelector(check.selector, { timeout: 5000 });
                            const text = await page.locator(check.selector).innerText();
                            if (!text.includes(check.value)) {
                                throw new Error(`Expected text '${check.value}' in ${check.selector}`);
                            }
                        } else {
                            const content = await page.content();
                            if (!content.includes(check.value)) {
                                throw new Error(`Expected page to include text '${check.value}'`);
                            }
                        }
                    }
                }
            }

            return { status: 'success', recipeId: recipe.id, url: page.url() };
        } finally {
            await page.close();
            await context.close();
        }
    }

    private async executeStep(page: Page, step: BrowserRecipe['steps'][number], inputs?: Record<string, any>) {
        const resolveValue = (value: string) => {
            if (!inputs) return value;
            return value.replace(/\{\{(.*?)\}\}/g, (_, key) => {
                const trimmed = String(key).trim();
                return inputs[trimmed] !== undefined ? String(inputs[trimmed]) : '';
            });
        };

        switch (step.action) {
            case 'goto':
                await page.goto(step.url, { waitUntil: 'domcontentloaded' });
                return;
            case 'click':
                await page.click(step.selector);
                return;
            case 'fill':
                await page.fill(step.selector, resolveValue(step.value));
                return;
            case 'press':
                await page.press(step.selector, step.key);
                return;
            case 'wait_for':
                await page.waitForSelector(step.selector, { timeout: step.timeoutMs || 10_000 });
                return;
            case 'expect_text':
                if (step.selector) {
                    await page.waitForSelector(step.selector, { timeout: 5000 });
                    const text = await page.locator(step.selector).innerText();
                    if (!text.includes(step.text)) {
                        throw new Error(`Expected '${step.text}' in ${step.selector}`);
                    }
                } else {
                    const content = await page.content();
                    if (!content.includes(step.text)) {
                        throw new Error(`Expected '${step.text}' in page content`);
                    }
                }
                return;
            case 'upload':
                await page.setInputFiles(step.selector, resolveValue(step.path));
                return;
            default:
                throw new Error(`Unsupported recipe step: ${(step as any).action}`);
        }
    }

    private async ensureBrowser(): Promise<Browser> {
        if (this.browser) return this.browser;

        const executablePath = findChromeExecutable();
        sendAgentLog(`[PlaywrightRunner] Using browser: ${executablePath}`, 'info');

        this.browser = await chromium.launch({
            headless: false,
            executablePath,
        });

        this.browser.on('disconnected', () => {
            this.browser = null;
        });

        return this.browser;
    }
}

export const playwrightRunner = new PlaywrightRecipeRunner();
