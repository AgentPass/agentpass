import { apiCallSucceeded, ApiClientOptions, apiResultToError } from "@/api/api-options.ts";
import { ProviderToken as AccessToken, AccessTokenManagementService, User } from "@agentbridge/api";

export const UsersAPIService = {
  getUsersWithAccess: async (): Promise<User[]> => {
    const res = await AccessTokenManagementService.mcpListServerUsers(ApiClientOptions, {
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

  blockUserAccess: async (userId: string, block: boolean): Promise<User> => {
    const res = await AccessTokenManagementService.mcpBlockUserAccess(ApiClientOptions, {
      pathParams: { userId },
      query: { block },
    });
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },

  getUserTokens: async (userId: string): Promise<AccessToken[]> => {
    const res = await AccessTokenManagementService.mcpListUserTokens(ApiClientOptions, {
      pathParams: { userId },
      query: {
        includeExpired: true,
      },
    });
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },

  revokeAccessToken: async (userId: string, tokenId: string): Promise<void> => {
    const res = await AccessTokenManagementService.mcpRevokeProviderToken(ApiClientOptions, {
      pathParams: { userId, tokenId },
    });
    if (apiCallSucceeded(res)) {
      return;
    }
    throw apiResultToError(res);
  },

  revokeUserAccess: async (userId: string): Promise<void> => {
    const res = await AccessTokenManagementService.mcpRevokeUserAccess(ApiClientOptions, {
      pathParams: { userId },
    });
    if (apiCallSucceeded(res)) {
      return;
    }
    throw apiResultToError(res);
  },
};
