import { NextFunction, Request, Response } from "express";
import { isAppRequest } from "../utils/req-guards.js";

export const serverIdMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (!isAppRequest(req)) {
    throw new Error("Request does not have logger or db");
  }

  const serverIdOverride: string | undefined = process.env.LOCAL_SERVER_ID;

  if (serverIdOverride) {
    req.logger.debug(`Using local server ID: ${serverIdOverride}`);
    req.serverId = serverIdOverride;
  } else {
    // Check for serverId in query parameters first (for local development)
    const queryServerId = req.query.serverId as string;
    if (queryServerId) {
      req.logger.debug(`Using server ID from query parameter: ${queryServerId}`);
      req.serverId = queryServerId;
      req.logger = req.logger.child({
        serverId: queryServerId,
      });
    } else {
      // when deployed, we expected hostname to be in the format <serverId>.something.agentpass.ai
      const serverId: string | undefined = req.hostname.split(".")[0];
      if (serverId === "app") {
        throw new Error(`Wrong hostname was used for the mcp server request: ${req.hostname}`);
      }
      req.logger.debug(`Using server ID from hostname: ${serverId}`);
      req.serverId = serverId;
      req.logger = req.logger.child({
        serverId,
      });
    }
  }

  next();
};
