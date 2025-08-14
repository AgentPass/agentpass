import { CreateProviderRequest, OAuthProvider, UpdateProviderRequest } from "@agentbridge/api";
import { OAuthProvider as PrismaOAuthProvider } from "@prisma/client";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import omit from "lodash/omit.js";
import { DEFAULT_PAGE_SIZE } from "../utils/config.js";
import { isAdminRequest, TypeGuardError } from "../utils/req-guards.js";

const mapProvider = (provider: PrismaOAuthProvider): OAuthProvider => ({
  ...omit(provider, ["clientSecret"]),
  contentType: provider.contentType || undefined,
  refreshUrl: provider.refreshUrl || undefined,
  createdAt: provider.createdAt.toISOString(),
  updatedAt: provider.updatedAt.toISOString(),
});

export const getProviders = async (
  req: Request<Record<string, string>, object, object, { page?: string; limit?: string }>,
  res: Response,
) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : DEFAULT_PAGE_SIZE;
  req.logger.debug("Getting all providers", { query: req.query, tenantId: req.admin.tenantId });

  try {
    const providers: OAuthProvider[] = (
      await req.db.oAuthProvider.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: {
          tenantId: req.admin.tenantId,
        },
      })
    ).map(mapProvider);
    res.json({ data: providers });
  } catch (error) {
    req.logger.error("Failed to get providers", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to get providers" });
  }
};

export const createProvider = async (
  req: Request<Record<string, string>, object, CreateProviderRequest>,
  res: Response,
) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  req.logger.info("Creating new provider", { body: req.body });
  try {
    if (!req.admin.tenantId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: "unauthorized",
        errorDescription: "Tenant ID is required",
      });
    }

    const provider: OAuthProvider = mapProvider(
      await req.db.oAuthProvider.create({
        data: {
          ...req.body,
          clientSecret: req.body.clientSecret || "",
          tenant: { connect: { id: req.admin.tenantId } },
        },
      }),
    );
    res.status(StatusCodes.CREATED).json(provider);
  } catch (error) {
    req.logger.error("Failed to create provider", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to create provider" });
  }
};

export const getProvider = async (req: Request<{ providerId: string }>, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  req.logger.debug("Getting provider", { providerId: req.params.providerId, tenantId: req.admin.tenantId });
  try {
    const dbProvider = await req.db.oAuthProvider.findUnique({
      where: { id: req.params.providerId, tenantId: req.admin.tenantId },
    });
    const provider: OAuthProvider | null = dbProvider ? mapProvider(dbProvider) : null;
    res.json(provider);
  } catch (error) {
    req.logger.error("Failed to get provider", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to get provider" });
  }
};

export const updateProvider = async (
  req: Request<{ providerId: string }, object, UpdateProviderRequest>,
  res: Response,
) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  req.logger.info("Updating provider", {
    providerId: req.params.providerId,
    body: req.body,
    tenantId: req.admin.tenantId,
  });
  try {
    const provider: OAuthProvider = mapProvider(
      await req.db.oAuthProvider.update({
        where: { id: req.params.providerId, tenantId: req.admin.tenantId },
        data: req.body,
      }),
    );

    res.json(provider);
  } catch (error) {
    req.logger.error("Failed to update provider", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to update provider" });
  }
};

export const deleteProvider = async (req: Request<{ providerId: string }>, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  req.logger.info("Deleting provider", { providerId: req.params.providerId, tenantId: req.admin.tenantId });
  try {
    const connectedToolsCount = await req.db.tool.count({
      where: { oAuthProviderId: req.params.providerId },
    });

    if (connectedToolsCount > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Cannot delete provider that is connected to tools",
      });
    }

    await req.db.oAuthProvider.delete({
      where: { id: req.params.providerId, tenantId: req.admin.tenantId },
    });
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    req.logger.error("Failed to delete provider", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to delete provider" });
  }
};
