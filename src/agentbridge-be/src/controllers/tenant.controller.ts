import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as tenantService from "../services/tenant.service.js";
import { isAdminRequest, isAppRequest, TypeGuardError } from "../utils/req-guards.js";

export const getTenantUsers = async (req: Request, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  req.logger.debug("Getting tenant users");

  try {
    const tenantId = req.admin.tenantId;
    const currentUserId = req.admin.id;

    // Check if user can view other users (all roles can view users)
    const users = await tenantService.getTenantUsers(req.db, tenantId, currentUserId);
    res.json(users);
  } catch (error) {
    req.logger.error("Failed to get tenant users", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to get tenant users" });
  }
};

export const getTenantInvitations = async (req: Request, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  req.logger.debug("Getting tenant invitations");

  try {
    const tenantId = req.admin.tenantId;
    const currentUserId = req.admin.id;

    // Check if user can view invitations (only admins can view invitations)
    const canInvite = await tenantService.canInviteUsers(req.db, tenantId, currentUserId);
    if (!canInvite) {
      return res.status(StatusCodes.FORBIDDEN).json({
        error: "insufficient_permissions",
        errorDescription: "You don't have permission to view invitations",
      });
    }

    const invitations = await tenantService.getTenantInvitations(req.db, tenantId);
    res.json(invitations);
  } catch (error) {
    req.logger.error("Failed to get tenant invitations", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to get tenant invitations" });
  }
};

export const createInvitation = async (req: Request, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  req.logger.info("Creating invitation", { email: req.body.email, role: req.body.role });

  try {
    const tenantId = req.admin.tenantId;
    const currentUserId = req.admin.id;
    const { email, role } = req.body;

    if (!email || !role) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: "Email and role are required" });
      return;
    }

    if (!["admin", "member"].includes(role)) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid role" });
      return;
    }

    // Check if user can invite others
    const canInvite = await tenantService.canInviteUsers(req.db, tenantId, currentUserId);
    if (!canInvite) {
      return res.status(StatusCodes.FORBIDDEN).json({
        error: "insufficient_permissions",
        errorDescription: "You don't have permission to invite users",
      });
    }

    const invitation = await tenantService.createInvitation(req.db, tenantId, email, role, req.admin.id, req.logger);
    res.status(StatusCodes.CREATED).json(invitation);
  } catch (error) {
    req.logger.error("Failed to create invitation", error);
    if (error instanceof Error) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to create invitation" });
    }
  }
};

export const getInvitationByToken = async (req: Request, res: Response) => {
  if (!isAppRequest(req)) {
    throw new TypeGuardError();
  }

  req.logger.debug("Getting invitation by token");

  try {
    const { token } = req.params;

    if (!token) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: "Token is required" });
      return;
    }

    const invitation = await tenantService.getInvitationByToken(req.db, token);
    res.json(invitation);
  } catch (error) {
    req.logger.error("Failed to get invitation by token", error);
    if (error instanceof Error) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to get invitation" });
    }
  }
};

export const acceptInvitation = async (req: Request, res: Response) => {
  if (!isAppRequest(req)) {
    throw new TypeGuardError();
  }

  req.logger.info("Accepting invitation");

  try {
    const { token } = req.body;

    if (!token) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: "Token is required" });
      return;
    }

    const result = await tenantService.acceptInvitation(req.db, token);
    res.json(result);
  } catch (error) {
    req.logger.error("Failed to accept invitation", error);
    if (error instanceof Error) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to accept invitation" });
    }
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  req.logger.info("Updating user role", { userId: req.params.userId, role: req.body.role });

  try {
    const tenantId = req.admin.tenantId;
    const currentUserId = req.admin.id;
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !["admin", "member", "superadmin"].includes(role)) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: "Valid role is required" });
      return;
    }

    // Check if user can manage roles
    const canManageRoles = await tenantService.canManageRoles(req.db, tenantId, currentUserId);
    if (!canManageRoles) {
      return res.status(StatusCodes.FORBIDDEN).json({
        error: "insufficient_permissions",
        errorDescription: "You don't have permission to manage user roles",
      });
    }

    // Prevent users from changing their own role
    if (currentUserId === userId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "invalid_operation",
        errorDescription: "You cannot change your own role",
      });
    }

    const updatedUser = await tenantService.updateUserRole(req.db, tenantId, userId, role);
    res.json(updatedUser);
  } catch (error) {
    req.logger.error("Failed to update user role", error);
    if (error instanceof Error) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to update user role" });
    }
  }
};

export const removeUserFromTenant = async (req: Request, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  req.logger.info("Removing user from tenant", { userId: req.params.userId });

  try {
    const tenantId = req.admin.tenantId;
    const currentUserId = req.admin.id;
    const { userId } = req.params;

    // Check if user can remove other users
    const canRemoveUsers = await tenantService.canRemoveUsers(req.db, tenantId, currentUserId);
    if (!canRemoveUsers) {
      return res.status(StatusCodes.FORBIDDEN).json({
        error: "insufficient_permissions",
        errorDescription: "You don't have permission to remove users",
      });
    }

    // Prevent users from removing themselves
    if (currentUserId === userId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "invalid_operation",
        errorDescription: "You cannot remove yourself from the tenant",
      });
    }

    await tenantService.removeUserFromTenant(req.db, tenantId, userId);
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    req.logger.error("Failed to remove user from tenant", error);
    if (error instanceof Error) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to remove user from tenant" });
    }
  }
};

export const cancelInvitation = async (req: Request, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  req.logger.info("Cancelling invitation", { invitationId: req.params.invitationId });

  try {
    const tenantId = req.admin.tenantId;
    const currentUserId = req.admin.id;
    const { invitationId } = req.params;

    // Check if user can manage invitations
    const canInvite = await tenantService.canInviteUsers(req.db, tenantId, currentUserId);
    if (!canInvite) {
      return res.status(StatusCodes.FORBIDDEN).json({
        error: "insufficient_permissions",
        errorDescription: "You don't have permission to cancel invitations",
      });
    }

    await tenantService.cancelInvitation(req.db, tenantId, invitationId);
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    req.logger.error("Failed to cancel invitation", error);
    if (error instanceof Error) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to cancel invitation" });
    }
  }
};

export const getUserTenants = async (req: Request, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  req.logger.debug("Getting user tenants");

  try {
    const tenants = await tenantService.getUserTenants(req.db, req.admin.id);
    res.json(tenants);
  } catch (error) {
    req.logger.error("Failed to get user tenants", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to get user tenants" });
  }
};
