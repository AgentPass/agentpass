import { AdminRole } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { cacheGetOrAdd, CacheItemType } from "../services/cache.service.js";
import { verifyAdminToken, verifyEndUserToken } from "../services/jwt.service.js";
import { markTokenAsUsed } from "../services/oauth.service.js";
import { hashForLogging } from "../utils/hash.js";
import { AppRequest, isAdminRequest, isAppRequest, TypeGuardError } from "../utils/req-guards.js";

const sessionMiddleware = async <T extends { id: string; email: string; tenantId: string; jti?: string }>(
  req: Request,
  res: Response,
  next: NextFunction,
  scope: "user" | "admin",
  verifier: (token: string) => Promise<T | null>,
  setter: (req: AppRequest, decoded: T) => void,
) => {
  if (!isAppRequest(req)) {
    throw new TypeGuardError();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.logger.warn(`No authorization header for ${scope} provided on request to ${req.path}`);
    return res.status(StatusCodes.UNAUTHORIZED).json({
      error: "unauthorized",
      errorDescription: "No token provided",
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = await verifier(token);
    if (!decoded) {
      req.logger.debug("Token verification failed");
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: "unauthorized",
        errorDescription: "Invalid token",
      });
    }

    if (scope === "user") {
      const token = await cacheGetOrAdd(
        { type: CacheItemType.ENDUSER_TOKEN, ids: [decoded.email, decoded.jti || ""] },
        async () =>
          await req.db.providerToken.findUnique({
            where: {
              id: decoded.jti,
            },
          }),
      );
      if (!token) {
        req.logger.warn("Token not found in database", decoded.jti);
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: "unauthorized",
          errorDescription: "Invalid token",
        });
      }
      setImmediate(() => markTokenAsUsed(req.db, token.id));
    }

    setter(req, decoded);
    req.logger = req.logger.child({
      tenantId: decoded.tenantId,
      [scope === "user" ? "endUserId" : "adminId"]: decoded.id,
      email: await hashForLogging(decoded.email),
    });
    return next();
  } catch {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      error: "unauthorized",
      errorDescription: "Invalid token",
    });
  }
};

export const adminSessionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  return sessionMiddleware(req, res, next, "admin", verifyAdminToken, (req, decoded) => (req.admin = decoded));
};

export const endUserSessionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  return sessionMiddleware(req, res, next, "user", verifyEndUserToken, (req, decoded) => (req.user = decoded));
};

export const superAdminOnlyMiddleware = (
  req: Request<Record<string, string>, object, object>,
  res: Response,
  next: NextFunction,
) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  if (req.admin.role === AdminRole.superadmin) {
    return next();
  }
  return res.status(StatusCodes.FORBIDDEN).json({
    error: "forbidden",
    errorDescription: "Superadmin privileges required",
  });
};
