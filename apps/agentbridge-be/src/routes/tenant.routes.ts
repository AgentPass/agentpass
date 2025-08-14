import { Router } from "express";
import * as tenantController from "../controllers/tenant.controller.js";
import { requireAdmin } from "../middlewares/role.middleware.js";
import { adminSessionMiddleware } from "../middlewares/session.middleware.js";

const router = Router();

// Routes that require admin session and admin role
router.get("/users", adminSessionMiddleware, tenantController.getTenantUsers);
router.get("/invitations", adminSessionMiddleware, requireAdmin, tenantController.getTenantInvitations);
router.post("/invitations", adminSessionMiddleware, requireAdmin, tenantController.createInvitation);
router.put("/users/:userId/role", adminSessionMiddleware, requireAdmin, tenantController.updateUserRole);
router.delete("/users/:userId", adminSessionMiddleware, requireAdmin, tenantController.removeUserFromTenant);
router.delete("/invitations/:invitationId", adminSessionMiddleware, requireAdmin, tenantController.cancelInvitation);

// Public routes (for accepting invitations)
router.get("/invitations/:token", tenantController.getInvitationByToken);
router.post("/invitations/accept", tenantController.acceptInvitation);
router.get("/user/tenants", tenantController.getUserTenants);

export default router;
