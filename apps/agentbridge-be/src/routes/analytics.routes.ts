import { Router } from "express";
import { getServerAnalytics, getToolAnalytics } from "../controllers/analytics.controller.js";

const router: Router = Router();

router.get("/:serverId/analytics", getServerAnalytics);
router.get("/:serverId/tools/:toolId/analytics", getToolAnalytics);

export default router;
