import { ParameterLocation, ServerAuthType, UpdateServerAuthConfigRequest } from "@agentbridge/api";
import { PrismaClient } from "@prisma/client";
import { Request } from "express";
import { Logger } from "winston";
import { AuthStrategyFactory } from "./factories/auth-strategy.factory.js";
import {
  AuthProvider,
  CreateProviderRequest,
  ServerAuthConfig,
  ServerAuthResult,
  UpdateProviderRequest,
} from "./interfaces/auth-strategy.interface.js";

interface JwtKey {
  kty: string;
  use?: string;
  alg?: string;
  kid?: string;
  n?: string;
  e?: string;
  x?: string;
  y?: string;
  crv?: string;
  k?: string;
  d?: string;
  p?: string;
  q?: string;
  dp?: string;
  dq?: string;
  qi?: string;
  x5c?: string[];
  x5t?: string;
  "x5t#S256"?: string;
}

interface JwtResponse {
  keys: JwtKey[];
}

export interface ServerAuthConfigResponse {
  serverId: string;
  authType: ServerAuthType;
  authConfig?: {
    id: string;
    authType: ServerAuthType;
    jwtProvider?: {
      id: string;
      name: string;
      jwksUrl: string;
      enabled: boolean;
    };
  };
}

/**
 * ServerAuthService implements strategy-based server authentication
 *
 * This service uses the Strategy Pattern to handle different authentication types
 * NO HARDCODED IF/ELSE STATEMENTS - authentication method selection is configuration-driven
 */
export class ServerAuthService {
  private strategyFactory: AuthStrategyFactory;

  constructor(
    private db: PrismaClient,
    private logger?: Logger,
  ) {
    // Initialize strategy factory with all available authentication strategies
    this.strategyFactory = new AuthStrategyFactory(db, logger);
  }

