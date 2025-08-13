import cors from "cors";
import express from "express";
import { StatusCodes } from "http-status-codes";
import { dbMiddleware } from "./middlewares/db.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { loggerMiddleware } from "./middlewares/logger.middleware.js";
import { adminSessionMiddleware } from "./middlewares/session.middleware.js";
import adminsRouter from "./routes/admins.routes.js";
import aiRouter from "./routes/ai.routes.js";
import analyticsRouter from "./routes/analytics.routes.js";
import foldersRouter from "./routes/folders.routes.js";
import healthRouter from "./routes/health.routes.js";
import mcpRouter from "./routes/mcp.routes.js";
import mirrorRouter from "./routes/mirror.routes.js";
import oauthRouter from "./routes/oauth.routes.js";
import ownidRouter from "./routes/ownid.routes.js";
import providersRouter from "./routes/providers.routes.js";
import serverAuthRouter from "./routes/server-auth.routes.js";
import serversRouter from "./routes/servers.routes.js";
import tenantRouter from "./routes/tenant.routes.js";
import usersRouter from "./routes/users.routes.js";
import { disconnectDatabase } from "./utils/connection.js";
// eslint-disable-next-line no-restricted-imports
import logger from "./logger.js";
import { isAppRequest } from "./utils/req-guards.js";

const app = express();
const port = process.env.PORT || 3333;

process.on("SIGINT", async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on("uncaughtException", async (error) => {
  console.error("server uncaught exception", error);
  await disconnectDatabase();
  process.exit(1);
});

process.on("unhandledRejection", async (reason) => {
  console.error("server unhandled rejection:", reason);
  await disconnectDatabase();
  process.exit(1);
});

app.set("trust proxy", true);
app.use(cors());
app.use(loggerMiddleware);
app.use(dbMiddleware);
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: false }));
app.use(express.raw({ type: "application/octet-stream", limit: "50mb" }));

// Admin routes
app.use("/api/providers", adminSessionMiddleware, providersRouter);
app.use("/api/servers", adminSessionMiddleware, serversRouter);
app.use("/api/servers", adminSessionMiddleware, serverAuthRouter);
app.use("/api/servers", adminSessionMiddleware, analyticsRouter);
app.use("/api/servers", adminSessionMiddleware, foldersRouter);
app.use("/api/users", adminSessionMiddleware, usersRouter);
app.use("/api/tenant", adminSessionMiddleware, tenantRouter);
app.use("/api/admins", adminsRouter);
app.use("/api/ai", aiRouter);

// MCP routes (server auth middleware is lazy-initialized on first request)
app.use(mcpRouter);

// OAuth routes
app.use(oauthRouter);

// Health routes
app.use("/api/health", healthRouter);

// Mirror routes
app.use("/api/mirror", mirrorRouter);

app.use("/api/ownid", ownidRouter);

app.use((req, res) => {
  if (isAppRequest(req)) {
    req.logger.debug(`404 Not Found: ${req.method} ${req.path}`);
  }
  res.status(StatusCodes.NOT_FOUND).json({
    error: "Not Found",
  });
});

app.use(errorHandler);

try {
  const server = app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      logger.error(`Port ${port} is already in use`);
    } else {
      logger.error("Failed to start server:", err);
    }
    process.exit(1);
  });
} catch (e) {
  logger.error("Unexpected error during server startup:", e);
  // eslint-disable-next-line promise/catch-or-return
  disconnectDatabase().finally(() => process.exit(1));
}
