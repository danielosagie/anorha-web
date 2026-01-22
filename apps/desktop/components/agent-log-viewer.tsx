"use client"

import { useEffect, useState, useRef } from "react"
import { ScrollArea } from "@repo/design-system/components/ui/scroll-area"
import { cn } from "@repo/design-system/lib/utils"

interface LogEntry {
    message: string
    type: 'info' | 'error' | 'success'
    timestamp: string
}

export function AgentLogViewer() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleLog = (_: any, log: LogEntry) => {
            setLogs(prev => [...prev, log])
        }

        // Using the exposed ipcRenderer
        if ((window as any).ipcRenderer) {
            // Use the 'receive' method exposed via contextBridge
            (window as any).ipcRenderer.receive('agent-log', handleLog)
        }

        // Note: The 'receive' wrapper usually doesn't return an unsubscribe function
        // or expose removeListener directly safely in this pattern.
        // For now, we'll just leave it. If logs duplicate, we might need a cleanup
        // strategy in preload.
        return () => {
            // Cleanup if we had a way, but 'receive' as implemented wraps it.
        }
    }, [])

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [logs])

    return (
        <div className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[11px] flex flex-col">
            <div className="flex justify-between items-center px-4 py-2 bg-[#2d2d2d] border-b border-[#3e3e3e]">
                <span className="font-semibold uppercase tracking-wider text-xs text-[#a6a6a6]">Terminal</span>
                <span className="flex items-center gap-1.5 text-[10px] text-green-500">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Connected
                </span>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                {logs.length === 0 && (
                    <div className="text-zinc-600 italic">Waiting for agent activity...</div>
                )}
                {logs.map((log, i) => (
                    <div key={i} className={cn("flex gap-2 break-all", {
                        "text-red-400": log.type === 'error',
                        "text-green-300": log.type === 'success',
                        "text-blue-300": log.type === 'info'
                    })}>
                        <span className="opacity-40 min-w-[60px] select-none text-zinc-500">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span>{log.message}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
