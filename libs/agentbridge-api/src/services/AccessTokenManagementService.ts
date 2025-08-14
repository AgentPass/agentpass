/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import {
  ApiNetworkErrorResponse,
  ApiOkEmptyResponse,
  ApiOkResponse,
  ApiResult,
  ApiUnmappedResponse,
} from "../core/ApiResult";
import type { CancelablePromise } from "../core/CancelablePromise";
import { ClientOptions } from "../core/OpenAPI";
import { request as __request } from "../core/request";
import type { Pagination } from "../models/Pagination";
import type { ProviderToken } from "../models/ProviderToken";
import type { User } from "../models/User";
export class AccessTokenManagementService {
  private static __mapResponse_mcpListServerUsers(
    response: ApiResult<{
      data: Array<User>;
      pagination?: Pagination;
    }>,
  ):
    | ApiOkResponse<{
        data: Array<User>;
        pagination?: Pagination;
      }>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<{
        data: Array<User>;
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
   * List users with access to the MCP server
   * Retrieves a list of users who have access to the specified MCP server
   */
  public static mcpListServerUsers(
    client: ClientOptions,
    {
      query,
    }: {
      query?: {
        search?: string;
        page?: number;
        limit?: number;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<
    | ApiOkResponse<{
        data: Array<User>;
        pagination?: Pagination;
      }>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse
  > {
    return __request<{
      data: Array<User>;
      pagination?: Pagination;
    }>(client, {
      method: "GET",
      url: "/api/users",
      query,
      abortSignal,
    }).then(AccessTokenManagementService.__mapResponse_mcpListServerUsers);
  }
  private static __mapResponse_mcpGetServerUser(
    response: ApiResult<User>,
  ): ApiOkResponse<User> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<User>;
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
   * Get user details
   * Retrieves details of a specific user who has access to the MCP server
   */
  public static mcpGetServerUser(
    client: ClientOptions,
    {
      pathParams,
    }: {
      pathParams: {
        userId: string;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<User> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<User>(client, {
      method: "GET",
      url: "/api/users/{userId}",
      path: pathParams,
      abortSignal,
    }).then(AccessTokenManagementService.__mapResponse_mcpGetServerUser);
  }
  private static __mapResponse_mcpBlockUserAccess(
    response: ApiResult<User>,
  ): ApiOkResponse<User> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<User>;
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
   * Block user access
   * Blocks a user's access to the MCP server
   */
  public static mcpBlockUserAccess(
    client: ClientOptions,
    {
      pathParams,
      query,
    }: {
      pathParams?: {
        userId: string;
      };
      query?: {
        block?: boolean;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<User> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<User>(client, {
      method: "POST",
      url: "/api/users/{userId}",
      path: pathParams,
      query,
      abortSignal,
    }).then(AccessTokenManagementService.__mapResponse_mcpBlockUserAccess);
  }
  private static __mapResponse_mcpListUserTokens(
    response: ApiResult<Array<ProviderToken>>,
  ): ApiOkResponse<Array<ProviderToken>> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<Array<ProviderToken>>;
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
   * List user tokens
   * Retrieves a list of provider tokens for a specific user
   */
  public static mcpListUserTokens(
    client: ClientOptions,
    {
      pathParams,
      query,
    }: {
      pathParams?: {
        userId: string;
      };
      query?: {
        includeExpired?: boolean;
        provider?: string;
        scope?: string;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<Array<ProviderToken>> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<Array<ProviderToken>>(client, {
      method: "GET",
      url: "/api/users/{userId}/tokens",
      path: pathParams,
      query,
      abortSignal,
    }).then(AccessTokenManagementService.__mapResponse_mcpListUserTokens);
  }
  private static __mapResponse_mcpRevokeUserAccess(
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
   * Revoke user access
   * Revokes all access tokens for a specific user
   */
  public static mcpRevokeUserAccess(
    client: ClientOptions,
    {
      pathParams,
    }: {
      pathParams: {
        userId: string;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkEmptyResponse | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<void>(client, {
      method: "DELETE",
      url: "/api/users/{userId}/tokens",
      path: pathParams,
      abortSignal,
    }).then(AccessTokenManagementService.__mapResponse_mcpRevokeUserAccess);
  }
  private static __mapResponse_mcpRevokeProviderToken(
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
   * Revoke provider token
   * Revokes a specific provider token for a user
   */
  public static mcpRevokeProviderToken(
    client: ClientOptions,
    {
      pathParams,
    }: {
      pathParams: {
        userId: string;
        tokenId: string;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkEmptyResponse | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<void>(client, {
      method: "DELETE",
      url: "/api/users/{userId}/tokens/{tokenId}",
      path: pathParams,
      abortSignal,
    }).then(AccessTokenManagementService.__mapResponse_mcpRevokeProviderToken);
  }
}
