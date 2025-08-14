import { Router } from "express";
import {
  authorize,
  dynamicClientRegister,
  exchangeToken,
  getOAuthServerInfo,
  handleCallback,
} from "../controllers/oauth.controller.js";
import { serverIdMiddleware } from "../middlewares/serverId.middleware.js";

const router: Router = Router();

router.get("/.well-known/oauth-authorization-server", getOAuthServerInfo);
router.get("/api/oauth/authorize", serverIdMiddleware, authorize);
router.post("/api/oauth/token", exchangeToken);
router.get("/api/oauth/callback", handleCallback);
router.post("/api/oauth/register", dynamicClientRegister);

export default router;
