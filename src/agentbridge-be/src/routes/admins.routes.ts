import { Router } from "express";
import {
  addToWaitlist,
  enableAdmin,
  listAdmins,
  sendAdminApprovedNotification,
  updateAdmin,
} from "../controllers/admins.controller.js";
import { adminSessionMiddleware, superAdminOnlyMiddleware } from "../middlewares/session.middleware.js";

const router = Router();

router.post("/waitlist", addToWaitlist);
router.put("/:adminId/enable", adminSessionMiddleware, superAdminOnlyMiddleware, enableAdmin);
router.put("/:adminId", adminSessionMiddleware, superAdminOnlyMiddleware, updateAdmin);
router.get("/", adminSessionMiddleware, superAdminOnlyMiddleware, listAdmins);
router.post(
  "/:adminId/send-approved-notification",
  adminSessionMiddleware,
  superAdminOnlyMiddleware,
  sendAdminApprovedNotification,
);

export default router;
