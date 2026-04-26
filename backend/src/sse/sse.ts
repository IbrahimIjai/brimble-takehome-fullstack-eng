import { type Response } from "express";
interface Subscriber {
  res: Response;
}
const subscribers = new Map<string, Subscriber[]>();

export function subscribe(deploymentId: string, res: Response): void {
  if (!subscribers.has(deploymentId)) {
    subscribers.set(deploymentId, []);
  }
  subscribers.get(deploymentId)!.push({ res });

  res.on("close", () => {
    unsubscribe(deploymentId, res);
  });
}

function unsubscribe(deploymentId: string, res: Response): void {
  const subs = subscribers.get(deploymentId);
  if (!subs) return;

  const filtered = subs.filter((s) => s.res !== res);
  if (filtered.length === 0) {
    subscribers.delete(deploymentId);
  } else {
    subscribers.set(deploymentId, filtered);
  }
}

export function broadcast(deploymentId: string, line: string): void {
  const subs = subscribers.get(deploymentId);
  if (!subs || subs.length === 0) return;

  const message = `data: ${JSON.stringify({ line, ts: new Date().toISOString() })}\n\n`;

  for (const sub of subs) {
    try {
      sub.res.write(message);
    } catch {
    }
  }
}


export function broadcastDone(deploymentId: string, status: "running" | "failed"): void {
  const subs = subscribers.get(deploymentId);
  if (!subs || subs.length === 0) return;

  const message = `event: done\ndata: ${JSON.stringify({ status })}\n\n`;

  for (const sub of subs) {
    try {
      sub.res.write(message);
      sub.res.end();
    } catch {
    }
  }

  subscribers.delete(deploymentId);
}

setInterval(() => {
  for (const [deploymentId, subs] of subscribers.entries()) {
    for (const sub of subs) {
      try {
        sub.res.write(":\n\n");
        if (typeof (sub.res as any).flush === "function") {
          (sub.res as any).flush();
        }
      } catch {
      }
    }
  }
}, 15000);
