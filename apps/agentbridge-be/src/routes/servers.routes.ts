import { Router } from "express";
import {
  createExampleServer,
  createServer,
  createServerFromOpenApi,
  createTool,
  createToolsFromOpenApi,
  deleteServer,
  deleteTool,
  disableTool,
  enableTool,
  exportServer,
  getServer,
  getServers,
  getTool,
  importServer,
  listTools,
  runTool,
  updateServer,
  updateTool,
} from "../controllers/servers.controller.js";

const router: Router = Router();

// Server Management
router.get("/", getServers);
router.post("/", createServer);
router.get("/:serverId", getServer);
router.put("/:serverId", updateServer);
router.delete("/:serverId", deleteServer);
router.get("/:serverId/export", exportServer);

// Tools Management
router.get("/:serverId/tools", listTools);
router.post("/:serverId/tools", createTool);
router.post("/:serverId/tools/import/openapi", createToolsFromOpenApi);
router.get("/:serverId/tools/:toolId", getTool);
router.put("/:serverId/tools/:toolId", updateTool);
router.delete("/:serverId/tools/:toolId", deleteTool);
router.post("/:serverId/tools/:toolId/run", runTool);
router.put("/:serverId/tools/:toolId/enable", enableTool);
router.put("/:serverId/tools/:toolId/disable", disableTool);

// Import Management
router.post("/import/openapi", createServerFromOpenApi);
router.post("/import", importServer);
router.post("/example", createExampleServer);

export default router;
