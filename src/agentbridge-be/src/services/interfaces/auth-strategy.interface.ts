import { ServerAuthType } from "@agentbridge/api";
import { Request } from "express";

export interface ServerAuthResult {
  success: boolean;
  error?: string;
  userContext?: {
    userId?: string;
    tenantId?: string;
    authType: ServerAuthType;
    originalToken?: string;
  };
  metadata?: {
    providerId?: string;
    validatedAt: Date;
    expiresAt?: Date;
  };
}

export interface ServerAuthConfig {
  id: string;
  serverId: string;
  authType: ServerAuthType;
  jwtProviderId?: string;
  jwtProvider?: {
    id: string;
    name: string;
    jwksUrl: string;
    enabled: boolean;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface AuthProvider {
  id: string;
  serverId: string;
  tenantId: string;
  name: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JwtProvider extends AuthProvider {
  jwksUrl: string;
}

export interface CreateProviderRequest {
  name: string;
  enabled?: boolean;
}

export interface CreateJwtProviderRequest extends CreateProviderRequest {
  jwksUrl: string;
}

export interface UpdateProviderRequest {
  name?: string;
  enabled?: boolean;
}

export interface UpdateJwtProviderRequest extends UpdateProviderRequest {
  jwksUrl?: string;
}

export interface IServerAuthStrategy {
  authenticate(req: Request, config: ServerAuthConfig): Promise<ServerAuthResult>;
  validateConfiguration(config: ServerAuthConfig): Promise<ValidationResult>;

  // Provider management methods (strategy-based)
  getProviders(serverId: string): Promise<AuthProvider[]>;
  createProvider(serverId: string, providerData: CreateProviderRequest): Promise<AuthProvider>;
  updateProvider(serverId: string, providerId: string, providerData: UpdateProviderRequest): Promise<AuthProvider>;
  deleteProvider(serverId: string, providerId: string): Promise<void>;

  // Configuration management (strategy-based)
  handleConfigUpdate(
    serverId: string,
    config: { authType: ServerAuthType; jwtProviderId?: string },
  ): Promise<string | null>;
}
