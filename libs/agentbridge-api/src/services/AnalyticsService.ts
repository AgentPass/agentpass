/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import { ApiNetworkErrorResponse, ApiOkResponse, ApiResult, ApiUnmappedResponse } from "../core/ApiResult";
import type { CancelablePromise } from "../core/CancelablePromise";
import { ClientOptions } from "../core/OpenAPI";
import { request as __request } from "../core/request";
import type { ServerAnalytics } from "../models/ServerAnalytics";
import type { ToolAnalytics } from "../models/ToolAnalytics";
export class AnalyticsService {
  private static __mapResponse_mcpGetServerAnalytics(
    response: ApiResult<ServerAnalytics>,
  ): ApiOkResponse<ServerAnalytics> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<ServerAnalytics>;
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
   * Get server analytics
   * Retrieves analytics data for a specific MCP server
   */
  public static mcpGetServerAnalytics(
    client: ClientOptions,
    {
      pathParams,
      query,
    }: {
      pathParams?: {
        serverId: string;
      };
      query: {
        from: string;
        to: string;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<ServerAnalytics> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<ServerAnalytics>(client, {
      method: "GET",
      url: "/api/servers/{serverId}/analytics",
      path: pathParams,
      query,
      abortSignal,
    }).then(AnalyticsService.__mapResponse_mcpGetServerAnalytics);
  }
  private static __mapResponse_mcpGetToolAnalytics(
    response: ApiResult<ToolAnalytics>,
  ): ApiOkResponse<ToolAnalytics> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<ToolAnalytics>;
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
   * Get tool analytics
   * Retrieves analytics data for a specific tool
   */
  public static mcpGetToolAnalytics(
    client: ClientOptions,
    {
      pathParams,
      query,
    }: {
      pathParams?: {
        serverId: string;
        toolId: string;
      };
      query: {
        from: string;
        to: string;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<ToolAnalytics> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<ToolAnalytics>(client, {
      method: "GET",
      url: "/api/servers/{serverId}/tools/{toolId}/analytics",
      path: pathParams,
      query,
      abortSignal,
    }).then(AnalyticsService.__mapResponse_mcpGetToolAnalytics);
  }
}
