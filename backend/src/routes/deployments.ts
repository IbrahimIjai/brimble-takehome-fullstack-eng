import { Router } from "express";
import type { Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import type { Deployment } from "../db/db";
import {
  createDeployment,
  getDeployment,
  listDeployments,
  getLogs,
  updateDeployment,
} from "../db/db";
import { subscribe } from "../sse/sse";
import Docker from "dockerode";
import { releasePort } from "../pipeline/ports";
import { unregisterRoute } from "../pipeline/caddy";
import { runPipeline } from "../pipeline/pipeline";

type SourceType = Deployment["source_type"];
type DeploymentParams = { id: string };
type CreateDeploymentBody = {
  source_type?: string;
  source_url?: string;
};
type ErrorResponse = { error: string };
type MessageResponse = { message: string };

const router = Router();

const docker = new Docker({ socketPath: "/var/run/docker.sock" });

const upload = multer({
  dest: "/tmp/uploads/",
  limits: { fileSize: 100 * 1024 * 1024 },
});

function isSourceType(value: string | undefined): value is SourceType {
  return value === "git" || value === "upload";
}

router.post(
  "/",
  upload.single("file"),
  async (
    req: Request<Record<string, never>, Deployment | ErrorResponse, CreateDeploymentBody>,
    res: Response<Deployment | ErrorResponse>
  ) => {
    try {
      const { source_type, source_url } = req.body;

      if (!isSourceType(source_type)) {
        return res
          .status(400)
          .json({ error: 'source_type must be "git" or "upload"' });
      }

      if (source_type === "git") {
        if (!source_url || !source_url.startsWith("http")) {
          return res
            .status(400)
            .json({ error: "A valid Git URL is required for git deployments" });
        }
      }

      if (source_type === "upload" && !req.file) {
        return res
          .status(400)
          .json({ error: "A file must be uploaded for upload deployments" });
      }

      const id = uuidv4().slice(0, 8);
      const name = `app-${id}`;

      const deployment = createDeployment({
        id,
        name,
        source_type,
        source_url: source_type === "git" ? source_url : undefined,
      });

      runPipeline({
        deploymentId: id,
        sourceType: source_type,
        sourceUrl: source_url,
        uploadedFilePath: req.file?.path,
      }).catch((err: unknown) => {
        console.error(`Unhandled pipeline error for ${id}:`, err);
      });

      res.status(201).json(deployment);
    } catch (err) {
      console.error("Error creating deployment:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.get("/", (_req: Request, res: Response<Deployment[]>) => {
  const deployments = listDeployments();
  res.json(deployments);
});

router.get("/:id", (req: Request<DeploymentParams>, res: Response<Deployment | ErrorResponse>) => {
  const { id } = req.params;
  const deployment = getDeployment(id);
  if (!deployment) {
    return res.status(404).json({ error: "Deployment not found" });
  }
  res.json(deployment);
});

router.get("/:id/logs", (req: Request<DeploymentParams>, res: Response<ReturnType<typeof getLogs> | ErrorResponse>) => {
  const { id } = req.params;
  const deployment = getDeployment(id);
  if (!deployment) {
    return res.status(404).json({ error: "Deployment not found" });
  }

  const logs = getLogs(id);
  res.json(logs);
});

router.get("/:id/logs/stream", (req: Request<DeploymentParams>, res: Response<ErrorResponse>) => {
  const { id } = req.params;

  const deployment = getDeployment(id);
  if (!deployment) {
    return res.status(404).json({ error: "Deployment not found" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const existingLogs = getLogs(id);
  for (const entry of existingLogs) {
    const message = `data: ${JSON.stringify({ line: entry.line, ts: entry.created_at })}\n\n`;
    res.write(message);
  }

  if (deployment.status === "running" || deployment.status === "failed" || deployment.status === "stopped") {
    const doneMsg = `event: done\ndata: ${JSON.stringify({ status: deployment.status })}\n\n`;
    res.write(doneMsg);
    res.end();
    return;
  }

  subscribe(id, res);
});

router.delete("/:id", async (req: Request<DeploymentParams>, res: Response<MessageResponse | ErrorResponse>) => {
  const { id } = req.params;
  const deployment = getDeployment(id);
  if (!deployment) {
    return res.status(404).json({ error: "Deployment not found" });
  }

  try {
    if (deployment.container_id) {
      const container = docker.getContainer(deployment.container_id);
      try {
        await container.stop({ t: 5 });
      } catch {
      }
      await container.remove();
    }

    if (deployment.port) {
      releasePort(deployment.port);
    }

    await unregisterRoute(id);

    updateDeployment(id, {
      status: "stopped",
      container_id: undefined,
      port: undefined,
    });

    res.json({ message: "Deployment stopped and removed" });
  } catch (err) {
    console.error("Error stopping deployment:", err);
    res.status(500).json({ error: "Failed to stop deployment" });
  }
});

export default router;






