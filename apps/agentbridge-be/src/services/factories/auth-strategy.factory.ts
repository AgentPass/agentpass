import { ServerAuthType } from "@agentbridge/api";
import { PrismaClient } from "@prisma/client";
import { Logger } from "winston";
import { IServerAuthStrategy } from "../interfaces/auth-strategy.interface.js";
import { JwtAuthService } from "../jwt-auth.service.js";
import { BaseAuthStrategy } from "../strategies/base-auth.strategy.js";
import { JwtAuthStrategy } from "../strategies/jwt-auth.strategy.js";

/**
 * Factory for creating authentication strategies based on server configuration
 * Implements strategy pattern to avoid hardcoded if/else authentication logic
 */
export class AuthStrategyFactory {
  private strategies: Map<ServerAuthType, IServerAuthStrategy> = new Map();

  constructor(db: PrismaClient, logger?: Logger) {
    // Initialize available strategies
    this.strategies.set(ServerAuthType.BASE, new BaseAuthStrategy());
    this.strategies.set(ServerAuthType.JWT, new JwtAuthStrategy(new JwtAuthService(logger), db, logger));
  }

  /**
   * Get authentication strategy for the given auth type
   * @throws Error if auth type is not supported
   */
  getStrategy(authType: ServerAuthType): IServerAuthStrategy {
    const strategy = this.strategies.get(authType);
    if (!strategy) {
      throw new Error(`Unsupported authentication strategy: ${authType}`);
    }
    return strategy;
  }

  /**
   * Check if an auth type is supported
   */
  isSupported(authType: ServerAuthType): boolean {
    return this.strategies.has(authType);
  }

  /**
   * Get all supported auth types
   */
  getSupportedAuthTypes(): ServerAuthType[] {
    return Array.from(this.strategies.keys());
  }
}
