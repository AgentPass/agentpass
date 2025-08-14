/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import { ApiNetworkErrorResponse, ApiOkResponse, ApiResult, ApiUnmappedResponse } from "../core/ApiResult";
import type { CancelablePromise } from "../core/CancelablePromise";
import { ClientOptions } from "../core/OpenAPI";
import { request as __request } from "../core/request";
import type { OwnIdConfig } from "../models/OwnIdConfig";
export class ConfigurationService {
  private static __mapResponse_getOwnIdConfig(
    response: ApiResult<OwnIdConfig>,
  ): ApiOkResponse<OwnIdConfig> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<OwnIdConfig>;
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
   * Get OwnID configuration
   * Retrieves the configuration for OwnID
   */
  public static getOwnIdConfig(
    client: ClientOptions,
    {
      query,
    }: {
      query?: {
        server_id?: string;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<OwnIdConfig> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<OwnIdConfig>(client, {
      method: "GET",
      url: "/api/ownid/config",
      query,
      abortSignal,
    }).then(ConfigurationService.__mapResponse_getOwnIdConfig);
  }
}
