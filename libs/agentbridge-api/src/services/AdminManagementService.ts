/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import { ApiNetworkErrorResponse, ApiOkResponse, ApiResult, ApiUnmappedResponse } from "../core/ApiResult";
import type { CancelablePromise } from "../core/CancelablePromise";
import { ClientOptions } from "../core/OpenAPI";
import { request as __request } from "../core/request";
import type { Admin } from "../models/Admin";
import type { UpdateAdminRequest } from "../models/UpdateAdminRequest";
export class AdminManagementService {
  private static __mapResponse_adminListAdmins(
    response: ApiResult<Array<Admin>>,
  ): ApiOkResponse<Array<Admin>> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<Array<Admin>>;
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
   * List admins
   * Retrieves a list of all admins
   */
  public static adminListAdmins(
    client: ClientOptions,
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<Array<Admin>> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<Array<Admin>>(client, {
      method: "GET",
      url: "/api/admins",
      abortSignal,
    }).then(AdminManagementService.__mapResponse_adminListAdmins);
  }
  private static __mapResponse_putApiAdminsEnable(
    response: ApiResult<Admin>,
  ): ApiOkResponse<Admin> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<Admin>;
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
   * Enable/Disable admin
   * Enables or disables an admin
   */
  public static putApiAdminsEnable(
    client: ClientOptions,
    {
      pathParams,
      requestBody,
    }: {
      pathParams: {
        adminId: string;
      };
      requestBody: {
        /**
         * Whether the admin is enabled
         */
        enabled?: boolean;
        /**
         * Verification token
         */
        token?: string;
        /**
         * Whether to send a notification to the admin
         */
        sendNotification?: boolean;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<Admin> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<Admin>(client, {
      method: "PUT",
      url: "/api/admins/{adminId}/enable",
      path: pathParams,
      body: requestBody,
      mediaType: "application/json",
      abortSignal,
    }).then(AdminManagementService.__mapResponse_putApiAdminsEnable);
  }
  private static __mapResponse_postApiAdminsSendApprovedNotification(
    response: ApiResult<Admin>,
  ): ApiOkResponse<Admin> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<Admin>;
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
   * Send approved notification to admin
   * Sends an approved notification to the admin
   */
  public static postApiAdminsSendApprovedNotification(
    client: ClientOptions,
    {
      pathParams,
    }: {
      pathParams: {
        adminId: string;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<Admin> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<Admin>(client, {
      method: "POST",
      url: "/api/admins/{adminId}/send-approved-notification",
      path: pathParams,
      abortSignal,
    }).then(AdminManagementService.__mapResponse_postApiAdminsSendApprovedNotification);
  }
  private static __mapResponse_putApiAdmins(
    response: ApiResult<Admin>,
  ): ApiOkResponse<Admin> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<Admin>;
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
   * Update admin
   * Updates an admin
   */
  public static putApiAdmins(
    client: ClientOptions,
    {
      pathParams,
      requestBody,
    }: {
      pathParams: {
        adminId: string;
      };
      requestBody: UpdateAdminRequest;
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<Admin> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<Admin>(client, {
      method: "PUT",
      url: "/api/admins/{adminId}",
      path: pathParams,
      body: requestBody,
      mediaType: "application/json",
      abortSignal,
    }).then(AdminManagementService.__mapResponse_putApiAdmins);
  }
}
