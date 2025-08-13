import { ServerAuthType } from "@agentbridge/api";
import { PrismaClient } from "@prisma/client";
import { Request } from "express";
import { Logger } from "winston";
import {
  CreateJwtProviderRequest,
  IServerAuthStrategy,
  JwtProvider,
  ServerAuthConfig,
  ServerAuthResult,
  UpdateJwtProviderRequest,
  ValidationResult,
} from "../interfaces/auth-strategy.interface.js";
import { JwtAuthService } from "../jwt-auth.service.js";

/**
 * JwtAuthStrategy implements JWT signature verification using JWT endpoints
 * This validates JWT tokens using the configured JWT provider
 */
export class JwtAuthStrategy implements IServerAuthStrategy {
  constructor(
    private jwtService: JwtAuthService,
    private db: PrismaClient,
    private logger?: Logger,
  ) {}

  async authenticate(req: Request, config: ServerAuthConfig): Promise<ServerAuthResult> {
    try {
      // Validate configuration
      if (!config.jwtProvider) {
        return {
          success: false,
          error: "JWT provider not configured for this server",
        };
      }

      if (!config.jwtProvider.enabled) {
        return {
          success: false,
          error: "JWT provider is disabled",
        };
      }

      // Extract JWT token from request
      const token = this.extractJwtToken(req);
      if (!token) {
        return {
          success: false,
          error: "No JWT token found in request. Expected Authorization header with Bearer token.",
        };
      }

      // Validate JWT signature using JWKS
      const validationResult = await this.jwtService.validateJwtSignature(token, config.jwtProvider.jwksUrl);

      if (!validationResult.valid) {
        return {
          success: false,
          error: validationResult.error || "JWT signature validation failed",
        };
      }

      // Extract user information from validated JWT token
      let userId: string | undefined;
      let tenantId: string | undefined;

      if (validationResult.payload && typeof validationResult.payload === "object") {
        const payload = validationResult.payload as Record<string, unknown>;
        userId = (payload.id as string) || (payload.sub as string);
        tenantId = payload.tenantId as string;

        this.logger?.debug("JWT authentication extracted user context", {
          userId,
          tenantId,
          providerId: config.jwtProvider.id,
        });
      }

      // Success: return auth result with JWT context
      return {
        success: true,
        userContext: {
          userId,
          tenantId,
          authType: ServerAuthType.JWT,
          originalToken: token,
        },
        metadata: {
          providerId: config.jwtProvider.id,
          validatedAt: new Date(),
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger?.error("JWT authentication failed", { error: errorMessage });
      return {
        success: false,
        error: `JWT authentication failed: ${errorMessage}`,
      };
    }
  }

  async validateConfiguration(config: ServerAuthConfig): Promise<ValidationResult> {
    const errors: string[] = [];

    // Check if JWT provider is configured
    if (!config.jwtProvider) {
      errors.push("JWT provider is required for JWT authentication");
    } else {
      // Validate JWT provider configuration
      if (!config.jwtProvider.jwksUrl) {
        errors.push("JWKS URL is required");
      } else {
        // Validate URL format
        try {
          new URL(config.jwtProvider.jwksUrl);
        } catch {
          errors.push("Invalid JWKS URL format");
        }
      }

      if (!config.jwtProvider.enabled) {
        errors.push("JWT provider is disabled");
      }

      // Test JWKS endpoint accessibility (optional validation)
      if (config.jwtProvider.jwksUrl && config.jwtProvider.enabled) {
        try {
          await this.jwtService.fetchJwksKeys(config.jwtProvider.jwksUrl);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push(`JWKS endpoint test failed: ${errorMessage}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Get JWT providers for a server
   */
  async getProviders(serverId: string): Promise<JwtProvider[]> {
    try {
      const providers = await this.db.serverJwtProvider.findMany({
        where: { serverId },
        orderBy: { createdAt: "desc" },
      });
      return providers as JwtProvider[];
    } catch (error) {
      this.logger?.error("Failed to get JWT providers", { serverId, error });
      throw error;
    }
  }

  /**
   * Create JWT provider for a server
   */
  async createProvider(serverId: string, providerData: CreateJwtProviderRequest): Promise<JwtProvider> {
    const { name, jwksUrl, enabled = true } = providerData;

    try {
      // Get server to extract tenantId
      const server = await this.db.mcpServer.findUnique({
        where: { id: serverId },
        select: { tenantId: true },
      });

      if (!server) {
        throw new Error(`Server ${serverId} not found`);
      }

      const provider = await this.db.serverJwtProvider.create({
        data: {
          serverId,
          tenantId: server.tenantId,
          name,
          jwksUrl,
          enabled,
        },
      });

      return provider as JwtProvider;
    } catch (error) {
      this.logger?.error("Failed to create JWT provider", { serverId, error });
      throw error;
    }
  }

  /**
   * Update JWT provider for a server
   */
  async updateProvider(
    serverId: string,
    providerId: string,
    providerData: UpdateJwtProviderRequest,
  ): Promise<JwtProvider> {
    const { name, jwksUrl, enabled } = providerData;

    try {
      const provider = await this.db.serverJwtProvider.update({
        where: {
          id: providerId,
          serverId, // Ensure provider belongs to the server
        },
        data: {
          ...(name !== undefined && { name }),
          ...(jwksUrl !== undefined && { jwksUrl }),
          ...(enabled !== undefined && { enabled }),
        },
      });

      return provider as JwtProvider;
    } catch (error) {
      this.logger?.error("Failed to update JWT provider", { serverId, providerId, error });
      throw error;
    }
  }

  /**
   * Delete JWT provider for a server
   */
  async deleteProvider(serverId: string, providerId: string): Promise<void> {
    try {
      await this.db.serverJwtProvider.delete({
        where: {
          id: providerId,
          serverId, // Ensure provider belongs to the server
        },
      });
    } catch (error) {
      this.logger?.error("Failed to delete JWT provider", { serverId, providerId, error });
      throw error;
    }
  }

  /**
   * Handle JWT configuration update
   */
  async handleConfigUpdate(
    serverId: string,
    config: { authType: ServerAuthType; jwtProviderId?: string },
  ): Promise<string | null> {
    if (!config.jwtProviderId) {
      return null;
    }

    try {
      const existingAuthConfig = await this.db.serverAuthConfig.findUnique({
        where: { serverId },
      });

      if (existingAuthConfig) {
        // Update existing auth config
        await this.db.serverAuthConfig.update({
          where: { id: existingAuthConfig.id },
          data: {
            authType: config.authType,
            jwtProviderId: config.jwtProviderId,
          },
        });
        return existingAuthConfig.id;
      } else {
        // Create new auth config
        const newAuthConfig = await this.db.serverAuthConfig.create({
          data: {
            serverId,
            authType: config.authType,
            jwtProviderId: config.jwtProviderId,
          },
        });
        return newAuthConfig.id;
      }
    } catch (error) {
      this.logger?.error("Failed to handle JWT config update", { serverId, error });
      throw error;
    }
  }

  /**
   * Extract JWT token from various request locations
   * Supports: Authorization header (Bearer), query parameter, custom headers
   */
  private extractJwtToken(req: Request): string | null {
    // 1. Check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7); // Remove "Bearer " prefix
    }

    // 2. Check for token in query parameters
    const queryToken = req.query.token;
    if (typeof queryToken === "string") {
      return queryToken;
    }

    // 3. Check custom header (x-auth-token)
    const customHeader = req.headers["x-auth-token"];
    if (typeof customHeader === "string") {
      return customHeader;
    }

    // 4. Check body for token (for POST requests)
    const bodyToken = req.body?.token;
    if (typeof bodyToken === "string") {
      return bodyToken;
    }

    return null;
  }
}
