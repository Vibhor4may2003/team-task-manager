import "dotenv/config";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { verifyToken } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error-handler.js";
import { connectDatabase } from "./db/connect.js";
import "./models/index.js";
import { authRouter } from "./routes/auth.routes.js";
import { projectsRouter } from "./routes/projects.routes.js";
import { tasksByIdRouter } from "./routes/tasks.routes.js";
import { usersRouter } from "./routes/users.routes.js";

const app = express();
const port = Number(process.env.PORT) || 4000;
const mongoUri = process.env.MONGO_URI;

const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors({
  origin: corsOrigin ? corsOrigin.split(",").map((s) => s.trim()) : true,
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);

const protectedApi = express.Router();
protectedApi.use(verifyToken);
protectedApi.use("/users", usersRouter);
protectedApi.use("/projects", projectsRouter);
protectedApi.use("/tasks", tasksByIdRouter);
app.use("/api", protectedApi);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDist = path.resolve(__dirname, "../../web/dist");
const webIndex = path.join(webDist, "index.html");

if (existsSync(webIndex)) {
  app.use(express.static(webDist));
  app.get(/^(?!\/api\/|\/health$).*/, (_req, res) => {
    res.sendFile(webIndex);
  });
  console.log(`Serving SPA from ${webDist}`);
} else {
  console.log(`SPA not found at ${webDist} (dev mode or build not run)`);
}

app.use(errorHandler);

async function main() {
  if (!mongoUri) {
    throw new Error("MONGO_URI is not set");
  }
  await connectDatabase(mongoUri);
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
