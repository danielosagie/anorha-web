"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convexWorker = exports.ConvexWorker = void 0;
const browser_1 = require("convex/browser");
const dotenv = __importStar(require("dotenv"));
const path_1 = require("path");
const runner_1 = require("./agent/runner");
const index_1 = require("./index");
// Load environment variables from .env.local if present
dotenv.config({ path: (0, path_1.join)(__dirname, "../../.env.local") });
const CONVEX_URL = "https://merry-buffalo-800.convex.cloud"; // Hardcoded for production verification
console.log("[ConvexWorker] Hardcoded URL:", CONVEX_URL);
(0, index_1.sendAgentLog)(`[ConvexWorker] Initialized with URL: ${CONVEX_URL}`);
class ConvexWorker {
    constructor() {
        this.unsubscribe = null;
        this.userId = null;
        console.log("[ConvexWorker] Initializing with URL:", CONVEX_URL);
        this.client = new browser_1.ConvexClient(CONVEX_URL);
    }
    /**
     * Start listening for jobs for a specific user.
     */
    start(userId) {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        this.userId = userId;
        console.log("[ConvexWorker] Starting worker for user:", userId);
        (0, index_1.sendAgentLog)(`[ConvexWorker] Starting worker for user: ${userId}`, 'success');
        this.unsubscribe = this.client.onUpdate("browserJobs:getPending", { userId }, (pendingJobs) => {
            this.handlePendingJobs(pendingJobs);
        });
    }
    stop() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        console.log("[ConvexWorker] Stopped worker");
    }
    handlePendingJobs(jobs) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!jobs || jobs.length === 0)
                return;
            for (const job of jobs) {
                console.log("[ConvexWorker] Found job:", job._id, job.type);
                (0, index_1.sendAgentLog)(`[ConvexWorker] Found job: ${job.type} (${job._id})`, 'info');
                yield this.processJob(job);
            }
        });
    }
    processJob(job) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("[ConvexWorker] Processing job...", job._id);
                (0, index_1.sendAgentLog)(`[ConvexWorker] Processing job ${job._id}...`, 'info');
                // 1. Mark as processing
                yield this.client.mutation("browserJobs:startJob", { jobId: job._id });
                // 2. Execute via Puppeteer Runner
                console.log("[ConvexWorker] Executing job via AgentRunner...");
                const result = yield runner_1.agentRunner.runJob(job);
                console.log("[ConvexWorker] AgentRunner execution done");
                // 3. Mark as complete
                yield this.client.mutation("browserJobs:completeJob", {
                    jobId: job._id,
                    result: result
                });
                console.log("[ConvexWorker] Job completed:", job._id);
                (0, index_1.sendAgentLog)(`[ConvexWorker] Job completed: ${job._id}`, 'success');
            }
            catch (error) {
                console.error("[ConvexWorker] Job failed:", error);
                (0, index_1.sendAgentLog)(`[ConvexWorker] Job failed: ${error.message}`, 'error');
                try {
                    yield this.client.mutation("browserJobs:failJob", {
                        jobId: job._id,
                        errorMessage: error.message
                    });
                }
                catch (e) {
                    console.error("Failed to report error to Convex:", e);
                }
            }
        });
    }
}
exports.ConvexWorker = ConvexWorker;
exports.convexWorker = new ConvexWorker();
//# sourceMappingURL=convex-client.js.map