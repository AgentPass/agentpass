/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import { ApiNetworkErrorResponse, ApiOkResponse, ApiResult, ApiUnmappedResponse } from "../core/ApiResult";
import type { CancelablePromise } from "../core/CancelablePromise";
import { ClientOptions } from "../core/OpenAPI";
import { request as __request } from "../core/request";
import type { Pagination } from "../models/Pagination";
import type { Workflow } from "../models/Workflow";
export class WorkflowManagementService {
  private static __mapResponse_workflowList(
    response: ApiResult<{
      data?: Array<Workflow>;
      pagination?: Pagination;
    }>,
  ):
    | ApiOkResponse<{
        data?: Array<Workflow>;
        pagination?: Pagination;
      }>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<{
        data?: Array<Workflow>;
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
   * List workflows
   * Retrieves a list of all workflows for the authenticated tenant
   */
  public static workflowList(
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
        data?: Array<Workflow>;
        pagination?: Pagination;
      }>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse
  > {
    return __request<{
      data?: Array<Workflow>;
      pagination?: Pagination;
    }>(client, {
      method: "GET",
      url: "/api/workflows",
      query,
      abortSignal,
    }).then(WorkflowManagementService.__mapResponse_workflowList);
  }
  private static __mapResponse_workflowGet(
    response: ApiResult<Workflow>,
  ): ApiOkResponse<Workflow> | ApiNetworkErrorResponse | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<Workflow>;
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
   * Get workflow
   * Retrieves a specific workflow by ID
   */
  public static workflowGet(
    client: ClientOptions,
    {
      pathParams,
    }: {
      pathParams: {
        workflowId: string;
      };
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<ApiOkResponse<Workflow> | ApiNetworkErrorResponse | ApiUnmappedResponse> {
    return __request<Workflow>(client, {
      method: "GET",
      url: "/api/workflows/{workflowId}",
      path: pathParams,
      abortSignal,
    }).then(WorkflowManagementService.__mapResponse_workflowGet);
  }
}
