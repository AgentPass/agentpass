import { CreateServerRequest, CreateToolRequest, ToolRunRequest, UpdateServerRequest } from "@agentbridge/api";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import yaml from "js-yaml";
import { executeApiRequest } from "../services/api-exec/api-tool-executor.js";
import { CacheItemType } from "../services/cache.service.js";
import { getUserUseableTokens, refreshAndPersistAccessToken } from "../services/oauth.service.js";
import * as serversService from "../services/servers.service.js";
import { OpenApiDocument, validateOpenApiContent } from "../utils/openapi.js";
import { isAdminRequest, TypeGuardError } from "../utils/req-guards.js";

export const getServers = async (req: Request, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  req.logger.debug("Getting all servers for tenant", { tenantId: req.admin.tenantId });

  try {
    const servers = await serversService.getServersForTenant(req.db, req.admin.tenantId as string);
    res.json(servers);
  } catch (error) {
    req.logger.error("Failed to get servers", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "server_list_failed",
      errorDescription: "Failed to get servers",
    });
  }
};

export const createServer = async (
  req: Request<Record<string, string>, object, CreateServerRequest>,
  res: Response,
) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }
  try {
    req.logger.info("Creating new server", { body: req.body });
    const server = await serversService.createServer(req.db, req.admin.tenantId, {
      name: req.body.name,
      description: req.body.description,
      enabled: req.body.enabled ?? true,
      baseUrl: req.body.baseUrl,
    });

    res.status(StatusCodes.CREATED).json(server);
  } catch (error) {
    req.logger.error("Failed to create server", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "internal_server_error",
      errorDescription: "Failed to create server",
    });
  }
};

export const getServer = async (req: Request<{ serverId: string }>, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }
  try {
    req.logger.debug("Getting server", { serverId: req.params.serverId });
    const server = await serversService.getServerById(req.db, req.admin.tenantId, req.params.serverId);
    if (!server) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "server_not_found",
        errorDescription: `Server not found: ${req.params.serverId}`,
      });
    }

    res.json(server);
  } catch (error) {
    req.logger.error("Failed to get server", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "internal_server_error",
      errorDescription: "Failed to get server",
    });
  }
};

export const updateServer = async (req: Request<{ serverId: string }, object, UpdateServerRequest>, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }
  req.logger.info("Updating server", { serverId: req.params.serverId, body: req.body });
  try {
    const server = await serversService.updateServerById(req.db, req.admin.tenantId, req.params.serverId, req.body);

    const { clearCache, clearCacheByPartialKey } = await import("../services/cache.service.js");
    clearCache({ type: CacheItemType.SERVER, ids: [server.id] });
    clearCacheByPartialKey(CacheItemType.SERVER_ACCESS, server.id);

    res.json(server);
  } catch (error) {
    req.logger.error("Failed to update server", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "internal_server_error",
      errorDescription: "Failed to update server",
    });
  }
};

export const deleteServer = async (req: Request<{ serverId: string }>, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }
  req.logger.info("Deleting server", { serverId: req.params.serverId });

  // Get server data before deleting to access the tenantId
  const server = await serversService.getServerSlim(req.db, req.admin.tenantId, req.params.serverId);

  if (server) {
    await serversService.deleteServerById(req.db, req.admin.tenantId, req.params.serverId);

    const { clearCache, clearCacheByPartialKey } = await import("../services/cache.service.js");
    clearCache({ type: CacheItemType.SERVER, ids: [server.id] });
    clearCacheByPartialKey(CacheItemType.SERVER_ACCESS, server.id);

    req.logger.debug("Server deleted and caches cleared", { serverId: req.params.serverId });
  }

  res.status(StatusCodes.NO_CONTENT).send();
};

