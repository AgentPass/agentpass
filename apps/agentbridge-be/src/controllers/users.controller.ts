import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { CacheItemType, clearCacheByType } from "../services/cache.service.js";
import * as usersService from "../services/users.service.js";
import { queryToBoolean } from "../utils/qsParsers.js";
import { isAdminRequest, TypeGuardError } from "../utils/req-guards.js";

export const listUsers = async (
  req: Request<Record<string, string>, object, object, { search?: string; page?: string; limit?: string }>,
  res: Response,
) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  req.logger.debug("Listing users", { query: req.query });

  try {
    const tenantId = req.admin.tenantId;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const result = await usersService.listUsers(req.db, tenantId, req.query.search as string, page, limit);

    res.json(result);
  } catch (error) {
    req.logger.error("Failed to list users", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to list users" });
  }
};

export const getUser = async (req: Request<{ userId: string }>, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  req.logger.debug("Getting user", { userId: req.params.userId });

  try {
    const tenantId = req.admin.tenantId;
    const user = await usersService.getUser(req.db, req.params.userId, tenantId);

    if (!user) {
      res.status(StatusCodes.NOT_FOUND).json({ error: "User not found" });
      return;
    }

    res.json(user);
  } catch (error) {
    req.logger.error("Failed to get user", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to get user" });
  }
};

export const blockUser = async (req: Request<{ userId: string }>, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  req.logger.info("Blocking user server access", { userId: req.params.userId, block: req.query.block });

  try {
    const tenantId = req.admin.tenantId;

    const blocked = queryToBoolean(req.query.block);

    if (blocked === undefined) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid 'block' parameter. Expected 'true' or 'false'." });
      return;
    }

    await usersService.blockUserServerAccess(req.db, req.params.userId, tenantId, blocked);

    clearCacheByType(CacheItemType.SERVER_ACCESS);

    res.status(StatusCodes.OK).json({ blocked });
  } catch (error) {
    req.logger.error("Failed to block user server access", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to block user server access" });
  }
};
