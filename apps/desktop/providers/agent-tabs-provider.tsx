"use client"

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react'

export type AgentTab = {
    id: string
    title: string
    status: 'running' | 'completed' | 'failed' | 'idle'
    url?: string // Internal route to navigate to (usually /agent)
}

type AgentTabsContextType = {
    tabs: AgentTab[]
    addTab: (tab: AgentTab) => void
    updateTabStatus: (id: string, status: AgentTab['status']) => void
    removeTab: (id: string) => void
    activeTabId: string | null
    setActiveTabId: (id: string | null) => void
}

const AgentTabsContext = createContext<AgentTabsContextType | undefined>(undefined)

export function AgentTabsProvider({ children }: { children: ReactNode }) {
    const [tabs, setTabs] = useState<AgentTab[]>([])
    const [activeTabId, setActiveTabId] = useState<string | null>('anorha-main')

    const addTab = useCallback((tab: AgentTab) => {
        setTabs(prev => {
            if (prev.find(t => t.id === tab.id)) return prev
            return [...prev, tab]
        })
    }, [])

    const updateTabStatus = useCallback((id: string, status: AgentTab['status']) => {
        setTabs(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    }, [])

    const removeTab = useCallback((id: string) => {
        setTabs(prev => prev.filter(t => t.id !== id))
    }, [])

    // Ensure the main "Anorha" tab is conceptually always there, 
    // but we might not store it in the array if we hardcode it in the UI.
    // However, for unified state, let's treat the UI as rendering [Main, ...tabs].

    return (
        <AgentTabsContext.Provider value={{ tabs, addTab, updateTabStatus, removeTab, activeTabId, setActiveTabId }}>
            {children}
        </AgentTabsContext.Provider>
    )
}

export function useAgentTabs() {
    const context = useContext(AgentTabsContext)
    if (!context) throw new Error("useAgentTabs must be used within AgentTabsProvider")
    return context
}
