/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import { ApiNetworkErrorResponse, ApiOkResponse, ApiResult, ApiUnmappedResponse } from "../core/ApiResult";
import type { CancelablePromise } from "../core/CancelablePromise";
import { ClientOptions } from "../core/OpenAPI";
import { request as __request } from "../core/request";
export class MirrorService {
  private static __mapResponse_mirrorRequest(
    response: ApiResult<string>,
  ): ApiOkResponse<string> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<string>;
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
   * Mirror a request to bypass CORS
   * Mirrors a request to the MCP server
   */
  public static mirrorRequest(
    client: ClientOptions,
    {
      query,
    }: {
      query: {
        url: string;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<string> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<string>(client, {
      method: "GET",
      url: "/api/mirror",
      query,
      abortSignal,
    }).then(MirrorService.__mapResponse_mirrorRequest);
  }
}
