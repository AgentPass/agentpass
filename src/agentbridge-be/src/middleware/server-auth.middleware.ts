import { NextFunction, Response } from "express";
import { Logger } from "winston";
import { ServerAuthService } from "../services/server-auth.service.js";
import { AppRequest } from "../utils/req-guards.js";

export function createServerAuthMiddleware(serverAuthService: ServerAuthService, logger?: Logger) {
  return async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
      // Extract server ID from request (set by serverIdMiddleware) or fallback to params/headers
      const serverId = (req as AppRequest).serverId || req.params.serverId || (req.headers["x-server-id"] as string);

      if (!serverId) {
        logger?.warn("Server authentication failed: missing server ID", {
          path: req.path,
          method: req.method,
          headers: req.headers,
        });
        return res.status(400).json({
          error: "Server ID is required for authentication",
        });
      }

      // Authenticate the request for this specific server using strategy pattern
      const authResult = await serverAuthService.authenticateServerRequest(req, serverId);

      if (!authResult.success) {
        logger?.warn("Server authentication failed", {
          serverId,
          error: authResult.error,
          path: req.path,
          method: req.method,
          authType: authResult.userContext?.authType,
        });
        return res.status(401).json({
          error: "Authentication failed",
          details: authResult.error,
        });
      }

      // Log successful authentication
      logger?.info("Server authentication successful", {
        serverId,
        authType: authResult.userContext?.authType,
        userId: authResult.userContext?.userId,
        tenantId: authResult.userContext?.tenantId,
        path: req.path,
        method: req.method,
      });

      // Attach authentication result to request for downstream handlers
      req.serverAuth = authResult;
      req.serverId = serverId;

      next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger?.error("Internal authentication error", {
        serverId: req.params.serverId || req.headers["x-server-id"],
        error: errorMessage,
        path: req.path,
        method: req.method,
      });
      res.status(500).json({
        error: "Internal authentication error",
        details: errorMessage,
      });
    }
  };
}

/**
 * Optional middleware for routes that need authentication but want to handle failures gracefully
 * This middleware will attempt authentication but never block the request, making auth data
 * available to downstream handlers for conditional logic
 */
export function createOptionalServerAuthMiddleware(serverAuthService: ServerAuthService, logger?: Logger) {
  return async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
      const serverId = req.params.serverId || (req.headers["x-server-id"] as string);

      if (serverId) {
        logger?.debug("Attempting optional server authentication", {
          serverId,
          path: req.path,
          method: req.method,
        });

        const authResult = await serverAuthService.authenticateServerRequest(req, serverId);
        req.serverAuth = authResult;
        req.serverId = serverId;

        if (authResult.success) {
          logger?.debug("Optional server authentication successful", {
            serverId,
            authType: authResult.userContext?.authType,
            userId: authResult.userContext?.userId,
          });
        } else {
          logger?.debug("Optional server authentication failed", {
            serverId,
            error: authResult.error,
          });
        }
      } else {
        logger?.debug("No server ID provided for optional authentication", {
          path: req.path,
          method: req.method,
        });
      }

      // Always continue regardless of authentication result
      next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger?.warn("Optional authentication encountered error", {
        serverId: req.params.serverId || req.headers["x-server-id"],
        error: errorMessage,
        path: req.path,
        method: req.method,
      });
      // Don't block the request even on error
      next();
    }
  };
}
