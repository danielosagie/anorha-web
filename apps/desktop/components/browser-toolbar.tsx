"use client"

import { Button } from "@repo/design-system/components/ui/button"
import { ArrowLeft, ArrowRight, RotateCw, Plus, X } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@repo/design-system/lib/utils"
import Link from "next/link"
import { useAgentTabs } from "../providers/agent-tabs-provider"

export function BrowserToolbar() {
    const pathname = usePathname()
    const router = useRouter()
    const { tabs, activeTabId, setActiveTabId } = useAgentTabs()

    // Determine effective active tab:
    // If pathname is NOT /agent, it's the Main App (Anorha).
    // If pathname IS /agent, it's one of the agent tabs (or generic if none selected).
    const isAppActive = !pathname.startsWith('/agent')

    return (
        <div className="flex flex-col border-b bg-[#dee1e6] sticky top-0 z-50 select-none">
            {/* Top Row: Tabs & Traffic Lights */}
            <div className="flex items-end h-[42px] px-2 gap-2 pt-2" style={{ WebkitAppRegion: "drag", appRegion: "drag" } as any}>
                {/* Traffic Light Spacer for macOS */}
                <div className="w-[70px] shrink-0" />

                {/* Tabs Container */}
                <div className="flex items-end gap-1 flex-1 overflow-x-auto no-scrollbar scrollbar-hide" style={{ WebkitAppRegion: "no-drag" } as any}>
                    {/* 1. Main App Tab (Always Present) */}
                    <div
                        onClick={() => {
                            setActiveTabId('anorha-main')
                            router.push('/')
                        }}
                        className={cn(
                            "relative group flex items-center gap-2 px-4 py-2 min-w-[140px] max-w-[200px] text-xs h-full rounded-t-lg transition-all cursor-pointer",
                            isAppActive
                                ? "bg-white text-foreground shadow-sm z-10"
                                : "bg-transparent text-muted-foreground hover:bg-white/40"
                        )}
                    >
                        <div className="truncate flex-1 font-medium">Anorha</div>
                    </div>

                    {/* 2. Dynamic Agent Tabs */}
                    {tabs.map(tab => {
                        const isTabActive = !isAppActive && activeTabId === tab.id
                        return (
                            <div
                                key={tab.id}
                                onClick={() => {
                                    setActiveTabId(tab.id)
                                    // Navigate to /agent if not already there, 
                                    // ideally with a query param to show specific task logs?
                                    // For now just go to /agent
                                    if (!pathname.startsWith('/agent')) router.push('/agent')
                                }}
                                className={cn(
                                    "relative group flex items-center gap-2 px-4 py-2 min-w-[140px] max-w-[200px] text-xs h-full rounded-t-lg transition-all cursor-pointer",
                                    isTabActive
                                        ? "bg-white text-foreground shadow-sm z-10"
                                        : "bg-transparent text-muted-foreground hover:bg-white/40",
                                    // Green highlight if completed
                                    tab.status === 'completed' && !isTabActive && "bg-green-100 text-green-800 hover:bg-green-200"
                                )}
                            >
                                <div className="truncate flex-1 font-medium">{tab.title}</div>
                                {tab.status === 'completed' && (
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                )}
                                <div className={cn("opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-black/10 transition-opacity", isTabActive && "opacity-100")}>
                                    <X className="w-3 h-3" />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Navigation Bar (Conditional - only show if active tab implies web content?) 
                Actually, let's keep it simple. Only show Nav on /agent pages?
                Or just show it everywhere for consistency.
                User said "don't want the URL bar", but maybe arrows are okay.
            */}
            <div className="flex items-center gap-2 px-2 py-1.5 bg-white border-b-0" style={{ WebkitAppRegion: "no-drag" } as any}>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" disabled>
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                        <RotateCw className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
