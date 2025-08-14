/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import {
  ApiCreatedResponse,
  ApiNetworkErrorResponse,
  ApiOkEmptyResponse,
  ApiOkResponse,
  ApiResult,
  ApiUnmappedResponse,
} from "../core/ApiResult";
import type { CancelablePromise } from "../core/CancelablePromise";
import { ClientOptions } from "../core/OpenAPI";
import { request as __request } from "../core/request";
import type { CreateToolRequest } from "../models/CreateToolRequest";
import type { Folder } from "../models/Folder";
import type { Pagination } from "../models/Pagination";
import type { Tool } from "../models/Tool";
import type { ToolRunRequest } from "../models/ToolRunRequest";
import type { ToolRunResult } from "../models/ToolRunResult";
import type { UpdateToolRequest } from "../models/UpdateToolRequest";
export class McpToolsManagementService {
  private static __mapResponse_mcpListTools(
    response: ApiResult<{
      data?: Array<Tool>;
      pagination?: Pagination;
    }>,
  ):
    | ApiOkResponse<{
        data?: Array<Tool>;
        pagination?: Pagination;
      }>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<{
        data?: Array<Tool>;
        pagination?: Pagination;
      }>;
    }
    if (response.error && response.httpCode === 0) {
      return response as ApiNetworkErrorResponse;
    }
    return {
      ...response,
      error: {
        message: "Unmapped response http code",
        originalError: response.error,
      },
    } as ApiUnmappedResponse;
  }
  /**
   * List tools
   * Retrieves a list of all tools associated with a specific MCP server
   */
  public static mcpListTools(
    client: ClientOptions,
    {
      pathParams,
      query,
    }: {
      pathParams?: {
        serverId: string;
      };
      query?: {
        search?: string;
        page?: number;
        limit?: number;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<
    | ApiOkResponse<{
        data?: Array<Tool>;
        pagination?: Pagination;
      }>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse
  > {
    return __request<{
      data?: Array<Tool>;
      pagination?: Pagination;
    }>(client, {
      method: "GET",
      url: "/api/servers/{serverId}/tools",
      path: pathParams,
      query,
      abortSignal,
    }).then(McpToolsManagementService.__mapResponse_mcpListTools);
  }
  private static __mapResponse_mcpCreateTool(
    response: ApiResult<Tool>,
  ): ApiCreatedResponse<Tool> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 201) {
      return response as ApiCreatedResponse<Tool>;
    }
    if (response.error && response.httpCode === 0) {
      return response as ApiNetworkErrorResponse;
    }
    return {
      ...response,
      error: {
        message: "Unmapped response http code",
        originalError: response.error,
      },
    } as ApiUnmappedResponse;
  }
  /**
   * Create a new tool
   * Creates a new tool for a specific MCP server
   */
  public static mcpCreateTool(
    client: ClientOptions,
    {
      pathParams,
      requestBody,
    }: {
      pathParams: {
        serverId: string;
      };
      requestBody: CreateToolRequest;
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiCreatedResponse<Tool> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<Tool>(client, {
      method: "POST",
      url: "/api/servers/{serverId}/tools",
      path: pathParams,
      body: requestBody,
      mediaType: "application/json",
      abortSignal,
    }).then(McpToolsManagementService.__mapResponse_mcpCreateTool);
  }
  private static __mapResponse_mcpImportToolsFromOpenApi(
    response: ApiResult<{
      tools?: Array<Tool>;
      authProviders?: Array<Record<string, any>>;
    }>,
  ):
    | ApiCreatedResponse<{
        tools?: Array<Tool>;
        authProviders?: Array<Record<string, any>>;
      }>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 201) {
      return response as ApiCreatedResponse<{
        tools?: Array<Tool>;
        authProviders?: Array<Record<string, any>>;
      }>;
    }
    if (response.error && response.httpCode === 0) {
      return response as ApiNetworkErrorResponse;
    }
    return {
      ...response,
      error: {
        message: "Unmapped response http code",
        originalError: response.error,
      },
    } as ApiUnmappedResponse;
  }
  /**
   * Import tools from OpenAPI specification
   * Imports tools into an existing MCP server from an OpenAPI specification
   */
  public static mcpImportToolsFromOpenApi(
    client: ClientOptions,
    {
      pathParams,
      query,
      requestBody,
    }: {
      pathParams?: {
        serverId: string;
      };
      query?: {
        selectedTools?: Array<string>;
      };
      requestBody: Blob;
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<
    | ApiCreatedResponse<{
        tools?: Array<Tool>;
        authProviders?: Array<Record<string, any>>;
      }>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse
  > {
    return __request<{
      tools?: Array<Tool>;
      authProviders?: Array<Record<string, any>>;
    }>(client, {
      method: "POST",
      url: "/api/servers/{serverId}/tools/import/openapi",
      path: pathParams,
      query,
      body: requestBody,
      mediaType: "application/octet-stream",
      abortSignal,
    }).then(McpToolsManagementService.__mapResponse_mcpImportToolsFromOpenApi);
  }
  private static __mapResponse_mcpGetTool(
    response: ApiResult<Tool>,
  ): ApiOkResponse<Tool> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<Tool>;
    }
    if (response.error && response.httpCode === 0) {
      return response as ApiNetworkErrorResponse;
    }
    return {
      ...response,
      error: {
        message: "Unmapped response http code",
        originalError: response.error,
      },
    } as ApiUnmappedResponse;
  }
  /**
   * Get tool details
   * Retrieves details of a specific tool
   */
  public static mcpGetTool(
    client: ClientOptions,
    {
      pathParams,
    }: {
      pathParams: {
        serverId: string;
        toolId: string;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<Tool> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<Tool>(client, {
      method: "GET",
      url: "/api/servers/{serverId}/tools/{toolId}",
      path: pathParams,
      abortSignal,
    }).then(McpToolsManagementService.__mapResponse_mcpGetTool);
  }
  private static __mapResponse_mcpUpdateTool(
    response: ApiResult<Tool>,
  ): ApiOkResponse<Tool> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<Tool>;
    }
    if (response.error && response.httpCode === 0) {
      return response as ApiNetworkErrorResponse;
    }
    return {
      ...response,
      error: {
        message: "Unmapped response http code",
        originalError: response.error,
      },
    } as ApiUnmappedResponse;
  }
  /**
   * Update tool
   * Updates the configuration of an existing tool
   */
  public static mcpUpdateTool(
    client: ClientOptions,
    {
      pathParams,
      requestBody,
    }: {
      pathParams: {
        serverId: string;
        toolId: string;
      };
      requestBody: UpdateToolRequest;
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<Tool> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<Tool>(client, {
      method: "PUT",
      url: "/api/servers/{serverId}/tools/{toolId}",
      path: pathParams,
      body: requestBody,
      mediaType: "application/json",
      abortSignal,
    }).then(McpToolsManagementService.__mapResponse_mcpUpdateTool);
  }
  private static __mapResponse_mcpDeleteTool(
    response: ApiResult<void>,
  ): ApiOkEmptyResponse | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 204) {
      return response as ApiOkEmptyResponse;
    }
    if (response.error && response.httpCode === 0) {
      return response as ApiNetworkErrorResponse;
    }
    return {
      ...response,
      error: {
        message: "Unmapped response http code",
        originalError: response.error,
      },
    } as ApiUnmappedResponse;
  }
  /**
   * Delete tool
   * Deletes a specific tool
   */
  public static mcpDeleteTool(
    client: ClientOptions,
    {
      pathParams,
    }: {
      pathParams: {
        serverId: string;
        toolId: string;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkEmptyResponse | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<void>(client, {
      method: "DELETE",
      url: "/api/servers/{serverId}/tools/{toolId}",
      path: pathParams,
      abortSignal,
    }).then(McpToolsManagementService.__mapResponse_mcpDeleteTool);
  }
  private static __mapResponse_mcpRunTool(
    response: ApiResult<ToolRunResult>,
  ): ApiOkResponse<ToolRunResult> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<ToolRunResult>;
    }
    if (response.error && response.httpCode === 0) {
      return response as ApiNetworkErrorResponse;
    }
    return {
      ...response,
      error: {
        message: "Unmapped response http code",
        originalError: response.error,
      },
    } as ApiUnmappedResponse;
  }
  /**
   * Run a tool in the playground
   * Executes a tool with the provided parameters and returns the result
   */
  public static mcpRunTool(
    client: ClientOptions,
    {
      pathParams,
      requestBody,
    }: {
      pathParams: {
        serverId: string;
        toolId: string;
      };
      requestBody: ToolRunRequest;
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<ToolRunResult> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<ToolRunResult>(client, {
      method: "POST",
      url: "/api/servers/{serverId}/tools/{toolId}/run",
      path: pathParams,
      body: requestBody,
      mediaType: "application/json",
      abortSignal,
    }).then(McpToolsManagementService.__mapResponse_mcpRunTool);
  }
  private static __mapResponse_mcpEnableTool(
    response: ApiResult<Tool>,
  ): ApiOkResponse<Tool> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<Tool>;
    }
    if (response.error && response.httpCode === 0) {
      return response as ApiNetworkErrorResponse;
    }
    return {
      ...response,
      error: {
        message: "Unmapped response http code",
        originalError: response.error,
      },
    } as ApiUnmappedResponse;
  }
  /**
   * Enable tool
   * Enables a tool to make it available for execution
   */
  public static mcpEnableTool(
    client: ClientOptions,
    {
      pathParams,
    }: {
      pathParams: {
        serverId: string;
        toolId: string;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<Tool> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<Tool>(client, {
      method: "PUT",
      url: "/api/servers/{serverId}/tools/{toolId}/enable",
      path: pathParams,
      abortSignal,
    }).then(McpToolsManagementService.__mapResponse_mcpEnableTool);
  }
  private static __mapResponse_mcpDisableTool(
    response: ApiResult<Tool>,
  ): ApiOkResponse<Tool> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<Tool>;
    }
    if (response.error && response.httpCode === 0) {
      return response as ApiNetworkErrorResponse;
    }
    return {
      ...response,
      error: {
        message: "Unmapped response http code",
        originalError: response.error,
      },
    } as ApiUnmappedResponse;
  }
  /**
   * Disable tool
   * Disables a tool to prevent it from being executed
   */
  public static mcpDisableTool(
    client: ClientOptions,
    {
      pathParams,
    }: {
      pathParams: {
        serverId: string;
        toolId: string;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<Tool> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<Tool>(client, {
      method: "PUT",
      url: "/api/servers/{serverId}/tools/{toolId}/disable",
      path: pathParams,
      abortSignal,
    }).then(McpToolsManagementService.__mapResponse_mcpDisableTool);
  }
  private static __mapResponse_mcpListFolders(
    response: ApiResult<Array<Folder>>,
  ): ApiOkResponse<Array<Folder>> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<Array<Folder>>;
    }
    if (response.error && response.httpCode === 0) {
      return response as ApiNetworkErrorResponse;
    }
    return {
      ...response,
      error: {
        message: "Unmapped response http code",
        originalError: response.error,
      },
    } as ApiUnmappedResponse;
  }
  /**
   * List folders
   * Retrieves a list of all folders for organizing tools
   */
  public static mcpListFolders(
    client: ClientOptions,
    {
      pathParams,
    }: {
      pathParams: {
        serverId: string;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<Array<Folder>> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<Array<Folder>>(client, {
      method: "GET",
      url: "/api/servers/{serverId}/folders",
      path: pathParams,
      abortSignal,
    }).then(McpToolsManagementService.__mapResponse_mcpListFolders);
  }
  private static __mapResponse_mcpCreateFolder(
    response: ApiResult<Folder>,
  ): ApiCreatedResponse<Folder> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 201) {
      return response as ApiCreatedResponse<Folder>;
    }
    if (response.error && response.httpCode === 0) {
      return response as ApiNetworkErrorResponse;
    }
    return {
      ...response,
      error: {
        message: "Unmapped response http code",
        originalError: response.error,
      },
    } as ApiUnmappedResponse;
  }
  /**
   * Create a new folder
   * Creates a new folder for organizing tools
   */
  public static mcpCreateFolder(
    client: ClientOptions,
    {
      pathParams,
      requestBody,
    }: {
      pathParams: {
        serverId: string;
      };
      requestBody: {
        /**
         * Name of the folder
         */
        name: string;
        /**
         * ID of the parent folder (if nested)
         */
        parentFolderId?: string;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiCreatedResponse<Folder> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<Folder>(client, {
      method: "POST",
      url: "/api/servers/{serverId}/folders",
      path: pathParams,
      body: requestBody,
      mediaType: "application/json",
      abortSignal,
    }).then(McpToolsManagementService.__mapResponse_mcpCreateFolder);
  }
  private static __mapResponse_mcpUpdateFolder(
    response: ApiResult<Folder>,
  ): ApiOkResponse<Folder> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<Folder>;
    }
    if (response.error && response.httpCode === 0) {
      return response as ApiNetworkErrorResponse;
    }
    return {
      ...response,
      error: {
        message: "Unmapped response http code",
        originalError: response.error,
      },
    } as ApiUnmappedResponse;
  }
  /**
   * Update folder
   * Updates the name of an existing folder
   */
  public static mcpUpdateFolder(
    client: ClientOptions,
    {
      pathParams,
      requestBody,
    }: {
      pathParams: {
        serverId: string;
        folderId: string;
      };
      requestBody: {
        /**
         * New name for the folder
         */
        name: string;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<Folder> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<Folder>(client, {
      method: "PUT",
      url: "/api/servers/{serverId}/folders/{folderId}",
      path: pathParams,
      body: requestBody,
      mediaType: "application/json",
      abortSignal,
    }).then(McpToolsManagementService.__mapResponse_mcpUpdateFolder);
  }
  private static __mapResponse_mcpDeleteFolder(
    response: ApiResult<void>,
  ): ApiOkEmptyResponse | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 204) {
      return response as ApiOkEmptyResponse;
    }
    if (response.error && response.httpCode === 0) {
      return response as ApiNetworkErrorResponse;
    }
    return {
      ...response,
      error: {
        message: "Unmapped response http code",
        originalError: response.error,
      },
    } as ApiUnmappedResponse;
  }
  /**
   * Delete folder
   * Deletes a specific folder
   */
  public static mcpDeleteFolder(
    client: ClientOptions,
    {
      pathParams,
    }: {
      pathParams: {
        serverId: string;
        folderId: string;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkEmptyResponse | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<void>(client, {
      method: "DELETE",
      url: "/api/servers/{serverId}/folders/{folderId}",
      path: pathParams,
      abortSignal,
    }).then(McpToolsManagementService.__mapResponse_mcpDeleteFolder);
  }
}
