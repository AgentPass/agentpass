/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import { ApiNetworkErrorResponse, ApiOkResponse, ApiResult, ApiUnmappedResponse } from "../core/ApiResult";
import type { CancelablePromise } from "../core/CancelablePromise";
import { ClientOptions } from "../core/OpenAPI";
import { request as __request } from "../core/request";
export class WaitlistService {
  private static __mapResponse_adminAddToWaitlist(
    response: ApiResult<{
      /**
       * Confirmation message
       */
      message?: string;
    }>,
  ):
    | ApiOkResponse<{
        /**
         * Confirmation message
         */
        message?: string;
      }>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<{
        /**
         * Confirmation message
         */
        message?: string;
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
   * Add user to waitlist
   * Adds a user to the waitlist for accessing the console
   */
  public static adminAddToWaitlist(
    client: ClientOptions,
    {
      requestBody,
    }: {
      requestBody: {
        /**
         * Email address of the user to add to the waitlist
         */
        email: string;
        /**
         * Whether this user discovered the easter egg and should bypass the waitlist
         */
        easterEggBypass?: boolean;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<
    | ApiOkResponse<{
        /**
         * Confirmation message
         */
        message?: string;
      }>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse
  > {
    return __request<{
      /**
       * Confirmation message
       */
      message?: string;
    }>(client, {
      method: "POST",
      url: "/api/admins/waitlist",
      body: requestBody,
      mediaType: "application/json",
      abortSignal,
    }).then(WaitlistService.__mapResponse_adminAddToWaitlist);
  }
}
