'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useAgentTabs } from '../providers/agent-tabs-provider';

export function DesktopAgentManager() {
    const { userId, isLoaded } = useAuth();
    const [workerState, setWorkerState] = useState<'idle' | 'starting' | 'running' | 'failed'>('idle');
    const { addTab, updateTabStatus, setActiveTabId } = useAgentTabs();

    useEffect(() => {
        // Listen for agent logs to spawn tabs
        // @ts-ignore
        if (typeof window !== 'undefined' && window.ipcRenderer) {
            const handleLog = (data: any) => {
                const msg = (data.message || '').toString();

                // Heuristic: If we see "Found job: create_listing", create a new tab?
                // Or better yet, look for specific lifecycle events if we add them.
                // For now, let's just create a generic "Agent Task" tab if one starts running,
                // and rename it if we see details.

                if (msg.includes('Found job:')) {
                    const jobType = msg.split('Found job:')[1]?.trim() || 'Unknown Job';
                    const tabId = `job-${Date.now()}`;
                    addTab({
                        id: tabId,
                        title: jobType, // e.g., "create_listing" -> could map to "Facebook Listing"
                        status: 'running',
                        url: '/agent'
                    });
                    setActiveTabId(tabId);
                }

                // Detect completion
                if (msg.includes('completed successfully') || msg.includes('Job completed')) {
                    // Find the most recent running tab? 
                    // Since we don't have job IDs in logs yet, update ALL running tabs to completed?
                    // Or just the active one?
                    // Ideally we'd pass ID. For now, mark all running tabs as completed? No that's risky.
                    // Let's assume there is only one running job at a time for this simplified agent.
                }
            };

            // @ts-ignore
            window.ipcRenderer.receive('agent-log', handleLog);
        }

        const startWorker = async () => {
            // Check if we are in Electron environment
            // @ts-ignore
            if (typeof window !== 'undefined' && window.ipcRenderer && userId) {
                if (workerState === 'running') return;

                try {
                    setWorkerState('starting');
                    console.log('[DesktopAgent] Auto-starting worker for user:', userId);

                    // @ts-ignore
                    const result = await window.ipcRenderer.invoke('auth-worker-start', { userId });

                    if (result.success) {
                        setWorkerState('running');
                        console.log('[DesktopAgent] Worker started successfully');
                    } else {
                        console.error('[DesktopAgent] Worker failed to start:', result.error);
                        setWorkerState('failed');
                    }
                } catch (error) {
                    console.error('[DesktopAgent] IPC Error:', error);
                    setWorkerState('failed');
                }
            }
        };

        if (isLoaded && userId) {
            startWorker();
        }
    }, [isLoaded, userId, addTab, setActiveTabId, workerState]);

    // Optional: Visual indicator (can be hidden or made into a status badge)
    return (
        <div className="fixed bottom-2 right-2 text-xs opacity-50 bg-black text-white px-2 py-1 rounded pointer-events-none z-50">
            Agent: {workerState} {userId && `(${userId})`}
        </div>
    );
}
