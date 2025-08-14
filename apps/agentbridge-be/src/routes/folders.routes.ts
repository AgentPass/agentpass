import { Router } from "express";
import { createFolder, deleteFolder, listFolders, updateFolder } from "../controllers/folders.controller.js";

const router: Router = Router();

router.get("/:serverId/folders", listFolders);
router.post("/:serverId/folders", createFolder);
router.put("/:serverId/folders/:folderId", updateFolder);
router.delete("/:serverId/folders/:folderId", deleteFolder);

export default router;
