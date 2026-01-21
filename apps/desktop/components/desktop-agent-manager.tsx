'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

export function DesktopAgentManager() {
    const { userId, isLoaded } = useAuth();
    const [workerState, setWorkerState] = useState<'idle' | 'starting' | 'running' | 'failed'>('idle');

    useEffect(() => {
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
    }, [isLoaded, userId]);

    // Optional: Visual indicator (can be hidden or made into a status badge)
    return (
        <div className="fixed bottom-2 right-2 text-xs opacity-50 bg-black text-white px-2 py-1 rounded pointer-events-none z-50">
            Agent: {workerState}
        </div>
    );
}
