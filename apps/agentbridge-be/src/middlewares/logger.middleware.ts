import * as crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { Logger } from "winston";

// eslint-disable-next-line no-restricted-imports
import { default as logger } from "../logger.js";
import { withRequestLogger } from "../utils/logger-cls.js";

export const loggerMiddleware = (req: Request & { logger?: Logger }, res: Response, next: NextFunction) => {
  req.logger = logger.child({
    request: {
      id: crypto.randomUUID(),
      method: req.method,
      path: req.path,
      params: Object.keys(req.params || {}),
      bodyLen: req.headers["content-length"] || null,
    },
  });
  withRequestLogger(req.logger, () => {
    next();
  });
};