export const createServerFromOpenApi = async (req: Request, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }
  req.logger.info("Creating server from OpenAPI specification");

  try {
    const fileContent = req.body;
    if (!fileContent || !Buffer.isBuffer(fileContent)) {
      req.logger.warn("OpenAPI specification file is required and must be sent as octet-stream");
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "invalid_request",
        errorDescription: "OpenAPI specification file is required and must be sent as octet-stream",
      });
    }

    let openApiContent: OpenApiDocument;
    try {
      const yamlContent = fileContent.toString("utf8");

      if (!yamlContent.trim()) {
        req.logger.warn("OpenAPI content is empty");
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: "invalid_openapi",
          errorDescription: "OpenAPI content is empty",
        });
      }

      openApiContent = yaml.load(yamlContent);

      if (!("openapi" in openApiContent) || !openApiContent.openapi.startsWith("3")) {
        throw new Error("OpenAPI version is not supported");
      }
    } catch (error) {
      req.logger.error("Failed to parse OpenAPI content", error);
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "invalid_openapi",
        errorDescription: "Invalid OpenAPI format",
      });
    }

    const validationError = await validateOpenApiContent(openApiContent);
    if (validationError) {
      req.logger.warn(validationError.errorDescription);
      return res.status(StatusCodes.BAD_REQUEST).json(validationError);
    }

    req.logger.debug("Parsed OpenAPI content:", openApiContent);
    const tenantId = req.admin.tenantId!;

    const selectedTools = req.query.selectedTools
      ? Array.isArray(req.query.selectedTools)
        ? (req.query.selectedTools as string[])
        : [req.query.selectedTools as string]
      : undefined;

    const result = await serversService.createServerFromOpenApiSpec(
      req.db,
      tenantId,
      req.query.name as string | null,
      req.query.description as string | null,
      openApiContent,
      selectedTools,
    );

    return res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    req.logger.error("Failed to create server from OpenAPI", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "server_creation_failed",
      errorDescription: error instanceof Error ? error.message : "Failed to create server from OpenAPI",
    });
  }
};

export const createToolsFromOpenApi = async (req: Request<{ serverId: string }>, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }
  req.logger.info("Creating tools from OpenAPI specification", { serverId: req.params.serverId });

  try {
    const fileContent = req.body;
    if (!fileContent || !Buffer.isBuffer(fileContent)) {
      req.logger.warn("OpenAPI specification file is required and must be sent as octet-stream");
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "invalid_request",
        errorDescription: "OpenAPI specification file is required and must be sent as octet-stream",
      });
    }

    let openApiContent: OpenApiDocument;
    try {
      const yamlContent = fileContent.toString("utf8");

      if (!yamlContent.trim()) {
        req.logger.warn("OpenAPI content is empty");
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: "invalid_openapi",
          errorDescription: "OpenAPI content is empty",
        });
      }

      openApiContent = yaml.load(yamlContent);

      if (!("openapi" in openApiContent) || !openApiContent.openapi.startsWith("3")) {
        throw new Error("OpenAPI version is not supported");
      }
    } catch (error) {
      req.logger.error("Failed to parse OpenAPI content", error);
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "invalid_openapi",
        errorDescription: "Invalid OpenAPI format",
      });
    }

    const validationError = await validateOpenApiContent(openApiContent);
    if (validationError) {
      req.logger.warn(validationError.errorDescription);
      return res.status(StatusCodes.BAD_REQUEST).json(validationError);
    }

    req.logger.debug("Parsed OpenAPI content:", openApiContent);
    const tenantId = req.admin.tenantId!;
    const serverId = req.params.serverId;

    const selectedTools = req.query.selectedTools
      ? Array.isArray(req.query.selectedTools)
        ? (req.query.selectedTools as string[])
        : [req.query.selectedTools as string]
      : undefined;

    const result = await serversService.createToolsFromOpenApiSpec(
      req.db,
      tenantId,
      serverId,
      openApiContent,
      selectedTools,
    );

    return res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    req.logger.error("Failed to create tools from OpenAPI", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "tools_creation_failed",
      errorDescription: error instanceof Error ? error.message : "Failed to create tools from OpenAPI",
    });
  }
};

export const listTools = async (req: Request<{ serverId: string }>, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }
  req.logger.debug("Listing tools", { serverId: req.params.serverId });
  try {
    const tools = await serversService.getToolsForServer(
      req.db,
      req.admin.tenantId,
      req.params.serverId,
      req.admin.email,
    );
    res.json({ data: tools });
  } catch (error) {
    req.logger.error("Failed to list tools", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "internal_server_error",
      errorDescription: "Failed to list tools",
    });
  }
};

