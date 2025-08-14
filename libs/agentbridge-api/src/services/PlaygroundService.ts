/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import { ApiNetworkErrorResponse, ApiOkResponse, ApiResult, ApiUnmappedResponse } from "../core/ApiResult";
import type { CancelablePromise } from "../core/CancelablePromise";
import { ClientOptions } from "../core/OpenAPI";
import { request as __request } from "../core/request";
import type { ToolRunRequest } from "../models/ToolRunRequest";
import type { ToolRunResult } from "../models/ToolRunResult";
export class PlaygroundService {
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
    }).then(PlaygroundService.__mapResponse_mcpRunTool);
  }
}
