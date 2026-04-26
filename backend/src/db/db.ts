import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../../data/deployer.db");

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS deployments (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_url  TEXT,
    status      TEXT NOT NULL DEFAULT 'pending',
    image_tag   TEXT,
    container_id TEXT,
    port        INTEGER,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS logs (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    deployment_id  TEXT NOT NULL,
    line           TEXT NOT NULL,
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (deployment_id) REFERENCES deployments(id)
  );
`);
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

export function createDeployment(data: {
  id: string;
  name: string;
  source_type: "git" | "upload";
  source_url?: string;
}): Deployment {
  const stmt = db.prepare(`
    INSERT INTO deployments (id, name, source_type, source_url)
    VALUES (@id, @name, @source_type, @source_url)
  `);
  stmt.run(data);
  return getDeployment(data.id)!;
}

export function getDeployment(id: string): Deployment | undefined {
  return db.prepare("SELECT * FROM deployments WHERE id = ?").get(id) as Deployment | undefined;
}

export function listDeployments(): Deployment[] {
  return db.prepare("SELECT * FROM deployments ORDER BY created_at DESC").all() as Deployment[];
}

export function updateDeployment(
  id: string,
  fields: Partial<Omit<Deployment, "id" | "created_at">>
): void {
  const setClauses = Object.keys(fields)
    .map((k) => `${k} = @${k}`)
    .join(", ");

  db.prepare(`
    UPDATE deployments
    SET ${setClauses}, updated_at = datetime('now')
    WHERE id = @id
  `).run({ ...fields, id });
}

export function appendLog(deploymentId: string, line: string): void {
  db.prepare(`
    INSERT INTO logs (deployment_id, line) VALUES (?, ?)
  `).run(deploymentId, line);
}

export function getLogs(deploymentId: string): LogEntry[] {
  return db
    .prepare("SELECT * FROM logs WHERE deployment_id = ? ORDER BY id ASC")
    .all(deploymentId) as LogEntry[];
}

export default db;
