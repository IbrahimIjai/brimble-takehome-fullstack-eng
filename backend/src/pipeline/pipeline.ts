import Docker from "dockerode";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { appendLog, updateDeployment } from "../db/db";
import { broadcast, broadcastDone } from "../sse/sse";
import { allocatePort, releasePort } from "./ports";
import { registerRoute } from "./caddy";


const docker = new Docker({ socketPath: "/var/run/docker.sock" });


function log(deploymentId: string, line: string): void {
  const trimmed = line.trimEnd();
  if (!trimmed) return;
  appendLog(deploymentId, trimmed);
  broadcast(deploymentId, trimmed);
  console.log(`[${deploymentId}] ${trimmed}`);
}



function runCommand(
  deploymentId: string,
  cmd: string,
  args: string[],
  cwd: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    log(deploymentId, `$ ${cmd} ${args.join(" ")}`);

    const child = spawn(cmd, args, {
      cwd,
      stdio: "pipe",
      shell: false,
    });

    let buffer = "";

    const handleData = (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        log(deploymentId, line);
      }
    };

    child.stdout?.on("data", handleData);
    child.stderr?.on("data", handleData);

    child.on("close", (code) => {
      if (buffer.trim()) log(deploymentId, buffer);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${cmd} exited with code ${code}`));
      }
    });

    child.on("error", (err) => {
      reject(new Error(`Failed to start ${cmd}: ${err.message}`));
    });
  });
}

async function cloneRepo(
  deploymentId: string,
  gitUrl: string,
  destDir: string
): Promise<void> {
  log(deploymentId, `Cloning ${gitUrl}...`);
  await runCommand(deploymentId, "git", ["clone", "--depth", "1", gitUrl, destDir], "/tmp");
}

async function extractUpload(
  deploymentId: string,
  filePath: string,
  destDir: string
): Promise<void> {
  log(deploymentId, `Extracting uploaded file...`);
  fs.mkdirSync(destDir, { recursive: true });

  if (filePath.endsWith(".zip")) {
    await runCommand(deploymentId, "unzip", ["-q", filePath, "-d", destDir], "/tmp");
  } else {
    await runCommand(deploymentId, "tar", ["-xzf", filePath, "-C", destDir], "/tmp");
  }
}


export async function runPipeline(opts: {
  deploymentId: string;
  sourceType: "git" | "upload";
  sourceUrl?: string;
  uploadedFilePath?: string;
}): Promise<void> {
  const { deploymentId, sourceType, sourceUrl, uploadedFilePath } = opts;

  const buildDir = `/tmp/builds/${deploymentId}`;

  const imageTag = `deployer-${deploymentId}:latest`;

  let port: number | undefined;

  try {
    log(deploymentId, "=== Starting pipeline ===");
    updateDeployment(deploymentId, { status: "building" });

    fs.mkdirSync(buildDir, { recursive: true });

    if (sourceType === "git" && sourceUrl) {
      await cloneRepo(deploymentId, sourceUrl, buildDir);
    } else if (sourceType === "upload" && uploadedFilePath) {
      await extractUpload(deploymentId, uploadedFilePath, buildDir);
    } else {
      throw new Error("No source provided");
    }

    log(deploymentId, "=== Building image with Railpack ===");
    updateDeployment(deploymentId, { image_tag: imageTag });

    await runCommand(
      deploymentId,
      "railpack",
      [
        "build",
        buildDir,
        "--name", imageTag,
      ],
      "/tmp"
    );

    log(deploymentId, `Image built: ${imageTag}`);

    log(deploymentId, "=== Starting container ===");
    updateDeployment(deploymentId, { status: "deploying" });

    port = allocatePort();

    const container = await docker.createContainer({
      Image: imageTag,
      name: `deployer-${deploymentId}`,
      Env: ["PORT=3000"],
      ExposedPorts: {
        "3000/tcp": {},
      },
      HostConfig: {
        PortBindings: {
          "3000/tcp": [{ HostPort: String(port) }],
        },
        Memory: 256 * 1024 * 1024,
      },
    });

    await container.start();

    const containerInfo = await container.inspect();
    const containerId = containerInfo.Id;

    await registerRoute(deploymentId, port);

    log(deploymentId, `Container started on port ${port}`);
    log(deploymentId, `=== Deployment complete! ===`);

    updateDeployment(deploymentId, {
      status: "running",
      container_id: containerId,
      port,
    });
    broadcastDone(deploymentId, "running");

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log(deploymentId, `ERROR: ${message}`);
    log(deploymentId, "=== Pipeline failed ===");

    if (port !== undefined) {
      releasePort(port);
    }

    updateDeployment(deploymentId, { status: "failed" });
    broadcastDone(deploymentId, "failed");

  } finally {
    try {
      fs.rmSync(buildDir, { recursive: true, force: true });
    } catch {
      console.warn(`Could not clean up build dir: ${buildDir}`);
    }
  }
}