export const createTool = async (req: Request<{ serverId: string }, object, CreateToolRequest>, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }
  req.logger.info("Creating tool", { serverId: req.params.serverId, body: req.body });

  try {
    const tool = await serversService.createTool(req.db, req.params.serverId, req.admin.tenantId!, req.body);

    res.status(StatusCodes.CREATED).json(tool);
  } catch (error) {
    req.logger.error("Error creating tool", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "internal_server_error",
      errorDescription: "Failed to create tool",
    });
  }
};

export const getTool = async (req: Request<{ serverId: string; toolId: string }>, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }
  req.logger.debug("Getting tool", { serverId: req.params.serverId, toolId: req.params.toolId });
  try {
    const tool = await serversService.getToolById(req.db, req.admin.tenantId, req.params.toolId, req.admin.email);
    res.json(tool);
  } catch (error) {
    req.logger.error("Failed to get tool", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "internal_server_error",
      errorDescription: "Failed to get tool",
    });
  }
};

export const updateTool = async (req: Request<{ serverId: string; toolId: string }>, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }
  req.logger.info("Updating tool", { serverId: req.params.serverId, toolId: req.params.toolId, body: req.body });
  try {
    const tool = await serversService.updateToolById(req.db, req.admin.tenantId, req.params.toolId, req.body);

    res.json(tool);
  } catch (error) {
    req.logger.error("Failed to update tool", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "internal_server_error",
      errorDescription: "Failed to update tool",
    });
  }
};

export const deleteTool = async (req: Request<{ serverId: string; toolId: string }>, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }
  req.logger.info("Deleting tool", { serverId: req.params.serverId, toolId: req.params.toolId });
  try {
    await serversService.deleteToolById(req.db, req.admin.tenantId, req.params.toolId);
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    req.logger.error("Failed to delete tool", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "internal_server_error",
      errorDescription: "Failed to delete tool",
    });
  }
};

export const runTool = async (
  req: Request<{ serverId: string; toolId: string }, object, ToolRunRequest>,
  res: Response,
) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  const { serverId, toolId } = req.params;
  const { parameters, authorization } = req.body;

  req.logger.info("Running tool in playground", {
    serverId,
    toolId,
    hasParameters: !!parameters,
    hasAuth: !!authorization,
  });

  try {
    const startTime = Date.now();

    const tool = await req.db.tool.findUnique({
      where: {
        id: toolId,
        tenantId: req.admin.tenantId,
        serverId: serverId,
      },
      include: {
        oAuthProvider: true,
        server: {
          select: {
            baseUrl: true,
          },
        },
      },
    });
    if (!tool) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "tool_not_found",
        errorDescription: `Tool not found: ${toolId}`,
      });
    }

    const specParameters = tool.parameters ? JSON.parse(JSON.stringify(tool.parameters)) : {};
    const callParameters = { ...parameters };

    if (tool.oAuthProvider) {
      const endUser = await req.db.endUser.findUnique({
        where: {
          email_tenantId: {
            email: req.admin.email,
            tenantId: req.admin.tenantId,
          },
        },
      });
      if (!endUser) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error: "unauthorized",
          errorDescription: `No sufficient authorization to run tool: ${toolId}`,
        });
      }
      const tokens = await getUserUseableTokens(req.db, endUser.id, tool.oAuthProvider.id);
      const validTokens = tokens.filter((t) => !t.expiresAt || t.expiresAt > new Date());
      if (validTokens.length > 0) {
        callParameters["Authorization"] = `Bearer ${validTokens[0].accessToken}`;
      }
      if (validTokens.length === 0) {
        const tokensWithRefresh = tokens.filter((t) => !!t.refreshToken);
        if (tokensWithRefresh.length > 0) {
          try {
            const tokenData = await refreshAndPersistAccessToken(
              req.db,
              req.logger,
              endUser.id,
              tool.oAuthProvider,
              tokensWithRefresh[0].refreshToken!,
              req.ip || null,
            );
            callParameters["Authorization"] = `Bearer ${tokenData.accessToken}`;
          } catch (error) {
            req.logger.warn(`Failed to refresh token for provider ${tool.oAuthProvider.name}`, error);
            return res.status(StatusCodes.UNAUTHORIZED).json({
              error: "oauth_authentication_required",
              errorDescription: `OAuth authentication required for ${tool.name}. Please authenticate via the MCP client.`,
            });
          }
        } else {
          // No valid tokens and no refresh tokens - require authentication
          return res.status(StatusCodes.UNAUTHORIZED).json({
            error: "oauth_authentication_required",
            errorDescription: `OAuth authentication required for ${tool.name}. Please authenticate via the MCP client.`,
          });
        }
      }
    }

    const result = await executeApiRequest(
      tool,
      tool.server.baseUrl,
      specParameters,
      callParameters,
      req.logger,
      true,
      {},
    );

    const runtimeMs = Date.now() - startTime;

    return res.status(StatusCodes.OK).json({
      isError: result.isError,
      runtimeMs,
      content:
        result.content
          ?.filter((res) => res.type === "text")
          .map((res) => res.text)
          .join("\n") || "<empty>",
    });
  } catch (error) {
    req.logger.error("Failed to run tool", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      isError: true,
      runtimeMs: 0,
      content: "Failed to run tool: " + (error instanceof Error ? error.message : "Unknown error"),
    });
  }
};

