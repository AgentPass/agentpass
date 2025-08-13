import { apiCallSucceeded, ApiClientOptions, apiResultToError } from "@/api/api-options.ts";
import {
  CreateToolRequest,
  McpToolsManagementService,
  Tool,
  Folder as ToolFolder,
  ToolRunRequest,
  UpdateToolRequest,
} from "@agentbridge/api";

export const ToolsAPIService = {
  getTools: async (serverId: string): Promise<Tool[]> => {
    const res = await McpToolsManagementService.mcpListTools(ApiClientOptions, { pathParams: { serverId } });
    if (apiCallSucceeded(res)) {
      return res.body.data || [];
    }
    throw apiResultToError(res);
  },

  getTool: async (serverId: string, toolId: string): Promise<Tool | null> => {
    const res = await McpToolsManagementService.mcpGetTool(ApiClientOptions, {
      pathParams: { serverId, toolId },
    });
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },

  getToolFolders: async (serverId: string) => {
    const res = await McpToolsManagementService.mcpListFolders(ApiClientOptions, {
      pathParams: { serverId },
    });
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },

  createTool: async (serverId: string, tool: CreateToolRequest) => {
    const res = await McpToolsManagementService.mcpCreateTool(ApiClientOptions, {
      pathParams: { serverId },
      requestBody: tool,
    });
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },

  updateTool: async (serverId: string, toolId: string, updates: UpdateToolRequest) => {
    const res = await McpToolsManagementService.mcpUpdateTool(ApiClientOptions, {
      pathParams: { serverId, toolId },
      requestBody: updates,
    });
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },

  deleteTool: async (serverId: string, toolId: string) => {
    const res = await McpToolsManagementService.mcpDeleteTool(ApiClientOptions, {
      pathParams: { serverId, toolId },
    });
    if (apiCallSucceeded(res)) {
      return;
    }
    throw apiResultToError(res);
  },

  runTool: async (serverId: string, toolId: string, request: ToolRunRequest) => {
    const res = await McpToolsManagementService.mcpRunTool(
      {
        ...ApiClientOptions,
        timeoutMsec: undefined,
      },
      {
        pathParams: { serverId, toolId },
        requestBody: request,
      },
    );

    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },

  createToolFolder: async (serverId: string, folder: Omit<ToolFolder, "id" | "createdAt" | "updatedAt">) => {
    const res = await McpToolsManagementService.mcpCreateFolder(ApiClientOptions, {
      pathParams: { serverId },
      requestBody: {
        name: folder.name,
        parentFolderId: folder.parentFolderId,
      },
    });
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },

  updateToolFolder: async (serverId: string, folderId: string, updates: Pick<ToolFolder, "name">) => {
    const res = await McpToolsManagementService.mcpUpdateFolder(ApiClientOptions, {
      pathParams: { serverId, folderId },
      requestBody: {
        name: updates.name,
      },
    });
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },

  deleteToolFolder: async (serverId: string, folderId: string) => {
    const res = await McpToolsManagementService.mcpDeleteFolder(ApiClientOptions, {
      pathParams: { serverId, folderId },
    });
    if (apiCallSucceeded(res)) {
      return;
    }
    throw apiResultToError(res);
  },

  enableTool: async (serverId: string, toolId: string): Promise<Tool> => {
    const res = await McpToolsManagementService.mcpEnableTool(ApiClientOptions, {
      pathParams: { serverId, toolId },
    });
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },

  disableTool: async (serverId: string, toolId: string): Promise<Tool> => {
    const res = await McpToolsManagementService.mcpDisableTool(ApiClientOptions, {
      pathParams: { serverId, toolId },
    });
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },

  importFromOpenApi: async (params: {
    serverId: string;
    openApiContent: string;
    selectedTools?: string[];
  }): Promise<{ tools?: Tool[]; authProviders?: Record<string, unknown>[] }> => {
    const res = await McpToolsManagementService.mcpImportToolsFromOpenApi(ApiClientOptions, {
      pathParams: { serverId: params.serverId },
      query: params.selectedTools ? { selectedTools: params.selectedTools } : undefined,
      requestBody: new Blob([params.openApiContent], { type: "application/octet-stream" }),
    });
    if (apiCallSucceeded(res)) {
      return res.body;
    }
    throw apiResultToError(res);
  },
};
