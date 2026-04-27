import { useState, useEffect, useRef } from "react";

interface LogStreamResult {
  lines: string[];
  done: boolean;
  finalStatus: "running" | "failed" | null;
}

export function useLogStream(deploymentId: string | null): LogStreamResult {
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [finalStatus, setFinalStatus] = useState<"running" | "failed" | null>(null);

  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!deploymentId) return;

    setLines([]);
    setDone(false);
    setFinalStatus(null);

    const url = `/api/deployments/${deploymentId}/logs/stream`;
    const source = new EventSource(url);
    sourceRef.current = source;

    source.onmessage = (event: MessageEvent) => {
      try {
        const { line } = JSON.parse(event.data) as { line: string; ts: string };
        setLines((prev) => [...prev, line]);
      } catch {
        setLines((prev) => [...prev, event.data]);
      }
    };

    source.addEventListener("done", (event: Event) => {
      try {
        const { status } = JSON.parse((event as MessageEvent).data) as {
          status: "running" | "failed";
        };
        setFinalStatus(status);
        setDone(true);
      } catch {
        setDone(true);
      }
      source.close();
    });

    source.onerror = () => {
      console.error("SSE connection error for deployment", deploymentId);
      source.close();
    };

    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [deploymentId]);

  return { lines, done, finalStatus };
}
