import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApiKeyProvider, OAuthProvider, Tool } from "@prisma/client";
import isEmpty from "lodash/isEmpty.js";
import { OpenAPIV3 } from "openapi-types";
import { Logger } from "winston";
import { injectContextParameters } from "../constants/tool-parameters.js";
import { Database } from "../utils/connection.js";
import { EndUserRequest, WithServerIdRequest } from "../utils/req-guards.js";
import { analytics } from "./analytics.service.js";
import { executeApiRequest } from "./api-exec/api-tool-executor.js";
import { createZodSchemaFromParameters } from "./api-exec/parameter-schema.js";
import {
  getAuthorizeUrl,
  getUserUseableTokens,
  markTokenAsUsed,
  refreshAndPersistAccessToken,
  TOOL_SCOPE,
} from "./oauth.service.js";

// do not change the phrasing of this message, it is used by mcp-remote to detect browser open needed
const authenticateMessage = (url: string) => `Please authenticate before proceeding.

The following URL should be automatically opened in your browser, but if it doesn't, please open it manually:

${url}

Once authentication is complete, re-run your original query.`;

// Constants
const CONSTANTS = {
  SYNTHETIC_EMAIL_DOMAIN: "@jwt.agentpass.ai",
  MCP_SERVER_VERSION: "1.0.0",
} as const;

// Error response builders
const ERROR_MESSAGES = {
  AUTH_PROVIDER_MISCONFIGURED:
    "Oops! We couldn't complete the request due to an authorization issue. Please get in touch with your MCP server administrator.",
  TOOL_EXECUTION_ERROR: (error: unknown) =>
    `Error executing tool: ${error instanceof Error ? error.message : String(error)}`,
} as const;

const createErrorResponse = (message: string, isError = true) => ({
  content: [{ type: "text" as const, text: message }],
  isError,
});

const createAuthResponse = (authUrl: string) => ({
  content: [{ type: "text" as const, text: authenticateMessage(authUrl) }],
});

/**
 * Parse JWT token and extract claims without verification
 * This is safe since we're only using it for template variables, not security
 */
function parseJwtClaims(jwt: string): Record<string, unknown> {
  try {
    // JWT format: header.payload.signature
    const parts = jwt.split(".");
    if (parts.length !== 3) {
      return {};
    }

    // Decode the header (first part)
    const header = parts[0];
    const paddedHeader = header + "=".repeat((4 - (header.length % 4)) % 4);
    const decodedHeader = Buffer.from(paddedHeader, "base64url").toString("utf8");
    const headerClaims = JSON.parse(decodedHeader);

    // Decode the payload (second part)
    const payload = parts[1];
    const paddedPayload = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const decodedPayload = Buffer.from(paddedPayload, "base64url").toString("utf8");
    const payloadClaims = JSON.parse(decodedPayload);

    // Combine header and payload claims (payload takes precedence for duplicates)
    return { ...headerClaims, ...payloadClaims };
  } catch {
    // If parsing fails, return empty object
    return {};
  }
}

/**
 * Unified MCP server creation that works with any authentication strategy
 * Uses strategy pattern to determine what authentication features are available
 */
export async function getMcpServerUnified(req: WithServerIdRequest): Promise<McpServer> {
  // Check authentication based on what's available in the request
  const hasUserAuth = Boolean("user" in req && req.user);
  const hasServerAuth = Boolean("serverAuth" in req && req.serverAuth?.success);

  if (!hasUserAuth && !hasServerAuth) {
    throw new Error("No valid authentication found");
  }

  const serverId = req.serverId;

  const server = new McpServer(
    {
      name: serverId,
      version: CONSTANTS.MCP_SERVER_VERSION,
    },
    { capabilities: { logging: {} } },
  );

  try {
    const tools = await req.db.tool.findMany({
      where: {
        serverId: serverId,
        enabled: true,
      },
      include: {
        oAuthProvider: true,
        apiKeyProvider: true,
        server: {
          select: {
            baseUrl: true,
          },
        },
      },
    });
    req.logger.debug(`Found ${tools.length} tools for server ${serverId}`);

    for (const tool of tools) {
      await registerToolUnified(req, server, tool, hasUserAuth, hasServerAuth);
    }
  } catch (error) {
    req.logger.error(`Error loading tools for server ${serverId}:`, error);
    throw error;
  }

  return server;
}

