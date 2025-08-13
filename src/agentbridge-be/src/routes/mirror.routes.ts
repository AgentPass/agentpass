import express from "express";
import { mirrorRequest } from "../controllers/mirror.controller.js";
import { adminSessionMiddleware } from "../middlewares/session.middleware.js";

const router = express.Router();

router.get("/", adminSessionMiddleware, mirrorRequest);

export default router;
