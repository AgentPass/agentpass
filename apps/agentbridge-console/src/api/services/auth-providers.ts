import { apiCallSucceeded, ApiClientOptions, apiResultToError, ServerIdBackendUrl } from "@/api/api-options.ts";
import { getUser } from "@/contexts/auth-context.tsx";
import { log } from "@/utils/log.ts";
import { OAuthProvider as AuthProvider, ProvidersConfigurationService, UpdateProviderRequest } from "@agentbridge/api";

export const AuthProvidersAPIService = {
  getProviders: async (): Promise<AuthProvider[]> => {
    const res = await ProvidersConfigurationService.mcpListProviders(ApiClientOptions, {
      query: {
        page: 1,
        limit: 100,
      },
    });
    if (apiCallSucceeded(res)) {
      return res.body.data || [];
    }
    throw apiResultToError(res);
  },

  getProvider: async (providerId: string): Promise<AuthProvider | null> => {
    const res = await ProvidersConfigurationService.mcpGetProvider(ApiClientOptions, {
      pathParams: { providerId },
    });
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },

  createProvider: async (provider: Omit<AuthProvider, "id" | "createdAt" | "updatedAt">): Promise<AuthProvider> => {
    const res = await ProvidersConfigurationService.mcpCreateProvider(ApiClientOptions, {
      requestBody: provider,
    });
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },

  updateProvider: async (providerId: string, updates: UpdateProviderRequest): Promise<AuthProvider> => {
    const res = await ProvidersConfigurationService.mcpUpdateProvider(ApiClientOptions, {
      pathParams: { providerId },
      requestBody: updates,
    });
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },

  deleteProvider: async (providerId: string): Promise<void> => {
    const res = await ProvidersConfigurationService.mcpDeleteProvider(ApiClientOptions, {
      pathParams: { providerId },
    });
    if (apiCallSucceeded(res)) {
      return;
    }
    throw apiResultToError(res);
  },

  authorize: async (serverId: string, providerId: string, state: string) => {
    const serverUrl = ServerIdBackendUrl(serverId);
    const user = getUser();
    if (!user) {
      throw new Error("User is not authenticated");
    }
    const authorizeUrlQuery = new URLSearchParams({
      redirect_uri: window.location.href,
      serverId,
      response_type: "code",
      provider_id: providerId,
      scope: "tool",
      state,
      admin_auth: user.accessToken,
    });
    const targetUrl = `${serverUrl}/api/oauth/authorize?${authorizeUrlQuery.toString()}`;
    log.info("Redirecting to OAuth provider authorization", { targetUrl });
    window.location.href = targetUrl;
  },
};