export const createExampleServer = async (req: Request, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  req.logger.info("Creating example todos server", { tenantId: req.admin.tenantId });

  try {
    const result = await serversService.createExampleTodosServer(req.db, req.admin.tenantId);
    return res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    req.logger.error("Failed to create example server", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "server_creation_failed",
      errorDescription: error instanceof Error ? error.message : "Failed to create example server",
    });
  }
};

export const enableTool = async (req: Request<{ serverId: string; toolId: string }>, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }
  req.logger.info("Enabling tool", { serverId: req.params.serverId, toolId: req.params.toolId });
  try {
    const tool = await serversService.updateToolById(req.db, req.admin.tenantId, req.params.toolId, { enabled: true });
    res.json(tool);
  } catch (error) {
    req.logger.error("Failed to enable tool", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "internal_server_error",
      errorDescription: "Failed to enable tool",
    });
  }
};

export const disableTool = async (req: Request<{ serverId: string; toolId: string }>, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }
  req.logger.info("Disabling tool", { serverId: req.params.serverId, toolId: req.params.toolId });
  try {
    const tool = await serversService.updateToolById(req.db, req.admin.tenantId, req.params.toolId, { enabled: false });
    res.json(tool);
  } catch (error) {
    req.logger.error("Failed to disable tool", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "internal_server_error",
      errorDescription: "Failed to disable tool",
    });
  }
};

export const exportServer = async (req: Request<{ serverId: string }>, res: Response) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  req.logger.info("Exporting server", { serverId: req.params.serverId });

  try {
    const exportData = await serversService.exportServer(req.db, req.admin.tenantId, req.params.serverId);

    // Get server name for filename
    const filename = `mcp-server-${exportData.server.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.json`;

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.json(exportData);
  } catch (error) {
    req.logger.error("Failed to export server", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "export_failed",
      errorDescription: error instanceof Error ? error.message : "Failed to export server",
    });
  }
};

export const importServer = async (
  req: Request<Record<string, string>, object, serversService.McpServerExport>,
  res: Response,
) => {
  if (!isAdminRequest(req)) {
    throw new TypeGuardError();
  }

  req.logger.info("Importing server", { serverName: req.body.server?.name });

  try {
    const server = await serversService.importServer(req.db, req.admin.tenantId, req.body);

    res.status(StatusCodes.CREATED).json({
      id: server.id,
      name: server.name,
      message: "Server imported successfully. Please configure OAuth/API credentials if needed.",
    });
  } catch (error) {
    req.logger.error("Failed to import server", error);
    res.status(StatusCodes.BAD_REQUEST).json({
      error: "import_failed",
      errorDescription: error instanceof Error ? error.message : "Failed to import server",
    });
  }
};
