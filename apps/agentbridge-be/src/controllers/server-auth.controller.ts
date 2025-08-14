import { UpdateServerAuthConfigRequest } from "@agentbridge/api";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ServerAuthService } from "../services/server-auth.service.js";
import { isAdminRequest, TypeGuardError } from "../utils/req-guards.js";

export const getServerAuthConfig = async (req: Request, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  try {
    const { serverId } = req.params;
    const serverAuthService = new ServerAuthService(req.db, req.logger);
    const config = await serverAuthService.getServerAuthConfig(serverId);
    res.json(config);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    req.logger.error("Failed to get server auth config", { error: errorMessage });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
  }
};

export const updateServerAuthConfig = async (req: Request, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  try {
    const { serverId } = req.params;
    const updateRequest: UpdateServerAuthConfigRequest = req.body;
    const serverAuthService = new ServerAuthService(req.db, req.logger);
    const config = await serverAuthService.updateServerAuthConfig(serverId, updateRequest);
    res.json(config);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    req.logger.error("Failed to update server auth config", { error: errorMessage });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
  }
};

export const getAuthProviders = async (req: Request, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  try {
    const { serverId } = req.params;
    const serverAuthService = new ServerAuthService(req.db, req.logger);
    const providers = await serverAuthService.getAuthProviders(serverId);
    res.json(providers);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    req.logger.error("Failed to get auth providers", { error: errorMessage });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
  }
};

export const createAuthProvider = async (req: Request, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  try {
    const { serverId } = req.params;
    const providerData = req.body;
    const serverAuthService = new ServerAuthService(req.db, req.logger);
    const provider = await serverAuthService.createAuthProvider(serverId, providerData);
    res.status(StatusCodes.CREATED).json(provider);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    req.logger.error("Failed to create auth provider", { error: errorMessage });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
  }
};

export const updateAuthProvider = async (req: Request, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  try {
    const { serverId, providerId } = req.params;
    const providerData = req.body;
    const serverAuthService = new ServerAuthService(req.db, req.logger);
    const provider = await serverAuthService.updateAuthProvider(serverId, providerId, providerData);
    res.json(provider);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    req.logger.error("Failed to update auth provider", { error: errorMessage });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
  }
};

export const deleteAuthProvider = async (req: Request, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  try {
    const { serverId, providerId } = req.params;
    const serverAuthService = new ServerAuthService(req.db, req.logger);
    await serverAuthService.deleteAuthProvider(serverId, providerId);
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    req.logger.error("Failed to delete auth provider", { error: errorMessage });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
  }
};

export const validateJwksUrl = async (req: Request, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  try {
    const { jwksUrl } = req.body;

    if (!jwksUrl || typeof jwksUrl !== "string") {
      res.status(StatusCodes.BAD_REQUEST).json({
        valid: false,
        error: "JWKS URL is required",
      });
      return;
    }

    const serverAuthService = new ServerAuthService(req.db, req.logger);
    const result = await serverAuthService.validateJwksUrl(jwksUrl);
    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    req.logger.error("Failed to validate JWKS URL", { error: errorMessage });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      valid: false,
      error: "Internal server error",
    });
  }
};