async function registerToolUnified(
  req: WithServerIdRequest,
  server: McpServer,
  tool: Tool & {
    oAuthProvider: OAuthProvider | null;
    apiKeyProvider: ApiKeyProvider | null;
    server: { baseUrl: string };
  },
  hasUserAuth: boolean,
  hasServerAuth: boolean,
): Promise<void> {
  try {
    const specParameters: Record<string, OpenAPIV3.ParameterObject> = tool.parameters
      ? JSON.parse(JSON.stringify(tool.parameters))
      : {};
    req.logger.debug(`Tool ${tool.method} ${tool.url} parameters: ${JSON.stringify(specParameters)}`);
    const paramSchema = createZodSchemaFromParameters(req.logger, specParameters);

    // TypeScript has issues with MCP SDK's deep type instantiation
    // Using any to bypass this limitation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (server as any).registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: paramSchema,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (callParameters: any) =>
        executeToolWithAuth(req, tool, specParameters, callParameters, hasUserAuth, hasServerAuth),
    );
  } catch (error) {
    req.logger.error(`Failed to register tool ${tool.name}:`, error);
    throw error;
  }
}

/**
 * Executes a tool with proper authentication and logging
 */
async function executeToolWithAuth(
  req: WithServerIdRequest,
  tool: Tool & {
    oAuthProvider: OAuthProvider | null;
    apiKeyProvider: ApiKeyProvider | null;
    server: { baseUrl: string };
  },
  specParameters: Record<string, OpenAPIV3.ParameterObject>,
  callParameters: Record<string, unknown>,
  hasUserAuth: boolean,
  hasServerAuth: boolean,
) {
  req.logger.debug(
    `Tool ${tool.name} (${tool.method} @ ${tool.url}) called with params: ${JSON.stringify(callParameters)}`,
  );

  try {
    // Inject context parameters (JWT, user info, etc.) based on request context
    injectContextParameters(req, callParameters, hasUserAuth);

    // Extract auth context for templates
    const jwtToken = (!hasUserAuth && "serverAuth" in req && req.serverAuth?.userContext?.originalToken) || undefined;
    const jwtClaims = parseJwtClaims(jwtToken || "");
    const authContext = {
      jwt: {
        // Raw JWT string accessible as {{auth.jwt}}
        toString: () => jwtToken || "",
        valueOf: () => jwtToken || "",
        // JWT claims accessible as {{auth.jwt.propertyName}}
        ...jwtClaims,
      },
    };

    // TODO: remove this backward compatibility in few releases
    // Add backward compatibility: also inject JWT as toolParams.jwt for existing templates
    if (jwtToken) {
      callParameters.jwt = jwtToken;
    }

    // Handle tool authentication (OAuth/API key) - independent of MCP server auth type
    const toolAuthResult = await handleToolAuthentication(req, tool, hasUserAuth, hasServerAuth);

    if (toolAuthResult.authProviderMisconfigured) {
      return createErrorResponse(ERROR_MESSAGES.AUTH_PROVIDER_MISCONFIGURED);
    }

    if (toolAuthResult.authMissing) {
      return createAuthResponse(toolAuthResult.authMissing.authUrl);
    }

    if (toolAuthResult.accessToken) {
      callParameters["Authorization"] = `Bearer ${toolAuthResult.accessToken.tokenValue}`;
      const tokenId = toolAuthResult.accessToken.tokenId;
      setImmediate(() => markTokenAsUsed(req.db, tokenId));
    }

    const startTime = Date.now();
    const result = await executeApiRequest(
      tool,
      tool.server.baseUrl,
      specParameters,
      callParameters,
      req.logger,
      false,
      authContext,
    );

    // Log execution based on auth type
    await logToolExecution(req, tool, result, startTime, hasUserAuth, hasServerAuth);

    return result;
  } catch (error) {
    req.logger.warn(`Error executing tool ${tool.name}:`, error);
    return createErrorResponse(ERROR_MESSAGES.TOOL_EXECUTION_ERROR(error));
  }
}

async function logUserToolExecution(
  req: EndUserRequest & WithServerIdRequest,
  tool: {
    id: string;
    serverId: string;
    name: string;
    method: string;
    oAuthProviderId?: string | null;
    apiKeyProviderId?: string | null;
  },
  result: { isError?: boolean },
  startTime: number,
): Promise<void> {
  // Track tool execution in PostHog
  analytics.track(req.user.id, "tool.execute.api_call", {
    tool_id: tool.id,
    server_id: tool.serverId,
    tenant_id: req.user.tenantId,
    end_user_id: req.user.id,
    tool_name: tool.name,
    http_method: tool.method,
    has_auth: !!tool.oAuthProviderId || !!tool.apiKeyProviderId,
    auth_type: tool.oAuthProviderId ? "oauth" : tool.apiKeyProviderId ? "api_key" : "none",
    execution_time_ms: Date.now() - startTime,
    success: !result.isError,
    is_playground: false,
  });

  req.logger.info(`Tool ${tool.name} executed for user ${req.user.email}`, {
    tool_id: tool.id,
    server_id: tool.serverId,
    tool_name: tool.name,
    success: !result.isError,
    duration: Date.now() - startTime,
    user_id: req.user.id,
  });
}

