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
      return "text-red-400";
    }
    if (line.startsWith("===")) {
      return "text-blue-400";
    }
    if (line.startsWith("$")) {
      return "text-purple-400 font-bold";
    }
    return "text-zinc-300";
  }

  return (
    <div className="flex flex-col rounded-lg border bg-zinc-950 overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/50 border-b border-white/5 text-[11px] font-mono tracking-tight text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-zinc-700" />
          <span>Build Logs — {deployment.id}</span>
        </div>
        <div className="flex items-center gap-2">
          {done ? (
            finalStatus === "running" ? (
              <span className="text-green-500 flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-green-500" />
                Build complete
              </span>
            ) : (
              <span className="text-red-500 flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-red-500" />
                Build failed
              </span>
            )
          ) : (
            <span className="text-blue-400 flex items-center gap-1.5 italic animate-pulse">
              Streaming...
            </span>
          )}
        </div>
      </div>

      <div ref={scrollContainerRef} className="h-[400px] overflow-y-auto p-4 font-mono text-[13px] leading-relaxed selection:bg-blue-500/30">
        {lines.length === 0 && !done && (
          <div className="text-zinc-600 italic animate-pulse">
            Waiting for build output...
          </div>
        )}

        <div className="space-y-0.5">
          {lines.map((line, index) => (
            <div key={index} className={cn("flex gap-4 group", lineColor(line))}>
              <span className="w-10 shrink-0 text-right text-zinc-700 select-none group-hover:text-zinc-500 transition-colors">
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
