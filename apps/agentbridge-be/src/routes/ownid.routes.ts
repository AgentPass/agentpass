import express from "express";
import { config, createSession, getData, setData } from "../controllers/ownid.controller.js";
import { ownidAdminMiddleware, ownidEndUserMiddleware } from "../middlewares/ownid.middleware.js";

const router = express.Router();

router.get("/config", config);

router.post("/admin/setOwnIDDataByLoginId", ownidAdminMiddleware, setData);
router.post("/admin/getOwnIDDataByLoginId", ownidAdminMiddleware, getData);
router.post("/admin/getSessionByLoginId", ownidAdminMiddleware, createSession);

router.post("/enduser/setOwnIDDataByLoginId", ownidEndUserMiddleware, setData);
router.post("/enduser/getOwnIDDataByLoginId", ownidEndUserMiddleware, getData);
router.post("/enduser/getSessionByLoginId", ownidEndUserMiddleware, createSession);

export default router;
