import { Admin, AdminRole } from "@prisma/client";

import { UpdateAdminRequest } from "@agentbridge/api";
import { Logger } from "winston";
import { Database } from "../utils/connection.js";
import { analytics, AnalyticsEvents } from "./analytics.service.js";
import { sendAdminApprovedNotification } from "./email.service.js";
import { generateAdminToken } from "./jwt.service.js";

export async function createAdminUser(
  db: Database,
  email: string,
  tenantId: string,
  extras?: Partial<Omit<Admin, "email" | "tenantId">>,
) {
  let role: AdminRole;
  if (email.endsWith("@ownid.com")) {
    role = AdminRole.superadmin;
  } else {
    role = AdminRole.admin;
  }
  return await db.admin.create({
    data: {
      ...extras,
      email: email.toLowerCase(),
      tenantId: tenantId,
      role,
    },
  });
}

export async function createTenant(db: Database, name: string) {
  return await db.tenant.create({
    data: {
      name: name,
    },
  });
}

export async function setAdminOwnIdData(db: Database, email: string, ownIdData: string) {
  const admin = await db.admin.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
  });

  if (!admin) {
    return { status: "NOT_FOUND", error: "Admin not found" };
  }

  await db.admin.update({
    where: {
      id: admin.id,
    },
    data: {
      ownidData: ownIdData,
    },
  });
  return { status: "OK", error: null };
}

export async function getAdminOwnIdData(db: Database, logger: Logger, email: string) {
  let admin = await db.admin.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
  });

  if (!admin) {
    logger.debug("Admin not found, creating new admin", { email });
    // Create tenant and admin automatically for authenticated users
    try {
      const tenant = await createTenant(db, email);
      admin = await createAdminUser(db, email, tenant.id, {
        emailVerified: true,
        enabled: true,
      });
      logger.info("Auto-created admin account", { email, adminId: admin.id });
      await sendAdminApprovedNotification(logger, admin, false);
    } catch (error) {
      logger.error("Failed to create admin account", { email, error });
      return { status: "SERVER_ERROR", error: "Unable to create admin account" };
    }
  }

  logger.debug("Admin found", { email, ownidData: admin.ownidData, enabled: admin.enabled });

  if (!admin.enabled) {
    return { status: "LOCKED", error: "Admin not enabled" };
  }

  if (admin.ownidData) {
    return { status: "OK", data: { ownIdData: admin.ownidData } };
  }

  return { status: "NO_CONTENT" };
}

export async function createAdminSession(db: Database, logger: Logger, email: string) {
  const admin = await db.admin.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
  });

  if (!admin) {
    logger.debug("Admin not found", { email });
    return { status: "NOT_FOUND", error: "Admin not found" };
  }

  const token = await generateAdminToken(admin);
  return { status: "OK", data: { token } };
}

export async function getAdmins(db: Database) {
  return db.admin.findMany({
    where: {
      role: {
        in: ["admin", "superadmin"],
      },
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    include: { tenant: true },
  });
}

export async function putEnabled(
  db: Database,
  logger: Logger,
  adminId: string,
  enabled: boolean,
  sendNotification?: boolean,
  approvedByAdminId?: string,
) {
  const admin = await db.admin.update({
    where: { id: adminId },
    data: { enabled },
    include: { tenant: true },
  });

  if (enabled) {
    analytics.track(admin.id, AnalyticsEvents.ADMIN_ACCOUNT_ACTIVATED, {
      email: admin.email,
      tenant_id: admin.tenantId,
      activation_method: "manual_approval",
      approved_by: approvedByAdminId || "system",
      wait_time_hours: admin.createdAt
        ? Math.floor((Date.now() - new Date(admin.createdAt).getTime()) / (1000 * 60 * 60))
        : 0,
    });
  }
  if (sendNotification) {
    await sendAdminApprovedNotification(logger, admin);
  }
  return admin;
}

export async function putUpdateAdmin(db: Database, adminId: string, updates: UpdateAdminRequest) {
  const data: { name?: string; role?: AdminRole } = {};

  if (updates.name !== undefined) {
    data.name = updates.name;
  }

  if (updates.role !== undefined) {
    data.role = updates.role.toLowerCase() as AdminRole;
  }

  return db.admin.update({
    where: { id: adminId },
    data,
  });
}

export async function getAdmin(db: Database, adminId: string) {
  return db.admin.findUnique({
    where: { id: adminId },
  });
}
