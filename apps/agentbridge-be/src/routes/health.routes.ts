import express from "express";
import { getHealth } from "../controllers/health.controller.js";

const router = express.Router();

router.get("/", getHealth);
router.get("/ready", getHealth);

export default router;
