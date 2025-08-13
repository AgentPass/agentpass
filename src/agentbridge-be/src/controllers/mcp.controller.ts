import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { getMcpServerUnified } from "../services/mcp.service.js";
import {
  APP_BAD_REQUEST,
  ErrorResponse,
  JSONRPC_INTERNAL_ERROR,
  JSONRPC_METHOD_NOT_ALLOWED,
  JsonRpcErrorResponse,
} from "../types/error.types.js";
import { AppRequest, isAppRequest, isWithServerIdRequest, TypeGuardError } from "../utils/req-guards.js";

function sendMcpError(res: Response, status: number, errorCode: number, message: string, isJsonRpc = true): void {
  const error = isJsonRpc
    ? ({ jsonrpc: "2.0", error: { code: errorCode, message } } as JsonRpcErrorResponse)
    : ({ error: { code: errorCode, message } } as ErrorResponse);

  res.status(status).json(error);
}

/**
 * Validate request params and authentication results from middleware
 * This function is simplified since authentication is now handled by middleware
 */
async function validateRequest(req: AppRequest, res: Response): Promise<boolean> {
  if (!isAppRequest(req)) {
    throw new TypeGuardError();
  }

  if (!isWithServerIdRequest(req)) {
    const message = "Missing server ID";
    req.logger.warn(`${message}. serverId=${req["serverId"]}`);
    sendMcpError(res, StatusCodes.BAD_REQUEST, APP_BAD_REQUEST, `Bad Request: ${message}`);
    return false;
  }

  // Check if authentication was successful (handled by middleware)
  if (!req.serverAuth?.success) {
    sendMcpError(
      res,
      StatusCodes.UNAUTHORIZED,
      APP_BAD_REQUEST,
      req.serverAuth?.error || "Server authentication failed",
    );
    return false;
  }

  req.logger.debug("Request validation successful", {
    serverId: req.serverId,
    authType: req.serverAuth.userContext?.authType,
    userId: req.serverAuth.userContext?.userId,
  });

  return true;
}

export async function handleStreamablePost(req: AppRequest, res: Response): Promise<void> {
  if (!isWithServerIdRequest(req)) {
    throw new TypeGuardError();
  }

  try {
    // Validate request and authentication (simplified since middleware handles auth)
    if (!(await validateRequest(req, res))) {
      return;
    }

    const mcpServer = await getMcpServerUnified(req);
    const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on("close", () => {
      transport.close();
      mcpServer.close();
    });
    await mcpServer.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    req.logger.error("Error handling MCP streamable HTTP POST request", error);
    if (!res.headersSent) {
      sendMcpError(res, StatusCodes.INTERNAL_SERVER_ERROR, JSONRPC_INTERNAL_ERROR, "Internal server error");
    }
  }
}

const sseTransports: { [sessionId: string]: SSEServerTransport } = {};

export async function handleSSE(req: AppRequest, res: Response): Promise<void> {
  if (!isWithServerIdRequest(req)) {
    throw new TypeGuardError();
  }

  // Validate request and authentication (simplified since middleware handles auth)
  if (!(await validateRequest(req, res))) {
    return;
  }

  const transport = new SSEServerTransport("/api/mcp/messages", res);
  sseTransports[transport.sessionId] = transport;

  res.on("close", () => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete sseTransports[transport.sessionId];
  });

  const server = await getMcpServerUnified(req);
  await server.connect(transport);
}

export async function handleSSEMessage(req: AppRequest, res: Response): Promise<void> {
  if (!isWithServerIdRequest(req)) {
    throw new TypeGuardError();
  }
  const sessionId = req.query.sessionId as string;

  // Validate request and authentication (simplified since middleware handles auth)
  if (!(await validateRequest(req, res))) {
    return;
  }

  const transport = sessionId ? sseTransports[sessionId] : null;
  if (!transport) {
    if (sessionId) {
      req.logger.error("Session specified but not found", { sessionId });
    }
    return sendMcpError(res, StatusCodes.NOT_FOUND, APP_BAD_REQUEST, "Session not found");
  }

  await transport.handlePostMessage(req, res, req.body);
}

export async function handleNotAllowed(req: Request, res: Response): Promise<void> {
  if (!isAppRequest(req)) {
    throw new TypeGuardError();
  }

  return sendMcpError(res, StatusCodes.METHOD_NOT_ALLOWED, JSONRPC_METHOD_NOT_ALLOWED, "Method not allowed");
}
