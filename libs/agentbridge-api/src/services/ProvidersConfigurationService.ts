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
import type { CreateProviderRequest } from "../models/CreateProviderRequest";
import type { OAuthProvider } from "../models/OAuthProvider";
import type { Pagination } from "../models/Pagination";
import type { UpdateProviderRequest } from "../models/UpdateProviderRequest";
export class ProvidersConfigurationService {
  private static __mapResponse_mcpListProviders(
    response: ApiResult<{
      data: Array<OAuthProvider>;
      pagination?: Pagination;
    }>,
  ):
    | ApiOkResponse<{
        data: Array<OAuthProvider>;
        pagination?: Pagination;
      }>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<{
        data: Array<OAuthProvider>;
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
   * List OAuth providers
   * Retrieves a list of all configured OAuth providers
   */
  public static mcpListProviders(
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
        data: Array<OAuthProvider>;
        pagination?: Pagination;
      }>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse
  > {
    return __request<{
      data: Array<OAuthProvider>;
      pagination?: Pagination;
    }>(client, {
      method: "GET",
      url: "/api/providers",
      query,
      abortSignal,
    }).then(ProvidersConfigurationService.__mapResponse_mcpListProviders);
  }
  private static __mapResponse_mcpCreateProvider(
    response: ApiResult<OAuthProvider>,
  ): ApiCreatedResponse<OAuthProvider> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 201) {
      return response as ApiCreatedResponse<OAuthProvider>;
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
   * Create a new OAuth provider
   * Creates a new OAuth provider configuration
   */
  public static mcpCreateProvider(
    client: ClientOptions,
    {
      requestBody,
    }: {
      requestBody: CreateProviderRequest;
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiCreatedResponse<OAuthProvider> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<OAuthProvider>(client, {
      method: "POST",
      url: "/api/providers",
      body: requestBody,
      mediaType: "application/json",
      abortSignal,
    }).then(ProvidersConfigurationService.__mapResponse_mcpCreateProvider);
  }
  private static __mapResponse_mcpGetProvider(
    response: ApiResult<OAuthProvider>,
  ): ApiOkResponse<OAuthProvider> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<OAuthProvider>;
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
   * Get OAuth provider details
   * Retrieves details of a specific OAuth provider
   */
  public static mcpGetProvider(
    client: ClientOptions,
    {
      pathParams,
    }: {
      pathParams: {
        providerId: string;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<OAuthProvider> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<OAuthProvider>(client, {
      method: "GET",
      url: "/api/providers/{providerId}",
      path: pathParams,
      abortSignal,
    }).then(ProvidersConfigurationService.__mapResponse_mcpGetProvider);
  }
  private static __mapResponse_mcpUpdateProvider(
    response: ApiResult<OAuthProvider>,
  ): ApiOkResponse<OAuthProvider> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<OAuthProvider>;
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
   * Update OAuth provider
   * Updates the configuration of an existing OAuth provider
   */
  public static mcpUpdateProvider(
    client: ClientOptions,
    {
      pathParams,
      requestBody,
    }: {
      pathParams: {
        providerId: string;
      };
      requestBody: UpdateProviderRequest;
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<OAuthProvider> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<OAuthProvider>(client, {
      method: "PUT",
      url: "/api/providers/{providerId}",
      path: pathParams,
      body: requestBody,
      mediaType: "application/json",
      abortSignal,
    }).then(ProvidersConfigurationService.__mapResponse_mcpUpdateProvider);
  }
  private static __mapResponse_mcpDeleteProvider(
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
   * Delete OAuth provider
   * Deletes a specific OAuth provider
   */
  public static mcpDeleteProvider(
    client: ClientOptions,
    {
      pathParams,
    }: {
      pathParams: {
        providerId: string;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkEmptyResponse | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<void>(client, {
      method: "DELETE",
      url: "/api/providers/{providerId}",
      path: pathParams,
      abortSignal,
    }).then(ProvidersConfigurationService.__mapResponse_mcpDeleteProvider);
  }
}
