import { ApiClientOptions } from "@/api/api-options.ts";
import { ServerAuthType, UpdateServerAuthConfigRequest } from "@agentbridge/api";

export interface ServerAuthConfigResponse {
  serverId: string;
  authType: ServerAuthType;
  authConfig?: {
    id: string;
    jwtProvider?: {
      id: string;
      name: string;
      jwksUrl: string;
      enabled: boolean;
    };
  };
}

export interface JwtProvider {
  id: string;
  name: string;
  jwksUrl: string;
  enabled: boolean;
  serverId: string;
  tenantId: string;
}

export interface CreateJwtProviderRequest {
  name: string;
  jwksUrl: string;
  enabled?: boolean;
}

export interface UpdateJwtProviderRequest {
  name?: string;
  jwksUrl?: string;
  enabled?: boolean;
}

export interface ValidateJwksUrlResponse {
  valid: boolean;
  error?: string;
  keyCount?: number;
}

class ServerAuthAPIServiceClass {
  private get baseUrl() {
    return `${ApiClientOptions.baseUrl}/api`;
  }

  async getServerAuthConfig(serverId: string): Promise<ServerAuthConfigResponse> {
    const url = `${this.baseUrl}/servers/${serverId}/auth`;
    const response = await fetch(url, {
      headers: ApiClientOptions.onBeforeRequest?.({ method: "GET", url })?.headers || {},
    });
    if (!response.ok) {
      throw new Error(`Failed to get server auth config: ${response.statusText}`);
    }
    return response.json();
  }

  async updateServerAuthConfig(
    serverId: string,
    config: UpdateServerAuthConfigRequest,
  ): Promise<ServerAuthConfigResponse> {
    const url = `${this.baseUrl}/servers/${serverId}/auth`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(ApiClientOptions.onBeforeRequest?.({ method: "PUT", url })?.headers || {}),
      },
      body: JSON.stringify(config),
    });
    if (!response.ok) {
      throw new Error(`Failed to update server auth config: ${response.statusText}`);
    }
    return response.json();
  }

  async getJwtProviders(serverId: string): Promise<JwtProvider[]> {
    const url = `${this.baseUrl}/servers/${serverId}/auth-providers`;
    const response = await fetch(url, {
      headers: ApiClientOptions.onBeforeRequest?.({ method: "GET", url })?.headers || {},
    });
    if (!response.ok) {
      throw new Error(`Failed to get auth providers: ${response.statusText}`);
    }
    return response.json();
  }

  async createJwtProvider(serverId: string, provider: CreateJwtProviderRequest): Promise<JwtProvider> {
    const url = `${this.baseUrl}/servers/${serverId}/auth-providers`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(ApiClientOptions.onBeforeRequest?.({ method: "POST", url })?.headers || {}),
      },
      body: JSON.stringify(provider),
    });
    if (!response.ok) {
      throw new Error(`Failed to create auth provider: ${response.statusText}`);
    }
    return response.json();
  }

  async updateJwtProvider(
    serverId: string,
    providerId: string,
    provider: UpdateJwtProviderRequest,
  ): Promise<JwtProvider> {
    const url = `${this.baseUrl}/servers/${serverId}/auth-providers/${providerId}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(ApiClientOptions.onBeforeRequest?.({ method: "PUT", url })?.headers || {}),
      },
      body: JSON.stringify(provider),
    });
    if (!response.ok) {
      throw new Error(`Failed to update auth provider: ${response.statusText}`);
    }
    return response.json();
  }

  async deleteJwtProvider(serverId: string, providerId: string): Promise<void> {
    const url = `${this.baseUrl}/servers/${serverId}/auth-providers/${providerId}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: ApiClientOptions.onBeforeRequest?.({ method: "DELETE", url })?.headers || {},
    });
    if (!response.ok) {
      throw new Error(`Failed to delete auth provider: ${response.statusText}`);
    }
  }

  async validateJwksUrl(jwksUrl: string): Promise<ValidateJwksUrlResponse> {
    const url = `${this.baseUrl}/servers/validate-jwks`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(ApiClientOptions.onBeforeRequest?.({ method: "POST", url })?.headers || {}),
      },
      body: JSON.stringify({ jwksUrl }),
    });
    if (!response.ok) {
      throw new Error(`Failed to validate JWKS URL: ${response.statusText}`);
    }
    return response.json();
  }
}

export const ServerAuthAPIService = new ServerAuthAPIServiceClass();
