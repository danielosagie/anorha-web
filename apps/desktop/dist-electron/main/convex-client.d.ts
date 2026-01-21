export declare class ConvexWorker {
    private client;
    private unsubscribe;
    private userId;
    constructor();
    /**
     * Start listening for jobs for a specific user.
     */
    start(userId: string): void;
    stop(): void;
    private handlePendingJobs;
    private processJob;
}
export declare const convexWorker: ConvexWorker;
//# sourceMappingURL=convex-client.d.ts.map