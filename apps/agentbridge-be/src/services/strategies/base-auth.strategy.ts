import { ServerAuthType } from "@agentbridge/api";
import { Request } from "express";
import { isAppRequest } from "../../utils/req-guards.js";
import {
  AuthProvider,
  CreateProviderRequest,
  IServerAuthStrategy,
  ServerAuthConfig,
  ServerAuthResult,
  UpdateProviderRequest,
  ValidationResult,
} from "../interfaces/auth-strategy.interface.js";
import { validateServerAccess } from "../mcp-access.service.js";

/**
 * BaseAuthStrategy implements the existing AgentBridge authentication logic
 * This wraps the current user/tenant validation that was already in place
 */
export class BaseAuthStrategy implements IServerAuthStrategy {
  async authenticate(req: Request, config: ServerAuthConfig): Promise<ServerAuthResult> {
    try {
      // Ensure we have proper request context
      if (!isAppRequest(req)) {
        return {
          success: false,
          error: "Invalid request context for authentication",
        };
      }

      // Extract and verify user token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return {
          success: false,
          error: "No authorization header provided for BASE authentication",
        };
      }

      const token = authHeader.split(" ")[1];

      // Import JWT service for token verification
      const { verifyEndUserToken } = await import("../jwt.service.js");

      // Verify the user token
      const decoded = await verifyEndUserToken(token);
      if (!decoded) {
        return {
          success: false,
          error: "Invalid or expired user token",
        };
      }

      const userEmail = decoded.email;
      if (!userEmail) {
        return {
          success: false,
          error: "No user email found in token",
        };
      }

      // Use existing AgentBridge validation logic
      const accessResult = await validateServerAccess(req.db, req.logger, config.serverId, userEmail);

      // Handle validation results
      if (accessResult.error) {
        return {
          success: false,
          error: accessResult.error.message,
        };
      }

      if (accessResult.userNotFound) {
        return {
          success: false,
          error: `User ${userEmail} not found or does not have access to server`,
        };
      }

      // Success - get user and tenant info for context
      const user = await req.db.endUser.findFirst({
        where: {
          email: userEmail,
        },
        select: {
          id: true,
          tenantId: true,
        },
      });

      return {
        success: true,
        userContext: {
          userId: user?.id,
          tenantId: user?.tenantId,
          authType: ServerAuthType.BASE,
        },
        metadata: {
          validatedAt: new Date(),
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Base authentication failed: ${errorMessage}`,
      };
    }
  }

  async validateConfiguration(config: ServerAuthConfig): Promise<ValidationResult> {
    // BASE authentication doesn't require any special configuration
    // It uses the existing AgentBridge user/tenant validation
    return {
      valid: true,
    };
  }

  /**
   * Get providers for BASE auth (returns empty array as BASE auth doesn't use providers)
   */
  async getProviders(serverId: string): Promise<AuthProvider[]> {
    // BASE authentication doesn't use providers
    return [];
  }

  /**
   * Create provider for BASE auth (not applicable)
   */
  async createProvider(serverId: string, providerData: CreateProviderRequest): Promise<AuthProvider> {
    throw new Error("BASE authentication does not support providers");
  }

  /**
   * Update provider for BASE auth (not applicable)
   */
  async updateProvider(
    serverId: string,
    providerId: string,
    providerData: UpdateProviderRequest,
  ): Promise<AuthProvider> {
    throw new Error("BASE authentication does not support providers");
  }

  /**
   * Delete provider for BASE auth (not applicable)
   */
  async deleteProvider(serverId: string, providerId: string): Promise<void> {
    throw new Error("BASE authentication does not support providers");
  }

  /**
   * Handle BASE configuration update (no special config needed)
   */
  async handleConfigUpdate(
    serverId: string,
    config: { authType: ServerAuthType; jwtProviderId?: string },
  ): Promise<string | null> {
    // BASE authentication doesn't require auth config
    return null;
  }
}
