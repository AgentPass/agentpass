import { Folder } from "@agentbridge/api";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as foldersService from "../services/folders.service.js";
import { isAdminRequest, TypeGuardError } from "../utils/req-guards.js";

export const listFolders = async (req: Request<{ serverId: string }>, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }
  req.logger.debug("Listing folders", { serverId: req.params.serverId, tenantId: req.admin.tenantId });
  try {
    const folders: Folder[] = await foldersService.listFolders(req.db, req.params.serverId, req.admin.tenantId);
    res.json(folders);
  } catch (error) {
    req.logger.error("Failed to list folders", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "internal_server_error",
      errorDescription: "Failed to list folders",
    });
  }
};

export const createFolder = async (
  req: Request<{ serverId: string }, object, { name: string; parentFolderId: string }>,
  res: Response,
) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  req.logger.info("Creating folder", { serverId: req.params.serverId, body: req.body });
  try {
    if (!req.admin.tenantId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: "unauthorized",
        errorDescription: "Tenant ID is required",
      });
    }

    const folder: Folder = await foldersService.createFolder(
      req.db,
      req.params.serverId,
      req.admin.tenantId,
      req.body.name,
      req.body.parentFolderId,
    );

    res.status(StatusCodes.CREATED).json(folder);
  } catch (error) {
    req.logger.error("Failed to create folder", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "internal_server_error",
      errorDescription: "Failed to create folder",
    });
  }
};

export const updateFolder = async (
  req: Request<{ serverId: string; folderId: string }, object, { name: string }>,
  res: Response,
) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  req.logger.info("Updating folder", {
    serverId: req.params.serverId,
    folderId: req.params.folderId,
    body: req.body,
    tenantId: req.admin.tenantId,
  });

  try {
    const folder: Folder = await foldersService.updateFolder(
      req.db,
      req.params.folderId,
      req.params.serverId,
      req.admin.tenantId,
      req.body.name,
    );

    res.json(folder);
  } catch (error) {
    req.logger.error("Failed to update folder", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "internal_server_error",
      errorDescription: "Failed to update folder",
    });
  }
};

export const deleteFolder = async (req: Request<{ serverId: string; folderId: string }>, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  req.logger.info("Deleting folder", { serverId: req.params.serverId, folderId: req.params.folderId });

  try {
    await foldersService.deleteFolder(req.db, req.params.folderId, req.params.serverId, req.admin.tenantId);

    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    req.logger.error("Failed to delete folder", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "internal_server_error",
      errorDescription: "Failed to delete folder",
    });
  }
};
