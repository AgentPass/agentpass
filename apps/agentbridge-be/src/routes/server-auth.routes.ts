import { Router } from "express";
import {
  createAuthProvider,
  deleteAuthProvider,
  getAuthProviders,
  getServerAuthConfig,
  updateAuthProvider,
  updateServerAuthConfig,
  validateJwksUrl,
} from "../controllers/server-auth.controller.js";

const router = Router();

// Server auth configuration routes
router.get("/:serverId/auth", getServerAuthConfig);
router.put("/:serverId/auth", updateServerAuthConfig);

// Auth provider routes (strategy-based)
router.get("/:serverId/auth-providers", getAuthProviders);
router.post("/:serverId/auth-providers", createAuthProvider);
router.put("/:serverId/auth-providers/:providerId", updateAuthProvider);
router.delete("/:serverId/auth-providers/:providerId", deleteAuthProvider);

// JWKS validation route (not server-specific)
router.post("/validate-jwks", validateJwksUrl);

export default router;
