import express from "express";
import cors from "cors";


const app = express();
const PORT = process.env.PORT || 3001;


app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function start() {
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