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
import type { AcceptInvitationRequest } from "../models/AcceptInvitationRequest";
import type { AcceptInvitationResponse } from "../models/AcceptInvitationResponse";
import type { CreateInvitationRequest } from "../models/CreateInvitationRequest";
import type { TenantInvitation } from "../models/TenantInvitation";
import type { TenantRole } from "../models/TenantRole";
import type { TenantUser } from "../models/TenantUser";
import type { UpdateUserRoleRequest } from "../models/UpdateUserRoleRequest";
import type { UserTenant } from "../models/UserTenant";
export class TenantManagementService {
  private static __mapResponse_tenantListUsers(
    response: ApiResult<Array<TenantUser>>,
  ): ApiOkResponse<Array<TenantUser>> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<Array<TenantUser>>;
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
   * List tenant users
   * Retrieves a list of all users in the current tenant
   */
  public static tenantListUsers(
    client: ClientOptions,
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<Array<TenantUser>> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<Array<TenantUser>>(client, {
      method: "GET",
      url: "/api/tenant/users",
      abortSignal,
    }).then(TenantManagementService.__mapResponse_tenantListUsers);
  }
  private static __mapResponse_tenantListInvitations(
    response: ApiResult<Array<TenantInvitation>>,
  ): ApiOkResponse<Array<TenantInvitation>> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<Array<TenantInvitation>>;
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
   * List tenant invitations
   * Retrieves a list of all invitations for the current tenant
   */
  public static tenantListInvitations(
    client: ClientOptions,
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<Array<TenantInvitation>> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<Array<TenantInvitation>>(client, {
      method: "GET",
      url: "/api/tenant/invitations",
      abortSignal,
    }).then(TenantManagementService.__mapResponse_tenantListInvitations);
  }
  private static __mapResponse_tenantCreateInvitation(
    response: ApiResult<TenantInvitation>,
  ): ApiCreatedResponse<TenantInvitation> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 201) {
      return response as ApiCreatedResponse<TenantInvitation>;
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
   * Create invitation
   * Creates a new invitation to join the tenant
   */
  public static tenantCreateInvitation(
    client: ClientOptions,
    {
      requestBody,
    }: {
      requestBody: CreateInvitationRequest;
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiCreatedResponse<TenantInvitation> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<TenantInvitation>(client, {
      method: "POST",
      url: "/api/tenant/invitations",
      body: requestBody,
      mediaType: "application/json",
      abortSignal,
    }).then(TenantManagementService.__mapResponse_tenantCreateInvitation);
  }
  private static __mapResponse_getInvitationByToken(
    response: ApiResult<{
      /**
       * Unique identifier of the invitation
       */
      id: string;
      /**
       * Email address of the invited user
       */
      email: string;
      /**
       * Role that will be assigned to the user
       */
      role: TenantRole;
      /**
       * Current status of the invitation
       */
      status: "pending" | "accepted" | "expired" | "cancelled";
      /**
       * Name of the tenant
       */
      tenantName: string;
      invitedBy: {
        /**
         * ID of the admin who sent the invitation
         */
        id: string;
        /**
         * Email of the admin who sent the invitation
         */
        email: string;
        /**
         * Name of the admin who sent the invitation
         */
        name?: string | null;
      };
      /**
       * Timestamp when the invitation expires
       */
      expiresAt: string;
      /**
       * Timestamp when the invitation was created
       */
      createdAt: string;
    }>,
  ):
    | ApiOkResponse<{
        /**
         * Unique identifier of the invitation
         */
        id: string;
        /**
         * Email address of the invited user
         */
        email: string;
        /**
         * Role that will be assigned to the user
         */
        role: TenantRole;
        /**
         * Current status of the invitation
         */
        status: "pending" | "accepted" | "expired" | "cancelled";
        /**
         * Name of the tenant
         */
        tenantName: string;
        invitedBy: {
          /**
           * ID of the admin who sent the invitation
           */
          id: string;
          /**
           * Email of the admin who sent the invitation
           */
          email: string;
          /**
           * Name of the admin who sent the invitation
           */
          name?: string | null;
        };
        /**
         * Timestamp when the invitation expires
         */
        expiresAt: string;
        /**
         * Timestamp when the invitation was created
         */
        createdAt: string;
      }>
    | ApiErrorResponse<400>
    | ApiErrorResponse<404>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<{
        /**
         * Unique identifier of the invitation
         */
        id: string;
        /**
         * Email address of the invited user
         */
        email: string;
        /**
         * Role that will be assigned to the user
         */
        role: TenantRole;
        /**
         * Current status of the invitation
         */
        status: "pending" | "accepted" | "expired" | "cancelled";
        /**
         * Name of the tenant
         */
        tenantName: string;
        invitedBy: {
          /**
           * ID of the admin who sent the invitation
           */
          id: string;
          /**
           * Email of the admin who sent the invitation
           */
          email: string;
          /**
           * Name of the admin who sent the invitation
           */
          name?: string | null;
        };
        /**
         * Timestamp when the invitation expires
         */
        expiresAt: string;
        /**
         * Timestamp when the invitation was created
         */
        createdAt: string;
      }>;
    }
    if (response.error && response.httpCode === 400) {
      return response as ApiErrorResponse<400>;
    }
    if (response.error && response.httpCode === 404) {
      return response as ApiErrorResponse<404>;
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
   * Get invitation by token
   * Retrieves invitation details by token (public endpoint)
   */
  public static getInvitationByToken(
    client: ClientOptions,
    {
      pathParams,
    }: {
      pathParams: {
        token: string;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<
    | ApiOkResponse<{
        /**
         * Unique identifier of the invitation
         */
        id: string;
        /**
         * Email address of the invited user
         */
        email: string;
        /**
         * Role that will be assigned to the user
         */
        role: TenantRole;
        /**
         * Current status of the invitation
         */
        status: "pending" | "accepted" | "expired" | "cancelled";
        /**
         * Name of the tenant
         */
        tenantName: string;
        invitedBy: {
          /**
           * ID of the admin who sent the invitation
           */
          id: string;
          /**
           * Email of the admin who sent the invitation
           */
          email: string;
          /**
           * Name of the admin who sent the invitation
           */
          name?: string | null;
        };
        /**
         * Timestamp when the invitation expires
         */
        expiresAt: string;
        /**
         * Timestamp when the invitation was created
         */
        createdAt: string;
      }>
    | ApiErrorResponse<400>
    | ApiErrorResponse<404>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse
  > {
    return __request<{
      /**
       * Unique identifier of the invitation
       */
      id: string;
      /**
       * Email address of the invited user
       */
      email: string;
      /**
       * Role that will be assigned to the user
       */
      role: TenantRole;
      /**
       * Current status of the invitation
       */
      status: "pending" | "accepted" | "expired" | "cancelled";
      /**
       * Name of the tenant
       */
      tenantName: string;
      invitedBy: {
        /**
         * ID of the admin who sent the invitation
         */
        id: string;
        /**
         * Email of the admin who sent the invitation
         */
        email: string;
        /**
         * Name of the admin who sent the invitation
         */
        name?: string | null;
      };
      /**
       * Timestamp when the invitation expires
       */
      expiresAt: string;
      /**
       * Timestamp when the invitation was created
       */
      createdAt: string;
    }>(client, {
      method: "GET",
      url: "/api/tenant/invitations/{token}",
      path: pathParams,
      errors: {
        400: `Invalid token or invitation expired`,
        404: `Invitation not found`,
      },
      abortSignal,
    }).then(TenantManagementService.__mapResponse_getInvitationByToken);
  }
  private static __mapResponse_acceptInvitation(
    response: ApiResult<
      | AcceptInvitationResponse
      | {
          /**
           * Error message
           */
          error?: string;
        }
    >,
  ):
    | ApiOkResponse<AcceptInvitationResponse>
    | ApiErrorResponse<400>
    | ApiErrorResponse<404>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<AcceptInvitationResponse>;
    }
    if (response.error && response.httpCode === 400) {
      return response as ApiErrorResponse<400>;
    }
    if (response.error && response.httpCode === 404) {
      return response as ApiErrorResponse<404>;
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
   * Accept invitation
   * Accepts a tenant invitation and creates a new user account
   */
  public static acceptInvitation(
    client: ClientOptions,
    {
      requestBody,
    }: {
      requestBody: AcceptInvitationRequest;
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<
    | ApiOkResponse<AcceptInvitationResponse>
    | ApiErrorResponse<400>
    | ApiErrorResponse<404>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse
  > {
    return __request<
      | AcceptInvitationResponse
      | {
          /**
           * Error message
           */
          error?: string;
        }
    >(client, {
      method: "POST",
      url: "/api/tenant/invitations/accept",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        400: `Invalid token or invitation expired`,
        404: `Invitation not found`,
      },
      abortSignal,
    }).then(TenantManagementService.__mapResponse_acceptInvitation);
  }
  private static __mapResponse_tenantUpdateUserRole(
    response: ApiResult<TenantUser>,
  ): ApiOkResponse<TenantUser> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<TenantUser>;
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
   * Update user role
   * Updates the role of a user in the tenant
   */
  public static tenantUpdateUserRole(
    client: ClientOptions,
    {
      pathParams,
      requestBody,
    }: {
      pathParams: {
        userId: string;
      };
      requestBody: UpdateUserRoleRequest;
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<TenantUser> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<TenantUser>(client, {
      method: "PUT",
      url: "/api/tenant/users/{userId}/role",
      path: pathParams,
      body: requestBody,
      mediaType: "application/json",
      abortSignal,
    }).then(TenantManagementService.__mapResponse_tenantUpdateUserRole);
  }
  private static __mapResponse_tenantRemoveUser(
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
   * Remove user from tenant
   * Removes a user from the tenant
   */
  public static tenantRemoveUser(
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
      url: "/api/tenant/users/{userId}",
      path: pathParams,
      abortSignal,
    }).then(TenantManagementService.__mapResponse_tenantRemoveUser);
  }
  private static __mapResponse_tenantCancelInvitation(
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
   * Cancel invitation
   * Cancels a pending invitation
   */
  public static tenantCancelInvitation(
    client: ClientOptions,
    {
      pathParams,
    }: {
      pathParams: {
        invitationId: string;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkEmptyResponse | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<void>(client, {
      method: "DELETE",
      url: "/api/tenant/invitations/{invitationId}",
      path: pathParams,
      abortSignal,
    }).then(TenantManagementService.__mapResponse_tenantCancelInvitation);
  }
  private static __mapResponse_tenantGetUserTenants(
    response: ApiResult<Array<UserTenant>>,
  ): ApiOkResponse<Array<UserTenant>> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<Array<UserTenant>>;
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
   * Get user tenants
   * Retrieves all tenants that the current user belongs to
   */
  public static tenantGetUserTenants(
    client: ClientOptions,
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<Array<UserTenant>> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<Array<UserTenant>>(client, {
      method: "GET",
      url: "/api/tenant/user/tenants",
      abortSignal,
    }).then(TenantManagementService.__mapResponse_tenantGetUserTenants);
  }
}
