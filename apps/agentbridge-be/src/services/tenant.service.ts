import { AdminRole, InvitationStatus, TenantRole } from "@prisma/client";
import { randomBytes } from "crypto";
import { addDays } from "date-fns";
import { Logger } from "winston";
import { Database } from "../utils/connection.js";
import { sendTenantInvitationEmail } from "./email.service.js";
const baseUrl = process.env.CONSOLE_URL || "http://localhost:4200";

export interface TenantUser {
  id: string;
  email: string;
  name?: string;
  role: AdminRole;
  createdAt: string;
  updatedAt: string;
}

export interface TenantInvitation {
  id: string;
  email: string;
  role: AdminRole;
  status: InvitationStatus;
  invitedBy: {
    id: string;
    email: string;
    name?: string;
  };
  acceptedBy?: {
    id: string;
    email: string;
    name?: string;
  };
  expiresAt: string;
  createdAt: string;
}

export async function getTenantUsers(db: Database, tenantId: string, currentUserId?: string) {
  // Get all admins (which now include members, admins, and superadmins)
  const admins = await db.admin.findMany({
    where: { tenantId },
    select: {
      id: true,
      email: true,
      name: true,
      givenName: true,
      familyName: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Format results
  const users = admins.map((admin) => ({
    id: admin.id,
    email: admin.email,
    name: admin.name || `${admin.givenName || ""} ${admin.familyName || ""}`.trim() || undefined,
    role: admin.role,
    createdAt: admin.createdAt.toISOString(),
    updatedAt: admin.updatedAt.toISOString(),
  }));

  // Filter out the current user if provided
  if (currentUserId) {
    return users.filter((user) => user.id !== currentUserId);
  }

  return users;
}

export async function getTenantInvitations(db: Database, tenantId: string) {
  const invitations = await db.tenantInvitation.findMany({
    where: { tenantId },
    include: {
      invitedBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      acceptedBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return invitations.map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    status: inv.status,
    invitedBy: {
      id: inv.invitedBy.id,
      email: inv.invitedBy.email,
      name: inv.invitedBy.name || undefined,
    },
    acceptedBy: inv.acceptedBy
      ? {
          id: inv.acceptedBy.id,
          email: inv.acceptedBy.email,
          name: inv.acceptedBy.name || undefined,
        }
      : undefined,
    expiresAt: inv.expiresAt.toISOString(),
    createdAt: inv.createdAt.toISOString(),
  }));
}

export async function createInvitation(
  db: Database,
  tenantId: string,
  email: string,
  role: TenantRole,
  invitedById: string,
  logger: Logger,
) {
  // Check if user is already a member
  const existingUser = await db.admin.findFirst({
    where: { email, tenantId },
  });

  if (existingUser) {
    throw new Error("User is already a member of this tenant");
  }

  // Check if there's already a pending invitation
  const existingPendingInvitation = await db.tenantInvitation.findFirst({
    where: { email, tenantId, status: InvitationStatus.pending },
  });

  if (existingPendingInvitation) {
    throw new Error("User already has a pending invitation");
  }

  // If there's a cancelled invitation, we'll update it instead of creating a new one
  const existingCancelledInvitation = await db.tenantInvitation.findFirst({
    where: { email, tenantId, status: InvitationStatus.cancelled },
  });

  // Verify the inviter exists
  const inviter = await db.admin.findUnique({
    where: { id: invitedById },
  });

  if (!inviter) {
    throw new Error("Invalid inviter ID");
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = addDays(new Date(), 7); // 7 days expiration

  let invitation;

  if (existingCancelledInvitation) {
    // Update the existing cancelled invitation
    invitation = await db.tenantInvitation.update({
      where: { id: existingCancelledInvitation.id },
      data: {
        role,
        invitedById,
        token,
        expiresAt,
        status: InvitationStatus.pending,
        acceptedById: null, // Clear any previous acceptance
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  } else {
    // Create a new invitation
    invitation = await db.tenantInvitation.create({
      data: {
        tenantId,
        email,
        role,
        invitedById,
        token,
        expiresAt,
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  // Fetch inviter and tenant
  const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
  const invitationLink = `${baseUrl}/invite/${invitation.token}`;

  try {
    await sendTenantInvitationEmail(
      logger,
      invitation.email,
      inviter?.name || inviter?.email || "Someone",
      tenant?.name || "Tenant",
      invitationLink,
      invitation.role,
      invitation.expiresAt,
    );
  } catch (err) {
    logger.debug("Failed to send tenant invitation email", err);
  }

  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    invitedBy: {
      id: invitation.invitedBy.id,
      email: invitation.invitedBy.email,
      name: invitation.invitedBy.name || undefined,
    },
    tenantName: tenant?.name || "Tenant",
    token: invitation.token,
    expiresAt: invitation.expiresAt.toISOString(),
    createdAt: invitation.createdAt.toISOString(),
  };
}

export async function acceptInvitation(db: Database, token: string) {
  const invitation = await db.tenantInvitation.findUnique({
    where: { token },
    include: { tenant: true },
  });

  if (!invitation) {
    throw new Error("Invalid invitation token");
  }

  if (invitation.status !== InvitationStatus.pending) {
    throw new Error("Invitation is no longer valid");
  }

  if (invitation.expiresAt < new Date()) {
    throw new Error("Invitation has expired");
  }

  // Check if user already exists in the tenant
  const existingUser = await db.admin.findFirst({
    where: { email: invitation.email, tenantId: invitation.tenantId },
  });

  if (existingUser) {
    throw new Error("User is already a member of this tenant");
  }

  // Generate a new user ID
  const userId = crypto.randomUUID();

  // Create user in Admin table with the specified role
  const adminRole = invitation.role as AdminRole;
  await db.admin.create({
    data: {
      id: userId,
      tenantId: invitation.tenantId,
      email: invitation.email,
      role: adminRole,
      enabled: true, // Auto-enable the user
      emailVerified: true, // Mark as verified since they came through invitation
    },
  });

  // Update invitation status
  await db.tenantInvitation.update({
    where: { id: invitation.id },
    data: {
      status: InvitationStatus.accepted,
      acceptedById: userId,
    },
  });

  return {
    tenantId: invitation.tenantId,
    tenantName: invitation.tenant.name,
    role: invitation.role,
    userId: userId,
  };
}

export async function updateUserRole(db: Database, tenantId: string, userId: string, role: AdminRole) {
  // Check if user exists
  const admin = await db.admin.findFirst({
    where: { id: userId, tenantId },
  });

  if (!admin) {
    throw new Error("User is not a member of this tenant");
  }

  // Update the admin's role
  const updatedAdmin = await db.admin.update({
    where: { id: userId },
    data: { role },
  });

  return {
    id: updatedAdmin.id,
    email: updatedAdmin.email,
    name: updatedAdmin.name || `${updatedAdmin.givenName || ""} ${updatedAdmin.familyName || ""}`.trim() || undefined,
    role: updatedAdmin.role,
    createdAt: updatedAdmin.createdAt.toISOString(),
    updatedAt: updatedAdmin.updatedAt.toISOString(),
  };
}

export async function removeUserFromTenant(db: Database, tenantId: string, userId: string) {
  // Check if user exists
  const admin = await db.admin.findFirst({
    where: { id: userId, tenantId },
  });

  if (!admin) {
    throw new Error("User is not a member of this tenant");
  }

  // Delete from admin table
  await db.admin.delete({ where: { id: userId } });
}

export async function cancelInvitation(db: Database, tenantId: string, invitationId: string) {
  const invitation = await db.tenantInvitation.findFirst({
    where: { id: invitationId, tenantId },
  });

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  if (invitation.status !== InvitationStatus.pending) {
    throw new Error("Cannot cancel non-pending invitation");
  }

  return db.tenantInvitation.update({
    where: { id: invitationId },
    data: { status: InvitationStatus.cancelled },
  });
}

export async function getUserTenants(db: Database, userId: string) {
  // Get user's tenants from admin table (which now includes all roles)
  const adminTenants = await db.admin.findMany({
    where: { id: userId },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return adminTenants.map((admin) => ({
    id: admin.tenant.id,
    name: admin.tenant.name,
    description: admin.tenant.description || undefined,
    role: admin.role,
    joinedAt: admin.createdAt.toISOString(),
  }));
}

export async function isUserTenantAdmin(db: Database, tenantId: string, userId: string): Promise<boolean> {
  const admin = await db.admin.findFirst({
    where: { id: userId, tenantId },
  });

  return !!admin;
}

export async function getInvitationByToken(db: Database, token: string) {
  const invitation = await db.tenantInvitation.findUnique({
    where: { token },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
        },
      },
      invitedBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (!invitation) {
    throw new Error("Invalid invitation token");
  }

  if (invitation.status !== InvitationStatus.pending) {
    throw new Error("Invitation is no longer valid");
  }

  if (invitation.expiresAt < new Date()) {
    throw new Error("Invitation has expired");
  }

  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    tenantName: invitation.tenant.name,
    invitedBy: {
      id: invitation.invitedBy.id,
      email: invitation.invitedBy.email,
      name: invitation.invitedBy.name || undefined,
    },
    expiresAt: invitation.expiresAt.toISOString(),
    createdAt: invitation.createdAt.toISOString(),
  };
}

// Role checking functions
export async function canManageUsers(db: Database, tenantId: string, userId: string): Promise<boolean> {
  const admin = await db.admin.findFirst({
    where: { id: userId, tenantId },
  });

  if (!admin) {
    return false;
  }

  // Only admins and superadmins can manage users
  return admin.role === AdminRole.admin || admin.role === AdminRole.superadmin;
}

export async function canManageRoles(db: Database, tenantId: string, userId: string): Promise<boolean> {
  const admin = await db.admin.findFirst({
    where: { id: userId, tenantId },
  });

  if (!admin) {
    return false;
  }

  // Only admins and superadmins can manage roles
  return admin.role === AdminRole.admin || admin.role === AdminRole.superadmin;
}

export async function canRemoveUsers(db: Database, tenantId: string, userId: string): Promise<boolean> {
  const admin = await db.admin.findFirst({
    where: { id: userId, tenantId },
  });

  if (!admin) {
    return false;
  }

  // Only admins and superadmins can remove users
  return admin.role === AdminRole.admin || admin.role === AdminRole.superadmin;
}

export async function canInviteUsers(db: Database, tenantId: string, userId: string): Promise<boolean> {
  const admin = await db.admin.findFirst({
    where: { id: userId, tenantId },
  });

  if (!admin) {
    return false;
  }

  // Only admins and superadmins can invite users
  return admin.role === AdminRole.admin || admin.role === AdminRole.superadmin;
}
