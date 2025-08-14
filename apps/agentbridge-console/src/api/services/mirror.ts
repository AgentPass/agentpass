import { apiCallSucceeded, ApiClientOptions, apiResultToError } from "@/api/api-options.ts";
import { MirrorService } from "@agentbridge/api";

export const MirrorAPIService = {
  mirrorRequest: async (params: { url: string }): Promise<{ data: string }> => {
    const res = await MirrorService.mirrorRequest(ApiClientOptions, {
      query: {
        url: params.url,
      },
    });

    if (apiCallSucceeded(res)) {
      return { data: res.body };
    }

    throw apiResultToError(res);
  },
};
