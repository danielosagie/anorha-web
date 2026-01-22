import { AgentLogViewer } from "../../../components/agent-log-viewer"
import { Play } from "lucide-react"

export default function AgentPage() {
    return (
        <div className="flex flex-col h-full bg-background">
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                {/* Main View Area (Headless Preview Placeholder) */}
                <div className="flex-1 bg-muted/10 relative flex flex-col items-center justify-center p-8 border-r">
                    <div className="max-w-md text-center space-y-4">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto animate-pulse">
                            <Play className="h-10 w-10 text-green-600 dark:text-green-400 ml-1" />
                        </div>
                        <h2 className="text-2xl font-bold">Agent Active</h2>
                        <p className="text-muted-foreground">
                            The agent is currently controlling the browser.
                            Check the terminal output below for detailed logs.
                        </p>
                        <div className="text-xs font-mono bg-muted p-2 rounded">
                            Mode: Headless: False (Visible Window)
                        </div>
                    </div>
                </div>

                {/* Sidebar Terminal */}
                <div className="w-full lg:w-[400px] flex flex-col border-l bg-black">
                    <AgentLogViewer />
                </div>
            </div>
        </div>
    )
}
