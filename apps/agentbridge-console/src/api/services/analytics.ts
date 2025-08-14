import { apiCallSucceeded, ApiClientOptions, apiResultToError } from "@/api/api-options.ts";
import { AnalyticsService, ServerAnalytics, ToolAnalytics } from "@agentbridge/api";

export const AnalyticsAPIService = {
  getServerAnalytics: async (serverId: string, from: Date, to: Date): Promise<ServerAnalytics> => {
    const res = await AnalyticsService.mcpGetServerAnalytics(ApiClientOptions, {
      pathParams: { serverId },
      query: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
    });
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },

  getToolAnalytics: async (serverId: string, toolId: string, from: Date, to: Date): Promise<ToolAnalytics> => {
    const res = await AnalyticsService.mcpGetToolAnalytics(ApiClientOptions, {
      pathParams: { serverId, toolId },
      query: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
    });
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },
};
