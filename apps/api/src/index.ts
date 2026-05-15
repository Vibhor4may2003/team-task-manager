import "dotenv/config";
import cors from "cors";
import express from "express";
import { verifyToken } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error-handler.js";
import { connectDatabase } from "./db/connect.js";
import "./models/index.js";
import { authRouter } from "./routes/auth.routes.js";
import { projectsRouter } from "./routes/projects.routes.js";
import { tasksByIdRouter } from "./routes/tasks.routes.js";

const app = express();
const port = Number(process.env.PORT) || 4000;
const mongoUri = process.env.MONGO_URI;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);

const protectedApi = express.Router();
protectedApi.use(verifyToken);
protectedApi.use("/projects", projectsRouter);
protectedApi.use("/tasks", tasksByIdRouter);
app.use("/api", protectedApi);

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
