export declare class AgentRunner {
    private browser;
    runJob(job: any): Promise<{
        status: string;
        message: string;
    }>;
    private ensureBrowser;
    private runCreateListing;
    private runCheckMessages;
    private runVerifyListing;
}
export declare const agentRunner: AgentRunner;
//# sourceMappingURL=runner.d.ts.map