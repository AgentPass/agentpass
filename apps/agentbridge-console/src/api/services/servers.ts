import { apiCallSucceeded, ApiClientOptions, apiResultToError } from "@/api/api-options.ts";
import {
  ApiErrorResponse,
  CreateServerRequest,
  McpServer,
  McpServerManagementService,
  OAuthProvider,
  UpdateServerRequest,
} from "@agentbridge/api";

export const ServersAPIService = {
  getServers: async (): Promise<McpServer[]> => {
    const res = await McpServerManagementService.mcpListServers(ApiClientOptions, {
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

  getServer: async (id: string): Promise<McpServer | null> => {
    const res = await McpServerManagementService.mcpGetServer(ApiClientOptions, {
      pathParams: { serverId: id },
    });
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },

  createServer: async (server: CreateServerRequest): Promise<McpServer> => {
    const res = await McpServerManagementService.mcpCreateServer(ApiClientOptions, {
      requestBody: server,
    });
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },

  updateServer: async (id: string, updates: UpdateServerRequest): Promise<McpServer> => {
    const res = await McpServerManagementService.mcpUpdateServer(ApiClientOptions, {
      pathParams: { serverId: id },
      requestBody: updates,
    });
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },

  deleteServer: async (id: string): Promise<void> => {
    const res = await McpServerManagementService.mcpDeleteServer(ApiClientOptions, {
      pathParams: { serverId: id },
    });
    if (apiCallSucceeded(res)) {
      return;
    }
    throw apiResultToError(res);
  },
  importOpenApi: async (params: {
    name: string;
    description: string;
    openApiContent: string;
    selectedTools?: string[];
  }): Promise<McpServer & { oauthProviders?: OAuthProvider[] }> => {
    const res = await McpServerManagementService.mcpImportOpenApi(
      {
        ...ApiClientOptions,
        timeoutMsec: undefined,
      },
      {
        requestBody: new Blob([params.openApiContent], { type: "application/octet-stream" }),
        query: {
          name: params.name,
          description: params.description,
          selectedTools: params.selectedTools,
        },
      },
    );
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    if (res.httpCode === 400) {
      const error = res as ApiErrorResponse<400>;
      // @ts-expect-error This is a valid 400 error and body
      if (error?.body?.errorDescription) {
        // @ts-expect-error This is a valid 400 error and body
        throw new Error(error.body.errorDescription);
      }
    }
    throw apiResultToError(res);
  },

  createExampleServer: async (): Promise<McpServer & { provider?: OAuthProvider }> => {
    const res = await McpServerManagementService.mcpCreateExampleServer(ApiClientOptions);
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },

  exportServer: async (serverId: string): Promise<Blob> => {
    const res = await McpServerManagementService.mcpExportServer(ApiClientOptions, {
      pathParams: { serverId },
    });

    if (apiCallSucceeded(res)) {
      // Convert the JSON response to a Blob
      return new Blob([JSON.stringify(res.body, null, 2)], { type: "application/json" });
    }
    throw apiResultToError(res);
  },

  importServer: async (importData: unknown): Promise<{ id: string; name: string; message: string }> => {
    const res = await McpServerManagementService.mcpImportServer(ApiClientOptions, {
      requestBody: importData,
    });

    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },
};
