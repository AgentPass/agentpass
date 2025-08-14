import { Router } from "express";
import { deleteUserTokens, listUserTokens, revokeProviderToken } from "../controllers/tokens.controller.js";
import { blockUser, getUser, listUsers } from "../controllers/users.controller.js";
import { adminSessionMiddleware } from "../middlewares/session.middleware.js";

const router: Router = Router();

router.get("/", listUsers);
router.get("/:userId", getUser);
router.post("/:userId", blockUser);

router.get("/:userId/tokens", adminSessionMiddleware, listUserTokens);
router.delete("/:userId/tokens", adminSessionMiddleware, deleteUserTokens);
router.delete("/:userId/tokens/:tokenId", adminSessionMiddleware, revokeProviderToken);

export default router;
