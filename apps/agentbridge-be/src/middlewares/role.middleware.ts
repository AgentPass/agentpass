import { AdminRole } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { isAdminRequest, TypeGuardError } from "../utils/req-guards.js";

export const requireRole = (requiredRoles: AdminRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!isAdminRequest(req)) {
      throw new TypeGuardError();
    }

    const userRole = req.admin.role;

    if (!requiredRoles.includes(userRole)) {
      req.logger.warn("Insufficient permissions", {
        userRole,
        requiredRoles,
        userId: req.admin.id,
        path: req.path,
      });

      return res.status(StatusCodes.FORBIDDEN).json({
        error: "insufficient_permissions",
        errorDescription: "You don't have permission to perform this action",
      });
    }

    next();
  };
};

// Convenience middleware for specific roles
export const requireAdmin = requireRole([AdminRole.admin, AdminRole.superadmin]);
export const requireSuperAdmin = requireRole([AdminRole.superadmin]);
export const requireMember = requireRole([AdminRole.admin, AdminRole.superadmin]);