/**
 * Unified logging function that handles both user and server auth contexts
 */
async function logToolExecution(
  req: WithServerIdRequest,
  tool: {
    id: string;
    serverId: string;
    name: string;
    method: string;
    oAuthProviderId?: string | null;
    apiKeyProviderId?: string | null;
    oAuthProvider?: OAuthProvider | null;
  },
  result: { isError?: boolean },
  startTime: number,
  hasUserAuth: boolean,
  hasServerAuth: boolean,
): Promise<void> {
  if (hasUserAuth) {
    const userReq = req as EndUserRequest & WithServerIdRequest;
    await logUserToolExecution(userReq, tool, result, startTime);
    return;
  }

  if (hasServerAuth) {
    // Check if we have user context from JWT for enhanced logging
    const serverAuthReq = req as WithServerIdRequest & { serverAuth: { userContext?: { userId?: string } } };
    if (serverAuthReq.serverAuth?.userContext?.userId && tool.oAuthProvider) {
      // Log as user execution for OAuth tools with JWT user context
      const syntheticUserReq = req as EndUserRequest & WithServerIdRequest;
      if (syntheticUserReq.user) {
        await logUserToolExecution(syntheticUserReq, tool, result, startTime);
        return;
      }
    }
  }

  // Simple logging without user-specific analytics for server auth
  req.logger.info(`Tool ${tool.name} executed successfully`, {
    tool_id: tool.id,
    server_id: tool.serverId,
    tool_name: tool.name,
    success: !result.isError,
    duration: Date.now() - startTime,
  });
}

/**
 * Ensure a synthetic EndUser record exists for JWT subject to satisfy foreign key constraints
 * This creates a virtual user record that allows OAuth tokens to be stored for external JWT subjects
 */
async function ensureSyntheticEndUser(db: Database, userId: string, tenantId: string, logger?: Logger): Promise<void> {
  try {
    // Check if user already exists
    const existingUser = await db.endUser.findUnique({
      where: { id: userId },
    });

    if (existingUser) {
      logger?.debug(`Synthetic EndUser already exists for JWT sub: ${userId}`);
      return;
    }

    // Tenant already exists since it's from the MCP server record

    // Create synthetic EndUser record for JWT subject
    await db.endUser.create({
      data: {
        id: userId, // Use JWT sub as the user ID
        tenantId: tenantId,
        email: `${userId}${CONSTANTS.SYNTHETIC_EMAIL_DOMAIN}`, // Synthetic email to satisfy constraint
        emailVerified: false,
        name: `JWT Subject ${userId.substring(0, 8)}...`, // Truncated for readability
        enabled: true,
      },
    });

    logger?.info(`Created synthetic EndUser for JWT subject: ${userId}`, { tenantId });
  } catch (error) {
    // If creation fails due to race condition, that's okay - another request created it
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      logger?.debug(`Synthetic EndUser creation race condition for JWT sub: ${userId}`);
      return;
    }

    logger?.error(`Failed to create synthetic EndUser for JWT subject: ${userId}`, error);
    throw error;
  }
}

/**
 * Unified tool authentication that works regardless of MCP server auth type
 * Handles both OAuth and API key tools independently of BASE/JWT MCP auth
 */
async function handleToolAuthentication(
  req: WithServerIdRequest,
  tool: Tool & {
    oAuthProvider: OAuthProvider | null;
    apiKeyProvider: ApiKeyProvider | null;
  },
  hasUserAuth: boolean,
  hasServerAuth: boolean,
): Promise<{
  accessToken?: {
    tokenId: string;
    tokenValue: string;
  };
  authProviderMisconfigured?: boolean;
  authMissing?: { authUrl: string };
}> {
  // API key tools - work the same way regardless of MCP auth type
  if (tool.apiKeyProvider) {
    return {
      accessToken: {
        tokenId: tool.apiKeyProvider.id,
        tokenValue: tool.apiKeyProvider.value,
      },
    };
  }

  // OAuth tools - need user context for token storage
  if (tool.oAuthProvider) {
    // Check if OAuth provider is properly configured
    if (isEmpty(tool.oAuthProvider.clientId) || isEmpty(tool.oAuthProvider.clientSecret)) {
      return { authProviderMisconfigured: true };
    }

    // Get user ID regardless of MCP auth type
    const userId = await getUserIdForOAuth(req, hasUserAuth, hasServerAuth, tool.name);
    if (typeof userId === "object") {
      return userId; // Return error if user ID couldn't be determined
    }

    // Perform OAuth token lookup and management - same logic for both auth types
    return await handleOAuthAuthentication(req, tool.oAuthProvider, userId);
  }

  // No authentication needed for this tool
  return {};
}

