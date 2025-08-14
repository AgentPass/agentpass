import { Router } from "express";
import {
  createProvider,
  deleteProvider,
  getProvider,
  getProviders,
  updateProvider,
} from "../controllers/oauth-providers.controller.js";

const router: Router = Router();

router.get("/", getProviders);
router.post("/", createProvider);
router.get("/:providerId", getProvider);
router.put("/:providerId", updateProvider);
router.delete("/:providerId", deleteProvider);

export default router;
