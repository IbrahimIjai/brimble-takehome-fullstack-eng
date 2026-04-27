const API_BASE = "/api";

export interface Deployment {
  id: string;
  name: string;
  source_type: "git" | "upload";
  source_url?: string;
  status: "pending" | "building" | "deploying" | "running" | "failed" | "stopped";
  image_tag?: string;
  container_id?: string;
  port?: number;
  created_at: string;
  updated_at: string;
}

export interface LogEntry {
  id: number;
  deployment_id: string;
  line: string;
  created_at: string;
}

export async function fetchDeployments(): Promise<Deployment[]> {
  const res = await fetch(`${API_BASE}/deployments`);
  if (!res.ok) throw new Error(`Failed to fetch deployments: ${res.statusText}`);
  return res.json();
}

export async function fetchDeployment(id: string): Promise<Deployment> {
  const res = await fetch(`${API_BASE}/deployments/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch deployment: ${res.statusText}`);
  return res.json();
}

export async function createGitDeployment(gitUrl: string): Promise<Deployment> {
  const res = await fetch(`${API_BASE}/deployments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source_type: "git", source_url: gitUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Failed to create deployment");
  }
  return res.json();
}

export async function createUploadDeployment(file: File): Promise<Deployment> {
  const formData = new FormData();
  formData.append("source_type", "upload");
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/deployments`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Failed to create deployment");
  }
  return res.json();
}

export async function fetchLogs(deploymentId: string): Promise<LogEntry[]> {
  const res = await fetch(`${API_BASE}/deployments/${deploymentId}/logs`);
  if (!res.ok) throw new Error(`Failed to fetch logs: ${res.statusText}`);
  return res.json();
}

export async function deleteDeployment(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/deployments/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete deployment: ${res.statusText}`);
}

export function getDeploymentUrl(deployment: Deployment): string | null {
  if (deployment.status !== "running") return null;
  // Use subdomain routing to avoid absolute path issues with SPAs (like Vite)
  const isLocalhost = 
    window.location.hostname === "localhost" || 
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.endsWith(".localhost");
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : "";
  
  if (isLocalhost) {
    return `${protocol}//${deployment.id}.localhost${port}`;
  }
  

  return `${protocol}//${deployment.id}.${window.location.host}`;
}