/**
 * Gets user ID for OAuth token lookup - works for both MCP auth types
 */
async function getUserIdForOAuth(
  req: WithServerIdRequest,
  hasUserAuth: boolean,
  hasServerAuth: boolean,
  toolName: string,
): Promise<string | { authProviderMisconfigured: true }> {
  if (hasUserAuth) {
    // BASE auth - use actual user ID
    const userReq = req as EndUserRequest & WithServerIdRequest;
    return userReq.user.id;
  }

  if (hasServerAuth) {
    // JWT auth - extract user ID from JWT token
    const serverAuthReq = req as WithServerIdRequest & {
      serverAuth?: { userContext?: { userId?: string; tenantId?: string } };
    };
    const jwtUserId = serverAuthReq.serverAuth?.userContext?.userId;

    if (!jwtUserId) {
      req.logger.warn(`OAuth tool ${toolName} requires user context in JWT token`);
      return { authProviderMisconfigured: true };
    }

    // Get tenantId from the MCP server record
    const server = await req.db.mcpServer.findUnique({
      where: { id: req.serverId },
      select: { tenantId: true },
    });

    if (!server) {
      req.logger.error(`MCP server not found: ${req.serverId}`);
      return { authProviderMisconfigured: true };
    }

    // Ensure synthetic EndUser exists for JWT sub
    await ensureSyntheticEndUser(req.db, jwtUserId, server.tenantId, req.logger);

    return jwtUserId;
  }

  req.logger.error(`No authentication context available for OAuth tool ${toolName}`);
  return { authProviderMisconfigured: true };
}

/**
 * Unified OAuth authentication that works the same for both MCP auth types
 */
async function handleOAuthAuthentication(
  req: WithServerIdRequest,
  oAuthProvider: OAuthProvider,
  userId: string,
): Promise<{
  accessToken?: {
    tokenId: string;
    tokenValue: string;
  };
  authProviderMisconfigured?: boolean;
  authMissing?: { authUrl: string };
}> {
  const originAddress = req.ip || null;
  const tokens = await getUserUseableTokens(req.db, userId, oAuthProvider.id);

  if (tokens.length > 0) {
    const validTokens = tokens.filter((t) => !t.expiresAt || t.expiresAt > new Date());
    if (validTokens.length > 0) {
      req.logger.debug(`Found valid token for provider ${oAuthProvider.name} (has ${tokens.length} tokens)`);
      return {
        accessToken: {
          tokenId: validTokens[0].id,
          tokenValue: validTokens[0].accessToken,
        },
      };
    }

    const tokensWithRefresh = tokens.filter((t) => !!t.refreshToken);
    if (tokensWithRefresh.length > 0) {
      try {
        const tokenData = await refreshAndPersistAccessToken(
          req.db,
          req.logger,
          userId,
          oAuthProvider,
          tokensWithRefresh[0].refreshToken!,
          originAddress,
        );
        return {
          accessToken: {
            tokenId: tokenData.id,
            tokenValue: tokenData.accessToken,
          },
        };
      } catch (error) {
        req.logger.warn(`Failed to refresh token for provider ${oAuthProvider.name}`, error);
        return {
          authMissing: {
            authUrl: getAuthorizeUrl(req, oAuthProvider, "", req.serverId, userId, TOOL_SCOPE, originAddress),
          },
        };
      }
    }

    // All tokens are expired/invalid and no refresh tokens available - prompt for re-authentication
    const authUrl = getAuthorizeUrl(req, oAuthProvider, "", req.serverId, userId, TOOL_SCOPE, originAddress);
    req.logger.warn(
      `Found ${tokens.length} expired/invalid tokens for provider ${oAuthProvider.name}, prompting user to re-authenticate at '${authUrl}'`,
    );
    return { authMissing: { authUrl } };
  }

  const authUrl = getAuthorizeUrl(req, oAuthProvider, "", req.serverId, userId, TOOL_SCOPE, originAddress);
  req.logger.warn(
    `No valid token found for provider ${oAuthProvider.name}, prompting user to authenticate at '${authUrl}'`,
  );
  return { authMissing: { authUrl } };
}
