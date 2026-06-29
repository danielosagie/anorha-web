import { ConvexClient } from "convex/browser";
import { app } from "electron";
import * as dotenv from "dotenv";
import { join } from "path";
import { agentRunner } from "./agent/runner";
import { extensionBridge } from "./extension-bridge";
import { recipeStore, type BrowserRecipe } from "./agent/recipe-store";
import { playwrightRunner } from "./agent/playwright-runner";
import { sendAgentLog } from "./index";

// Load environment variables from .env.local if present
dotenv.config({ path: join(__dirname, "../../.env.local") });

const CONVEX_URL = "https://merry-buffalo-800.convex.cloud"; // Hardcoded for production verification
console.log("[ConvexWorker] Hardcoded URL:", CONVEX_URL);
sendAgentLog(`[ConvexWorker] Initialized with URL: ${CONVEX_URL}`);

export class ConvexWorker {
    private client: any; // Using any to bypass strict API typing for now
    private unsubscribe: (() => void) | null = null;
    private userId: string | null = null;

    constructor() {
        console.log("[ConvexWorker] Initializing with URL:", CONVEX_URL);
        this.client = new ConvexClient(CONVEX_URL);
    }

    /**
     * Start listening for jobs for a specific user.
     */
    start(userId: string) {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        this.userId = userId;
        console.log("[ConvexWorker] Starting worker for user:", userId);
        sendAgentLog(`[ConvexWorker] Starting worker for user: ${userId}`, 'success');

        this.unsubscribe = this.client.onUpdate(
            "browserJobs:getPending",
            { userId },
            (pendingJobs: any[]) => {
                this.handlePendingJobs(pendingJobs);
            }
        );
    }

    stop() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        console.log("[ConvexWorker] Stopped worker");
    }

    private async handlePendingJobs(jobs: any[]) {
        if (!jobs || jobs.length === 0) return;

        for (const job of jobs) {
            console.log("[ConvexWorker] Found job:", job._id, job.type);
            sendAgentLog(`[ConvexWorker] Found job: ${job.type} (${job._id})`, 'info');
            await this.processJob(job);
        }
    }

    private async processJob(job: any) {
        try {
            console.log("[ConvexWorker] Processing job...", job._id);
            sendAgentLog(`[ConvexWorker] Processing job ${job._id}...`, 'info');

            // 1. Mark as processing
            await this.client.mutation("browserJobs:startJob", { jobId: job._id });

            // 2. Execute job
            let result: any = null;
            if (job.type === 'explore_session') {
                console.log("[ConvexWorker] Executing explore_session via ExtensionBridge...");
                const activeTab = await extensionBridge.sendRpc('get_active_tab', {});
                const screenshot = await extensionBridge.sendRpc('capture_screenshot', { tabId: activeTab?.id });
                const domSummary = await extensionBridge.sendRpc('get_dom_summary', { tabId: activeTab?.id, maxElements: 200 });
                result = { status: 'success', activeTab, screenshot, domSummary };
            } else if (job.type === 'generate_recipe') {
                const recipe = this.buildRecipe(job);
                recipeStore.save(recipe);
                result = { status: 'success', recipeId: recipe.id };
            } else if (job.type === 'run_recipe') {
                const recipeId = String(job.payload?.recipeId || '');
                const recipe = recipeStore.get(recipeId);
                if (!recipe) throw new Error(`Recipe not found: ${recipeId}`);
                result = await playwrightRunner.run(recipe, job.payload?.inputs || {});
            } else if (job.type === 'report_results') {
                result = { status: 'recorded', payload: job.payload || null };
            } else if (job.type === 'await_human') {
                await extensionBridge.sendRpc('request_consent', {
                    reason: job.payload?.reason || 'Action requires approval',
                    tabId: job.payload?.tabId,
                });
                result = { status: 'awaiting_human' };
            } else {
                // Default to existing puppeteer runner
                console.log("[ConvexWorker] Executing job via AgentRunner...");
                result = await agentRunner.runJob(job);
                console.log("[ConvexWorker] AgentRunner execution done");
            }

            // 3. Mark as complete
            await this.client.mutation("browserJobs:completeJob", {
                jobId: job._id,
                result: result
            });

            console.log("[ConvexWorker] Job completed:", job._id);
            sendAgentLog(`[ConvexWorker] Job completed: ${job._id}`, 'success');
        } catch (error: any) {
            console.error("[ConvexWorker] Job failed:", error);
            sendAgentLog(`[ConvexWorker] Job failed: ${error.message}`, 'error');
            try {
                await this.client.mutation("browserJobs:failJob", {
                    jobId: job._id,
                    errorMessage: error.message
                });
            } catch (e) {
                console.error("Failed to report error to Convex:", e);
            }
        }
    }

    private buildRecipe(job: any): BrowserRecipe {
        const payload = job.payload || {};
        const now = Date.now();
        return {
            id: payload.recipeId || `recipe_${now}`,
            site: payload.site,
            inputs: payload.inputs || {},
            steps: Array.isArray(payload.steps) ? payload.steps : [],
            expectedChecks: payload.expectedChecks || [],
            requiresAuth: payload.requiresAuth ?? true,
            storageStateRef: payload.storageStateRef,
            createdAt: now,
        };
    }
}

export const convexWorker = new ConvexWorker();
