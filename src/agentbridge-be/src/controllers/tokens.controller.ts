import { ProviderToken } from "@agentbridge/api";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as tokensService from "../services/tokens.service.js";
import { isAdminRequest, TypeGuardError } from "../utils/req-guards.js";

export const listUserTokens = async (
  req: Request<{ userId?: string }, object, object, { includeExpired?: string; provider?: string; scope?: string }>,
  res: Response,
) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  if (!req.params.userId) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: "User ID is required" });
    return;
  }

  req.logger.debug("Listing user tokens", {
    userId: req.params.userId,
    query: req.query,
  });

  try {
    const tokens: ProviderToken[] = await tokensService.listUserTokens(req.db, req.params.userId, req.admin.tenantId, {
      includeExpired: req.query.includeExpired === "true",
      providerName: req.query.provider as string | undefined,
      scope: req.query.scope as string | undefined,
    });

    res.json(tokens);
  } catch (error) {
    req.logger.error("Failed to list user tokens", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to list user tokens" });
  }
};

export const revokeProviderToken = async (req: Request<{ userId: string; tokenId: string }>, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  req.logger.info("Revoking provider token", {
    userId: req.params.userId,
    tokenId: req.params.tokenId,
  });

  try {
    const userExists = await tokensService.verifyUserExists(req.db, req.params.userId, req.admin.tenantId);

    if (!userExists) {
      res.status(StatusCodes.NOT_FOUND).json({ error: "User not found" });
      return;
    }

    await tokensService.revokeToken(req.db, req.params.tokenId, req.params.userId);

    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    req.logger.error("Failed to revoke provider token", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to revoke provider token" });
  }
};

export const deleteUserTokens = async (req: Request<{ userId: string }>, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  req.logger.info("Deleting user tokens", { userId: req.params.userId });

  try {
    const user = await tokensService.getUserByIdSlim(req.db, req.params.userId, req.admin.tenantId);

    if (!user) {
      res.status(StatusCodes.NOT_FOUND).json({ error: "User not found" });
      return;
    }

    await tokensService.deleteUserTokens(req.db, req.params.userId);

    tokensService.clearUserTokenCache(user.email);

    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    req.logger.error("Failed to delete user tokens", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to delete user tokens" });
  }
};
