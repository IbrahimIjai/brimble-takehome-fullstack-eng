import express from "express";
import cors from "cors";
import { listDeployments } from "./db/db";
import { initUsedPorts } from "./pipeline/ports";
import { registerRoute } from "./pipeline/caddy";

import deploymentsRouter from "./routes/deployments";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/deployments", deploymentsRouter);
app.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

async function start() {
  const existingDeployments = listDeployments();
  const activeDeployments = existingDeployments.filter(
    (d) => d.status === "running" && d.port != null
  );

  const activePorts = activeDeployments.map((d) => d.port as number);

  initUsedPorts(activePorts);
  console.log(`Recovered ${activePorts.length} active port allocations from DB`);

  for (const deployment of activeDeployments) {
    console.log(`Recovering Caddy route for ${deployment.id}...`);
    await registerRoute(deployment.id, deployment.port as number);
  }

  app.listen(PORT, () => {
    console.log(`Backend listening on http://0.0.0.0:${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log(`API:    http://localhost:${PORT}/api/deployments`);
  });
}

start().catch((err) => {
  console.error("Failed to start backend:", err);
  process.exit(1);
});
