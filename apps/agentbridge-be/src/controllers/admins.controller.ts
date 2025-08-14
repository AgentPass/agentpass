import { UpdateAdminRequest } from "@agentbridge/api";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  createAdminUser,
  createTenant,
  getAdmin,
  getAdmins,
  putEnabled,
  putUpdateAdmin,
} from "../services/admins.service.js";
import { analytics, AnalyticsEvents } from "../services/analytics.service.js";
import { sendAdminApprovedNotification as sendAdminApprovedNotificationService } from "../services/email.service.js";
import { verifyAdminVerificationToken } from "../services/jwt.service.js";
import { isAdminRequest, isAppRequest, TypeGuardError } from "../utils/req-guards.js";

export const addToWaitlist = async (
  req: Request<Record<string, string>, object, { email: string; easterEggBypass?: boolean }>,
  res: Response,
) => {
  if (!isAppRequest(req)) {
    throw new TypeGuardError();
  }
  const email = req.body.email.toLowerCase();
  const easterEggBypass = req.body.easterEggBypass || false;

  req.logger.debug("Processing waitlist request", { email, easterEggBypass });

  try {
    // First check if admin already exists
    const existingAdmin = await req.db.admin.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    if (existingAdmin) {
      // If user exists and is not enabled, enable them
      if (!existingAdmin.enabled) {
        await req.db.admin.update({
          where: { id: existingAdmin.id },
          data: { enabled: true },
        });

        await sendAdminApprovedNotificationService(req.logger, existingAdmin, false);
        req.logger.info("Auto-enabled existing user", { email });

        return res.status(StatusCodes.OK).json({ message: "Account enabled!" });
      }

      // User already exists and is enabled
      return res.status(StatusCodes.OK).json({ message: "User already has access" });
    }

    // Create new tenant and admin
    let admin;
    try {
      const tenant = await createTenant(req.db, email);
      admin = await createAdminUser(req.db, email, tenant.id, {
        emailVerified: true,
        enabled: true,
      });

      // Track account activation for all new users
      analytics.track(admin.id, AnalyticsEvents.ADMIN_ACCOUNT_ACTIVATED, {
        email: admin.email,
        tenant_id: admin.tenantId,
        activation_method: "automatic",
        approved_by: "system",
        wait_time_hours: 0,
      });
    } catch (createError: unknown) {
      // Handle the case where admin was created by another concurrent request
      const error = createError as { code?: string; meta?: { target?: string[] } };
      if (error.code === "P2002" && error.meta?.target?.includes("email")) {
        req.logger.info("Admin was created concurrently, fetching existing", { email });

        // Try to find the admin that was just created
        const existingAdmin = await req.db.admin.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
        });

        if (existingAdmin) {
          // If user was created concurrently and not enabled, enable them
          if (!existingAdmin.enabled) {
            admin = await req.db.admin.update({
              where: { id: existingAdmin.id },
              data: { enabled: true },
            });

            // Track account activation
            analytics.track(admin.id, AnalyticsEvents.ADMIN_ACCOUNT_ACTIVATED, {
              email: admin.email,
              tenant_id: admin.tenantId,
              activation_method: "automatic",
              approved_by: "system",
              wait_time_hours: Math.round((Date.now() - existingAdmin.createdAt.getTime()) / (1000 * 60 * 60)),
            });

            await sendAdminApprovedNotificationService(req.logger, admin, false);
            req.logger.info("Auto-enabled concurrent user", { email });
          } else {
            admin = existingAdmin;
          }
        } else {
          throw createError; // Re-throw if we still can't find the admin
        }
      } else {
        throw createError; // Re-throw if it's not a duplicate email error
      }
    }

    // Send approval email for all new users
    const success = await sendAdminApprovedNotificationService(req.logger, admin, false);

    req.logger.info("User account created and auto-enabled", { email });

    if (success) {
      res.status(StatusCodes.OK).json({ message: "Account created and enabled!" });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to send email" });
    }
  } catch (error) {
    req.logger.error("Error in addToWaitlist", { error, email });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to process request" });
  }
};

export const listAdmins = async (req: Request<Record<string, string>, object, object>, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }
  const admins = await getAdmins(req.db);

  if (!admins) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: "No admins found" });
  }
  res.json(admins);
};

export const updateAdmin = async (req: Request<Record<string, string>, object, UpdateAdminRequest>, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }
  const admin = await putUpdateAdmin(req.db, req.params.adminId, req.body);

  res.json(admin);
};

export const enableAdmin = async (
  req: Request<Record<string, string>, object, { token?: string; enabled: boolean; sendNotification?: boolean }>,
  res: Response,
) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }
  let adminId = req.params.adminId;
  if (req.body.token) {
    const admin = await verifyAdminVerificationToken(req.body.token);
    if (!admin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Invalid verification token" });
    }
    adminId = admin.id;
  }
  const admin = await putEnabled(
    req.db,
    req.logger,
    adminId,
    req.body.enabled,
    req.body.sendNotification,
    req.admin.id,
  );

  res.json(admin);
};

export const sendAdminApprovedNotification = async (
  req: Request<Record<string, string>, object, { adminId: string }>,
  res: Response,
) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }
  const admin = await getAdmin(req.db, req.params.adminId);
  if (!admin) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: "Admin not found" });
  }
  await sendAdminApprovedNotificationService(req.logger, admin);

  res.json(admin);
};
