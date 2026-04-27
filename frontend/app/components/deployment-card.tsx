import type { Deployment } from "~/lib/api";
import { cn } from "~/lib/utils";
import { buttonVariants } from "~/components/ui/button";
import { StatusBadge } from "~/components/StatusBadge";
import { LogViewer } from "~/components/LogViewer";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Rocket, ExternalLink, Trash2, Terminal, Clock, GitBranch } from "lucide-react";
import { getDeploymentUrl } from "~/lib/api";

interface CardProps {
    deployment: Deployment;
    logsOpen: boolean;
    onToggleLogs: () => void;
    onDelete: () => void;
}

export function DeploymentCard({ deployment, logsOpen, onToggleLogs, onDelete }: CardProps) {
    const liveUrl = getDeploymentUrl(deployment);
    const createdAt = new Date(deployment.created_at);
    const timeString = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return (
        <Card className={cn(
            "overflow-hidden border-border bg-card transition-all",
            logsOpen && "ring-1 ring-blue-500/20"
        )}>
            <div className="px-5 py-4">
                {/* Top row: Name + Status */}
                <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <h3 className="truncate text-sm font-semibold text-white">
                            {deployment.name}
                        </h3>

                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge status={deployment.status} />
                        <Button
                            variant="ghost"
                            size="lg"
                            onClick={onDelete}
                            className="h-7 w-7 shrink-0 p-0 text-zinc-600 hover:text-red-400 hover:bg-red-500/10"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-zinc-500 mb-4">
                    <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-zinc-600" />
                        {timeString}
                    </span>
                    {deployment.image_tag && (
                        <span className="flex items-center gap-1.5 font-mono text-zinc-400">
                            <Terminal className="h-3 w-3 text-zinc-600" />
                            {deployment.image_tag}
                        </span>
                    )}
                    {deployment.source_type === "git" && deployment.source_url && (
                        <span className="flex items-center gap-1.5 font-mono text-zinc-400 truncate max-w-[200px]">
                            <GitBranch className="h-3 w-3 text-zinc-600 shrink-0" />
                            {deployment.source_url.replace(/^https?:\/\/github\.com\//, '')}
                        </span>
                    )}
                </div>

                {/* Actions row */}
                <div className="flex items-center gap-2">
                    {liveUrl && (
                        <a
                            href={liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                buttonVariants({ variant: "outline", size: "sm" }),
                                "h-8 gap-1.5 bg-transparent px-3 text-xs text-blue-400 border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-300"
                            )}
                        >
                            <ExternalLink className="h-3 w-3" />
                            Visit
                        </a>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onToggleLogs}
                        className={cn(
                            "h-8 gap-1.5 bg-transparent text-xs text-zinc-400 hover:bg-muted hover:text-foreground",
                            logsOpen && "bg-muted/50 text-foreground border-zinc-600"
                        )}
                    >
                        <Terminal className="h-3 w-3" />
                        {logsOpen ? "Hide logs" : "Show logs"}
                    </Button>
                </div>
            </div>

            {logsOpen && (
                <div className="border-t border-border px-5 py-4 animate-in slide-in-from-top-2 duration-200">
                    <LogViewer deployment={deployment} />
                </div>
            )}
        </Card>
    );
}
