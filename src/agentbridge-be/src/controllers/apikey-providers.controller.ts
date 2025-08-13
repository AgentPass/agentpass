import { ApiKeyProvider as PrismaApiKeyProvider } from "@prisma/client";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { DEFAULT_PAGE_SIZE } from "../utils/config.js";
import { isAdminRequest, TypeGuardError } from "../utils/req-guards.js";

const mapApiKeyProvider = (provider: PrismaApiKeyProvider) => ({
  ...provider,
  createdAt: provider.createdAt.toISOString(),
  updatedAt: provider.updatedAt.toISOString(),
});

export const getApiKeyProviders = async (
  req: Request<Record<string, string>, object, object, { page?: string; limit?: string }>,
  res: Response,
) => {
  if (!isAdminRequest(req)) throw new TypeGuardError();

  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : DEFAULT_PAGE_SIZE;

  try {
    const providers = (
      await req.db.apiKeyProvider.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: { tenantId: req.admin.tenantId },
      })
    ).map(mapApiKeyProvider);
    res.json({ data: providers });
  } catch (error) {
    req.logger.error("Failed to get API key providers", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to get API key providers" });
  }
};

export const createApiKeyProvider = async (
  req: Request<Record<string, string>, object, { name: string; keyName: string; keyIn: string; value?: string }>,
  res: Response,
) => {
  if (!isAdminRequest(req)) throw new TypeGuardError();

  try {
    if (!req.admin.tenantId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: "unauthorized",
        errorDescription: "Tenant ID is required",
      });
    }

    const provider = mapApiKeyProvider(
      await req.db.apiKeyProvider.create({
        data: {
          ...req.body,
          tenant: { connect: { id: req.admin.tenantId } },
        },
      }),
    );
    res.status(StatusCodes.CREATED).json(provider);
  } catch (error) {
    req.logger.error("Failed to create API key provider", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to create API key provider" });
  }
};

export const getApiKeyProvider = async (req: Request<{ providerId: string }>, res: Response) => {
  if (!isAdminRequest(req)) throw new TypeGuardError();

  try {
    const dbProvider = await req.db.apiKeyProvider.findUnique({
      where: { id: req.params.providerId, tenantId: req.admin.tenantId },
    });
    const provider = dbProvider ? mapApiKeyProvider(dbProvider) : null;
    res.json(provider);
  } catch (error) {
    req.logger.error("Failed to get API key provider", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to get API key provider" });
  }
};

export const updateApiKeyProvider = async (
  req: Request<{ providerId: string }, object, { name?: string; keyName?: string; keyIn?: string; value?: string }>,
  res: Response,
) => {
  if (!isAdminRequest(req)) throw new TypeGuardError();

  try {
    const provider = mapApiKeyProvider(
      await req.db.apiKeyProvider.update({
        where: { id: req.params.providerId, tenantId: req.admin.tenantId },
        data: req.body,
      }),
    );
    res.json(provider);
  } catch (error) {
    req.logger.error("Failed to update API key provider", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to update API key provider" });
  }
};

export const deleteApiKeyProvider = async (req: Request<{ providerId: string }>, res: Response) => {
  if (!isAdminRequest(req)) throw new TypeGuardError();

  try {
    const connectedToolsCount = await req.db.tool.count({
      where: { apiKeyProviderId: req.params.providerId },
    });

    if (connectedToolsCount > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Cannot delete provider that is connected to tools",
      });
    }

    await req.db.apiKeyProvider.delete({
      where: { id: req.params.providerId, tenantId: req.admin.tenantId },
    });
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    req.logger.error("Failed to delete API key provider", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to delete API key provider" });
  }
};
