import React, { useEffect, useRef } from "react";
import { useLogStream } from "../hooks/useLogStream";
import type { Deployment } from "../lib/api";
import { cn } from "~/lib/utils";

interface Props {
  deployment: Deployment;
}

export const LogViewer: React.FC<Props> = ({ deployment }) => {
  const { lines, done, finalStatus } = useLogStream(deployment.id);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [lines]);

  function lineColor(line: string): string {
    if (line.toLowerCase().includes("error") || line.toLowerCase().includes("fail")) {
      return "text-destructive";
    }
    if (line.startsWith("===")) {
      return "text-primary";
    }
    if (line.startsWith("$")) {
      return "font-semibold text-foreground";
    }
    return "text-card-foreground/90";
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2 font-mono text-[11px] tracking-tight text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
          <span>Build Logs — {deployment.id}</span>
        </div>
        <div className="flex items-center gap-2">
          {done ? (
            finalStatus === "running" ? (
              <span className="flex items-center gap-1.5 text-primary">
                <span className="h-1 w-1 rounded-full bg-primary" />
                Build complete
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-destructive">
                <span className="h-1 w-1 rounded-full bg-destructive" />
                Build failed
              </span>
            )
          ) : (
            <span className="flex items-center gap-1.5 text-primary/80 italic animate-pulse">
              Streaming...
            </span>
          )}
        </div>
      </div>

      <div ref={scrollContainerRef} className="h-[400px] overflow-y-auto bg-background/40 p-4 font-mono text-[13px] leading-relaxed selection:bg-primary/20">
        {lines.length === 0 && !done && (
          <div className="text-muted-foreground italic animate-pulse">
            Waiting for build output...
          </div>
        )}

        <div className="space-y-0.5">
          {lines.map((line, index) => (
            <div key={index} className={cn("flex gap-4 group", lineColor(line))}>
              <span className="w-10 shrink-0 select-none text-right text-muted-foreground/50 transition-colors group-hover:text-muted-foreground">
                {index + 1}
              </span>
              <span className="whitespace-pre-wrap break-all">{line}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