  /**
   * Authenticate a server request using the configured authentication strategy
   * This method uses the Strategy Pattern to avoid hardcoded authentication logic
   */
  async authenticateServerRequest(req: Request, serverId: string): Promise<ServerAuthResult> {
    try {
      this.logger?.debug("Authenticating server request", { serverId });

      // Get server auth configuration from database
      const config = await this.getServerAuthConfig(serverId);
      if (!config) {
        return {
          success: false,
          error: `No authentication configuration found for server: ${serverId}`,
        };
      }

      // Get appropriate strategy based on stored config (NO HARDCODED IF STATEMENTS)
      const strategy = this.strategyFactory.getStrategy(config.authType);

      // Execute authentication using strategy
      const result = await strategy.authenticate(req, config);

      this.logger?.debug("Authentication result", {
        serverId,
        authType: config.authType,
        success: result.success,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger?.error("Failed to authenticate server request", {
        serverId,
        error: errorMessage,
      });
      return {
        success: false,
        error: `Authentication failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Get server authentication configuration
   */
  async getServerAuthConfig(serverId: string): Promise<ServerAuthConfig | null> {
    try {
      this.logger?.debug("Getting server auth config", { serverId });

      const server = await this.db.mcpServer.findFirst({
        where: { id: serverId },
        include: {
          authConfig: {
            include: {
              jwtProvider: true,
            },
          },
        },
      });

      if (!server) {
        throw new Error(`Server not found: ${serverId}`);
      }

      // If no explicit auth config exists, create default BASE auth config
      if (!server.authConfig) {
        return {
          id: `default-${serverId}`,
          serverId: server.id,
          authType: (server.authType as ServerAuthType) || ServerAuthType.BASE,
        };
      }

      return {
        id: server.authConfig.id,
        serverId: server.id,
        authType: (server.authType as ServerAuthType) || ServerAuthType.BASE,
        jwtProviderId: server.authConfig.jwtProviderId || undefined,
        jwtProvider: server.authConfig.jwtProvider || undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger?.error("Failed to get server auth config", {
        serverId,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Update server authentication configuration
   */
  async updateServerAuthConfig(
    serverId: string,
    config: UpdateServerAuthConfigRequest,
  ): Promise<ServerAuthConfigResponse> {
    try {
      this.logger?.debug("Updating server auth config", { serverId, config });

      // Validate that the auth type is supported
      if (!this.strategyFactory.isSupported(config.authType)) {
        throw new Error(`Unsupported authentication type: ${config.authType}`);
      }

      // Handle auth config creation/update using strategy pattern
      const strategy = this.strategyFactory.getStrategy(config.authType);
      const authConfigId = await strategy.handleConfigUpdate(serverId, {
        authType: config.authType,
        jwtProviderId: config.jwtProviderId || undefined,
      });

      // Update server auth type and config
      const server = await this.db.mcpServer.update({
        where: { id: serverId },
        data: {
          authType: config.authType,
          authConfigId,
        },
        include: {
          authConfig: {
            include: {
              jwtProvider: true,
            },
          },
        },
      });

      // Automatically add JWT headers to all tools when JWT auth type is set
      if (config.authType === ServerAuthType.JWT) {
        try {
          await this.addJwtHeadersToAllTools(serverId);
          this.logger?.info("Automatically added JWT headers to all tools after setting JWT auth type", { serverId });
        } catch (error) {
          this.logger?.warn("Failed to automatically add JWT headers to tools", { serverId, error });
          // Don't fail the auth config update if header addition fails
        }
      }

      return {
        serverId: server.id,
        authType: server.authType as ServerAuthType,
        authConfig: server.authConfig
          ? {
              id: server.authConfig.id,
              authType: server.authConfig.authType as ServerAuthType,
              jwtProvider: server.authConfig.jwtProvider
                ? {
                    id: server.authConfig.jwtProvider.id,
                    name: server.authConfig.jwtProvider.name,
                    jwksUrl: server.authConfig.jwtProvider.jwksUrl,
                    enabled: server.authConfig.jwtProvider.enabled,
                  }
                : undefined,
            }
          : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger?.error("Failed to update server auth config", {
        serverId,
        config,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Get supported authentication types
   * Returns all authentication types supported by the current strategy factory
   */
  getSupportedAuthTypes(): ServerAuthType[] {
    return this.strategyFactory.getSupportedAuthTypes();
  }

  /**
   * Get auth providers for a server (strategy-based)
   */
  async getAuthProviders(serverId: string): Promise<AuthProvider[]> {
    try {
      const config = await this.getServerAuthConfig(serverId);
      if (!config) {
        return [];
      }

      const strategy = this.strategyFactory.getStrategy(config.authType);
      return await strategy.getProviders(serverId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger?.error("Failed to get auth providers", {
        serverId,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Create auth provider for a server (strategy-based)
   */
  async createAuthProvider(serverId: string, providerData: CreateProviderRequest): Promise<AuthProvider> {
    try {
      const config = await this.getServerAuthConfig(serverId);
      if (!config) {
        throw new Error("No authentication configuration found");
      }

      const strategy = this.strategyFactory.getStrategy(config.authType);
      return await strategy.createProvider(serverId, providerData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger?.error("Failed to create auth provider", {
        serverId,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Update auth provider for a server (strategy-based)
   */
  async updateAuthProvider(
    serverId: string,
    providerId: string,
    providerData: UpdateProviderRequest,
  ): Promise<AuthProvider> {
    try {
      const config = await this.getServerAuthConfig(serverId);
      if (!config) {
        throw new Error("No authentication configuration found");
      }

      const strategy = this.strategyFactory.getStrategy(config.authType);
      return await strategy.updateProvider(serverId, providerId, providerData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger?.error("Failed to update auth provider", {
        serverId,
        providerId,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Delete auth provider for a server (strategy-based)
   */
  async deleteAuthProvider(serverId: string, providerId: string): Promise<void> {
    try {
      const config = await this.getServerAuthConfig(serverId);
      if (!config) {
        throw new Error("No authentication configuration found");
      }

      const strategy = this.strategyFactory.getStrategy(config.authType);
      await strategy.deleteProvider(serverId, providerId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger?.error("Failed to delete auth provider", {
        serverId,
        providerId,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Get JWT providers for a server
   */
  async getJwtProviders(serverId: string) {
    try {
      this.logger?.debug("Getting JWT providers", { serverId });

      return await this.db.serverJwtProvider.findMany({
        where: { serverId },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger?.error("Failed to get JWT providers", {
        serverId,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Create a new JWT provider for a server
   */
  async createJwtProvider(serverId: string, data: { name: string; jwksUrl: string; enabled?: boolean }) {
    try {
      this.logger?.debug("Creating JWT provider", { serverId, data });

      // Get server to validate it exists and get tenantId
      const server = await this.db.mcpServer.findUnique({
        where: { id: serverId },
        select: { tenantId: true },
      });

      if (!server) {
        throw new Error(`Server not found: ${serverId}`);
      }

      return await this.db.serverJwtProvider.create({
        data: {
          serverId,
          tenantId: server.tenantId,
          name: data.name,
          jwksUrl: data.jwksUrl,
          enabled: data.enabled ?? true,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger?.error("Failed to create JWT provider", {
        serverId,
        data,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Update a JWT provider
   */
  async updateJwtProvider(
    serverId: string,
    providerId: string,
    data: { name?: string; jwksUrl?: string; enabled?: boolean },
  ) {
    try {
      this.logger?.debug("Updating JWT provider", { serverId, providerId, data });

      return await this.db.serverJwtProvider.update({
        where: {
          id: providerId,
          serverId, // Ensure the provider belongs to the specified server
        },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.jwksUrl && { jwksUrl: data.jwksUrl }),
          ...(data.enabled !== undefined && { enabled: data.enabled }),
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger?.error("Failed to update JWT provider", {
        serverId,
        providerId,
        data,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Delete a JWT provider
   */
  async deleteJwtProvider(serverId: string, providerId: string): Promise<void> {
    try {
      this.logger?.debug("Deleting JWT provider", { serverId, providerId });

      await this.db.serverJwtProvider.delete({
        where: {
          id: providerId,
          serverId, // Ensure the provider belongs to the specified server
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger?.error("Failed to delete JWT provider", {
        serverId,
        providerId,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Add JWT headers to all tools for a server
   * This updates the requestParameterOverrides of all tools to include Authorization header with JWT token
   * Supports both legacy format and new HTTP format for requestParameterOverrides
   */
  async addJwtHeadersToAllTools(serverId: string): Promise<{ updatedToolsCount: number }> {
    try {
      this.logger?.debug("Adding JWT headers to all tools for server", { serverId });

      // Verify server exists and uses JWKS authentication
      const server = await this.db.mcpServer.findUnique({
        where: { id: serverId },
        include: {
          authConfig: {
            include: {
              jwtProvider: true,
            },
          },
        },
      });

      if (!server) {
        throw new Error(`Server not found: ${serverId}`);
      }

      if (server.authType !== ServerAuthType.JWT) {
        throw new Error(`Server ${serverId} does not use JWT authentication. Current auth type: ${server.authType}`);
      }

      // Get all tools for the server
      const tools = await this.db.tool.findMany({
        where: { serverId },
        select: { id: true, requestParameterOverrides: true },
      });

      if (tools.length === 0) {
        this.logger?.info("No tools found for server", { serverId });
        return { updatedToolsCount: 0 };
      }

      // Update each tool's requestParameterOverrides to include JWT header
      const updatePromises = tools.map(async (tool) => {
        // Parse existing overrides or start with empty object
        const existingOverrides = tool.requestParameterOverrides
          ? (JSON.parse(JSON.stringify(tool.requestParameterOverrides)) as Record<string, unknown>)
          : {};

        // Check if this is the new HTTP format (has headers, query, body, or path properties)
        const isNewFormat =
          existingOverrides &&
          ("headers" in existingOverrides ||
            "query" in existingOverrides ||
            "body" in existingOverrides ||
            "path" in existingOverrides);

        let updatedOverrides: Record<string, unknown>;

        if (isNewFormat) {
          // New format - merge into headers object
          updatedOverrides = {
            ...existingOverrides,
            headers: {
              ...((existingOverrides.headers as Record<string, string>) || {}),
              Authorization: "Bearer {{auth.jwt}}",
            },
          };
        } else if (Object.keys(existingOverrides).length > 0) {
          // Legacy format exists - convert to new format
          // Legacy format has parameter names as keys with RequestParamConfig objects as values
          // We need to reorganize them into the new structure
          const headers: Record<string, string> = {};
          const query: Record<string, string> = {};
          const body: Record<string, string> = {};
          const path: Record<string, string> = {};

          // Process existing legacy overrides
          for (const [key, value] of Object.entries(existingOverrides)) {
            if (value && typeof value === "object" && "value" in value && "location" in value) {
              const paramConfig = value as { value: string; location: string };
              const paramValue = paramConfig.value as string;
              switch (paramConfig.location) {
                case "header":
                case ParameterLocation.HEADER:
                  headers[key] = paramValue;
                  break;
                case "query":
                case ParameterLocation.QUERY:
                  query[key] = paramValue;
                  break;
                case "body":
                case ParameterLocation.BODY:
                  body[key] = paramValue;
                  break;
                case "path":
                case ParameterLocation.PATH:
                  path[key] = paramValue;
                  break;
              }
            }
          }

          // Build new format with only non-empty sections
          updatedOverrides = {};
          // Always include headers for JWT
          updatedOverrides.headers = {
            ...headers,
            Authorization: "Bearer {{auth.jwt}}",
          };
          if (Object.keys(query).length > 0) {
            updatedOverrides.query = query;
          }
          if (Object.keys(body).length > 0) {
            updatedOverrides.body = body;
            updatedOverrides.bodyFormat = "json";
          }
          if (Object.keys(path).length > 0) {
            updatedOverrides.path = path;
          }
        } else {
          // No existing overrides - create new format with just the JWT header
          updatedOverrides = {
            headers: {
              Authorization: "Bearer {{auth.jwt}}",
            },
          };
        }

        return this.db.tool.update({
          where: { id: tool.id },
          data: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            requestParameterOverrides: updatedOverrides as any,
          },
        });
      });

      // Execute all updates
      await Promise.all(updatePromises);

      this.logger?.info("Successfully added JWT headers to all tools", {
        serverId,
        updatedToolsCount: tools.length,
      });

      return { updatedToolsCount: tools.length };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger?.error("Failed to add JWT headers to all tools", {
        serverId,
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Validate a JWKS URL by fetching and parsing it
   */
  async validateJwksUrl(jwksUrl: string): Promise<{ valid: boolean; error?: string; keyCount?: number }> {
    try {
      this.logger?.debug("Validating JWKS URL", { jwksUrl });

      // Validate URL format
      try {
        new URL(jwksUrl);
      } catch {
        return {
          valid: false,
          error: "Invalid URL format",
        };
      }

      // Fetch JWKS from the URL
      this.logger?.debug("Fetching JWKS from URL", { jwksUrl });
      const response = await fetch(jwksUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      this.logger?.debug("JWKS fetch response", {
        jwksUrl,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        this.logger?.warn("JWKS URL fetch failed", {
          jwksUrl,
          status: response.status,
          statusText: response.statusText,
        });
        return {
          valid: false,
          error: `Failed to fetch JWKS: ${response.status} ${response.statusText}`,
        };
      }

      // Parse the response as JSON
      let jwks: JwtResponse;
      try {
        jwks = (await response.json()) as JwtResponse;
      } catch {
        return {
          valid: false,
          error: "Response is not valid JSON",
        };
      }

      // Validate JWKS structure
      if (!jwks || typeof jwks !== "object") {
        return {
          valid: false,
          error: "JWKS response is not a valid object",
        };
      }

      if (!Array.isArray(jwks.keys)) {
        return {
          valid: false,
          error: "JWKS does not contain a 'keys' array",
        };
      }

      if (jwks.keys.length === 0) {
        return {
          valid: false,
          error: "JWKS contains no keys",
        };
      }

      // Validate each key has required properties
      for (let i = 0; i < jwks.keys.length; i++) {
        const key = jwks.keys[i];
        if (!key.kty) {
          return {
            valid: false,
            error: `Key at index ${i} is missing required 'kty' property`,
          };
        }
      }

      return {
        valid: true,
        keyCount: jwks.keys.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger?.error("Failed to validate JWKS URL", {
        jwksUrl,
        error: errorMessage,
      });

      // Handle specific error types
      if (error instanceof TypeError && error.message.includes("fetch")) {
        return {
          valid: false,
          error: "Network error: Unable to fetch JWKS URL",
        };
      }

      if (error instanceof Error && error.name === "TimeoutError") {
        return {
          valid: false,
          error: "Timeout: JWKS URL did not respond within 10 seconds",
        };
      }

      return {
        valid: false,
        error: `Validation failed: ${errorMessage}`,
      };
    }
  }
}
