/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import {
  ApiCreatedResponse,
  ApiErrorResponse,
  ApiNetworkErrorResponse,
  ApiOkEmptyResponse,
  ApiOkResponse,
  ApiResult,
  ApiUnmappedResponse,
} from "../core/ApiResult";
import type { CancelablePromise } from "../core/CancelablePromise";
import { ClientOptions } from "../core/OpenAPI";
import { request as __request } from "../core/request";
import type { CreateServerRequest } from "../models/CreateServerRequest";
import type { ImportedMcpServer } from "../models/ImportedMcpServer";
import type { McpServer } from "../models/McpServer";
import type { Pagination } from "../models/Pagination";
import type { UpdateServerRequest } from "../models/UpdateServerRequest";
export class McpServerManagementService {
  private static __mapResponse_mcpListServers(
    response: ApiResult<{
      data?: Array<McpServer>;
      pagination?: Pagination;
    }>,
  ):
    | ApiOkResponse<{
        data?: Array<McpServer>;
        pagination?: Pagination;
      }>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<{
        data?: Array<McpServer>;
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
   * List MCP servers
   * Retrieves a list of all MCP servers owned by the authenticated user
   */
  public static mcpListServers(
    client: ClientOptions,
    {
      query,
    }: {
      query?: {
        page?: number;
        limit?: number;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<
    | ApiOkResponse<{
        data?: Array<McpServer>;
        pagination?: Pagination;
      }>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse
  > {
    return __request<{
      data?: Array<McpServer>;
      pagination?: Pagination;
    }>(client, {
      method: "GET",
      url: "/api/servers",
      query,
      abortSignal,
    }).then(McpServerManagementService.__mapResponse_mcpListServers);
  }
  private static __mapResponse_mcpCreateServer(
    response: ApiResult<McpServer>,
  ): ApiCreatedResponse<McpServer> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 201) {
      return response as ApiCreatedResponse<McpServer>;
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
   * Create a new MCP server
   * Creates a new MCP server with the provided configuration
   */
  public static mcpCreateServer(
    client: ClientOptions,
    {
      requestBody,
    }: {
      requestBody: CreateServerRequest;
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiCreatedResponse<McpServer> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<McpServer>(client, {
      method: "POST",
      url: "/api/servers",
      body: requestBody,
      mediaType: "application/json",
      abortSignal,
    }).then(McpServerManagementService.__mapResponse_mcpCreateServer);
  }
  private static __mapResponse_mcpCreateExampleServer(
    response: ApiResult<ImportedMcpServer>,
  ): ApiCreatedResponse<ImportedMcpServer> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 201) {
      return response as ApiCreatedResponse<ImportedMcpServer>;
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
   * Create example todos server
   * Creates a sample To-Dos MCP server for testing and learning
   */
  public static mcpCreateExampleServer(
    client: ClientOptions,
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiCreatedResponse<ImportedMcpServer> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<ImportedMcpServer>(client, {
      method: "POST",
      url: "/api/servers/example",
      abortSignal,
    }).then(McpServerManagementService.__mapResponse_mcpCreateExampleServer);
  }
  private static __mapResponse_mcpImportOpenApi(
    response: ApiResult<
      | ImportedMcpServer
      | {
          /**
           * error code
           */
          error?: string;
          /**
           * Description of the error
           */
          errorDescription?: string;
        }
    >,
  ): ApiCreatedResponse<ImportedMcpServer> | ApiErrorResponse<400> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 201) {
      return response as ApiCreatedResponse<ImportedMcpServer>;
    }
    if (response.error && response.httpCode === 400) {
      return response as ApiErrorResponse<400>;
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
   * Import a new MCP server from OpenAPI specification
   * Imports a new MCP server from an OpenAPI specification
   */
  public static mcpImportOpenApi(
    client: ClientOptions,
    {
      query,
      requestBody,
    }: {
      query?: {
        name?: string;
        description?: string;
        selectedTools?: Array<string>;
      };
      requestBody: Blob;
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<
    ApiCreatedResponse<ImportedMcpServer> | ApiErrorResponse<400> | ApiNetworkErrorResponse | ApiUnmappedResponse
  > {
    return __request<
      | ImportedMcpServer
      | {
          /**
           * error code
           */
          error?: string;
          /**
           * Description of the error
           */
          errorDescription?: string;
        }
    >(client, {
      method: "POST",
      url: "/api/servers/import/openapi",
      query,
      body: requestBody,
      mediaType: "application/octet-stream",
      errors: {
        400: `Bad request`,
      },
      abortSignal,
    }).then(McpServerManagementService.__mapResponse_mcpImportOpenApi);
  }
  private static __mapResponse_mcpGetServer(
    response: ApiResult<McpServer>,
  ): ApiOkResponse<McpServer> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<McpServer>;
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
   * Get MCP server details
   * Retrieves details of a specific MCP server
   */
  public static mcpGetServer(
    client: ClientOptions,
    {
      pathParams,
    }: {
      pathParams: {
        serverId: string;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<McpServer> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<McpServer>(client, {
      method: "GET",
      url: "/api/servers/{serverId}",
      path: pathParams,
      abortSignal,
    }).then(McpServerManagementService.__mapResponse_mcpGetServer);
  }
  private static __mapResponse_mcpUpdateServer(
    response: ApiResult<McpServer>,
  ): ApiOkResponse<McpServer> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<McpServer>;
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
   * Update MCP server
   * Updates the configuration and/or status of an existing MCP server
   */
  public static mcpUpdateServer(
    client: ClientOptions,
    {
      pathParams,
      requestBody,
    }: {
      pathParams: {
        serverId: string;
      };
      requestBody: UpdateServerRequest;
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<McpServer> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<McpServer>(client, {
      method: "PUT",
      url: "/api/servers/{serverId}",
      path: pathParams,
      body: requestBody,
      mediaType: "application/json",
      abortSignal,
    }).then(McpServerManagementService.__mapResponse_mcpUpdateServer);
  }
  private static __mapResponse_mcpDeleteServer(
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
   * Delete MCP server
   * Deletes a specific MCP server
   */
  public static mcpDeleteServer(
    client: ClientOptions,
    {
      pathParams,
    }: {
      pathParams: {
        serverId: string;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkEmptyResponse | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<void>(client, {
      method: "DELETE",
      url: "/api/servers/{serverId}",
      path: pathParams,
      abortSignal,
    }).then(McpServerManagementService.__mapResponse_mcpDeleteServer);
  }

  private static __mapResponse_mcpExportServer(
    response: ApiResult<any>,
  ): ApiOkResponse<any> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<any>;
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
   * Export MCP server
   * Exports a MCP server configuration as JSON
   */
  public static mcpExportServer(
    client: ClientOptions,
    {
      pathParams,
    }: {
      pathParams: {
        serverId: string;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<any> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<any>(client, {
      method: "GET",
      url: "/api/servers/{serverId}/export",
      path: pathParams,
      abortSignal,
    }).then(McpServerManagementService.__mapResponse_mcpExportServer);
  }

  private static __mapResponse_mcpImportServer(
    response: ApiResult<{ id: string; name: string; message: string }>,
  ):
    | ApiCreatedResponse<{ id: string; name: string; message: string }>
    | ApiErrorResponse<400>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 201) {
      return response as ApiCreatedResponse<{ id: string; name: string; message: string }>;
    }
    if (response.error && response.httpCode === 400) {
      return response as ApiErrorResponse<400>;
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
   * Import MCP server
   * Imports a MCP server from exported JSON configuration
   */
  public static mcpImportServer(
    client: ClientOptions,
    {
      requestBody,
    }: {
      requestBody: any;
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<
    | ApiCreatedResponse<{ id: string; name: string; message: string }>
    | ApiErrorResponse<400>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse
  > {
    return __request<{ id: string; name: string; message: string }>(client, {
      method: "POST",
      url: "/api/servers/import",
      body: requestBody,
      mediaType: "application/json",
      abortSignal,
    }).then(McpServerManagementService.__mapResponse_mcpImportServer);
  }
}
