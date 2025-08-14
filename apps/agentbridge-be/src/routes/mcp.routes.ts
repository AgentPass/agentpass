import { NextFunction, Request, RequestHandler, Response, Router } from "express";
import { Logger } from "winston";
import { handleNotAllowed, handleSSE, handleSSEMessage, handleStreamablePost } from "../controllers/mcp.controller.js";
import { createServerAuthMiddleware } from "../middleware/server-auth.middleware.js";
import { serverIdMiddleware } from "../middlewares/serverId.middleware.js";
import { ServerAuthService } from "../services/server-auth.service.js";
import { AppRequest } from "../utils/req-guards.js";

const router: Router = Router();

// Create server auth middleware instance (will be injected with dependencies in app setup)
let serverAuthMiddleware: ReturnType<typeof createServerAuthMiddleware>;

export function setupServerAuthMiddleware(serverAuthService: ServerAuthService, logger?: Logger) {
  serverAuthMiddleware = createServerAuthMiddleware(serverAuthService, logger);
}

// Enhanced server auth middleware that properly handles BASE auth user context
const enhancedServerAuth = async (req: Request, res: Response, next: NextFunction) => {
  const appReq = req as AppRequest;

  // Initialize server auth middleware if needed
  if (!serverAuthMiddleware) {
    try {
      const serverAuthService = new ServerAuthService(appReq.db, appReq.logger);
      serverAuthMiddleware = createServerAuthMiddleware(serverAuthService, appReq.logger);
      appReq.logger?.info("Server authentication middleware lazy-initialized");
    } catch (error) {
      appReq.logger?.error("Failed to initialize server auth middleware:", error);
      return res.status(503).json({
        error: "Server authentication not configured",
        details: "Failed to initialize server authentication middleware",
      });
    }
  }

  // Use the server auth middleware (which uses strategy pattern internally)
  return serverAuthMiddleware(appReq, res, next);
};

router.post("/api/mcp", serverIdMiddleware, enhancedServerAuth, handleStreamablePost as unknown as RequestHandler);
router.get("/api/mcp", serverIdMiddleware, enhancedServerAuth, handleSSE as unknown as RequestHandler);
router.post("/api/mcp/messages", serverIdMiddleware, enhancedServerAuth, handleSSEMessage as unknown as RequestHandler);
router.delete("/api/mcp", handleNotAllowed);

export default router;
