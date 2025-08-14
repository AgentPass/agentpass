import { apiCallSucceeded, ApiClientOptions, apiResultToError } from "@/api/api-options.ts";
import { ConfigurationService, OwnIdConfig } from "@agentbridge/api";

export const ConfigAPIService = {
  ownIdConfig: async (serverId: string | null): Promise<OwnIdConfig> => {
    const res = await ConfigurationService.getOwnIdConfig(ApiClientOptions, {
      query: {
        server_id: serverId || undefined,
      },
    });
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },
};
