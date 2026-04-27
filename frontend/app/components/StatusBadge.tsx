import React from "react";
import type { Deployment } from "../lib/api";
import { Badge } from "./ui/badge";
import { cn } from "~/lib/utils";

interface Props {
  status: Deployment["status"];
  className?: string;
}

const STATUS_CONFIG: Record<
  Deployment["status"],
  { variant: "default" | "secondary" | "destructive" | "outline"; label: string; dotClassName: string; pulse: boolean; badgeClassName: string }
> = {
  pending: {
    variant: "secondary",
    label: "Pending",
    dotClassName: "bg-muted-foreground",
    pulse: false,
    badgeClassName: "bg-muted/50 text-muted-foreground border-muted-foreground/20",
  },
  building: {
    variant: "default",
    label: "Building",
    dotClassName: "bg-blue-500",
    pulse: true,
    badgeClassName: "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20",
  },
  deploying: {
    variant: "default",
    label: "Deploying",
    dotClassName: "bg-purple-500",
    pulse: true,
    badgeClassName: "bg-purple-500/10 text-purple-500 border-purple-500/20 hover:bg-purple-500/20",
  },
  running: {
    variant: "default",
    label: "Running",
    dotClassName: "bg-green-500",
    pulse: false,
    badgeClassName: "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20",
  },
  failed: {
    variant: "destructive",
    label: "Failed",
    dotClassName: "bg-destructive-foreground",
    pulse: false,
    badgeClassName: "",
  },
  stopped: {
    variant: "secondary",
    label: "Stopped",
    dotClassName: "bg-muted-foreground",
    pulse: false,
    badgeClassName: "bg-muted/50 text-muted-foreground border-muted-foreground/20",
  },
};

export const StatusBadge: React.FC<Props> = ({ status, className }) => {
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "gap-1.5 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
        config.badgeClassName,
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full shrink-0",
          config.dotClassName,
          config.pulse && "animate-pulse-slow"
        )}
      />
      {config.label}
    </Badge>
  );
};
