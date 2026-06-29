import { resolve, relative, isAbsolute, sep } from 'node:path';
import { app } from 'electron';
import { chromium, type Browser, type Page } from 'playwright-core';
import { sendAgentLog } from '../index';
import { findChromeExecutable } from './browser-utils';
import type { BrowserRecipe } from './recipe-store';

// Constrain any recipe-supplied file path (storage state, uploads) to the
// app-owned userData directory so a crafted recipe cannot read arbitrary files.
function assertAppOwnedPath(filePath: string, label: string): string {
    const root = resolve(app.getPath('userData'));
    const resolved = resolve(root, filePath);
    const rel = relative(root, resolved);
    if (rel === '' || rel.startsWith('..') || isAbsolute(rel) || rel.split(sep)[0] === '..') {
        throw new Error(`[PlaywrightRunner] ${label} must be inside the app data directory`);
    }
    return resolved;
}

export class PlaywrightRecipeRunner {
    private browser: Browser | null = null;

    async run(recipe: BrowserRecipe, inputs?: Record<string, any>) {
        sendAgentLog(`[PlaywrightRunner] Running recipe ${recipe.id}`, 'info');

        const resolveValue = (value: string) => {
            if (!inputs) return value;
            return value.replace(/\{\{(.*?)\}\}/g, (_, key) => {
                const trimmed = String(key).trim();
                return inputs[trimmed] !== undefined ? String(inputs[trimmed]) : '';
            });
        };

        const browser = await this.ensureBrowser();
        const context = await browser.newContext({
            storageState: recipe.storageStateRef
                ? assertAppOwnedPath(recipe.storageStateRef, 'storageStateRef')
                : undefined,
        });
        const page = await context.newPage();

        try {
            for (const step of recipe.steps) {
                await this.executeStep(page, step, resolveValue);
            }

            if (recipe.expectedChecks?.length) {
                for (const check of recipe.expectedChecks) {
                    const expectedValue = resolveValue(check.value);
                    const selector = check.selector ? resolveValue(check.selector) : undefined;
                    if (check.type === 'url_contains') {
                        const url = page.url();
                        if (!url.includes(expectedValue)) {
                            throw new Error(`Expected URL to contain ${expectedValue}`);
                        }
                    }
                    if (check.type === 'text') {
                        if (selector) {
                            await page.waitForSelector(selector, { timeout: 5000 });
                            const text = await page.locator(selector).innerText();
                            if (!text.includes(expectedValue)) {
                                throw new Error(`Expected text '${expectedValue}' in ${selector}`);
                            }
                        } else {
                            const content = await page.content();
                            if (!content.includes(expectedValue)) {
                                throw new Error(`Expected page to include text '${expectedValue}'`);
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

    private async executeStep(
        page: Page,
        step: BrowserRecipe['steps'][number],
        resolveValue: (value: string) => string,
    ) {
        switch (step.action) {
            case 'goto':
                await page.goto(resolveValue(step.url), { waitUntil: 'domcontentloaded' });
                return;
            case 'click':
                await page.click(resolveValue(step.selector));
                return;
            case 'fill':
                await page.fill(resolveValue(step.selector), resolveValue(step.value));
                return;
            case 'press':
                await page.press(resolveValue(step.selector), resolveValue(step.key));
                return;
            case 'wait_for':
                await page.waitForSelector(resolveValue(step.selector), { timeout: step.timeoutMs || 10_000 });
                return;
            case 'expect_text':
                if (step.selector) {
                    const selector = resolveValue(step.selector);
                    await page.waitForSelector(selector, { timeout: 5000 });
                    const text = await page.locator(selector).innerText();
                    const expected = resolveValue(step.text);
                    if (!text.includes(expected)) {
                        throw new Error(`Expected '${expected}' in ${selector}`);
                    }
                } else {
                    const content = await page.content();
                    const expected = resolveValue(step.text);
                    if (!content.includes(expected)) {
                        throw new Error(`Expected '${expected}' in page content`);
                    }
                }
                return;
            case 'upload':
                await page.setInputFiles(resolveValue(step.selector), assertAppOwnedPath(resolveValue(step.path), 'upload.path'));
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
