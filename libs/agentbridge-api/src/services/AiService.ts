/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import {
  ApiErrorResponse,
  ApiNetworkErrorResponse,
  ApiOkResponse,
  ApiResult,
  ApiUnmappedResponse,
} from "../core/ApiResult";
import type { CancelablePromise } from "../core/CancelablePromise";
import { ClientOptions } from "../core/OpenAPI";
import { request as __request } from "../core/request";
import type { AIChatRequest } from "../models/AIChatRequest";
import type { AICompletionRequest } from "../models/AICompletionRequest";
import type { AICompletionResponse } from "../models/AICompletionResponse";
import type { AIConfig } from "../models/AIConfig";
import type { AIGenerateObjectRequest } from "../models/AIGenerateObjectRequest";
import type { AIGenerateObjectResponse } from "../models/AIGenerateObjectResponse";
export class AiService {
  private static __mapResponse_aiChatStream(
    response: ApiResult<
      | string
      | {
          error?: string;
          message?: string;
          details?: Array<Record<string, any>>;
        }
    >,
  ):
    | ApiOkResponse<string>
    | ApiErrorResponse<400>
    | ApiErrorResponse<401>
    | ApiErrorResponse<429>
    | ApiErrorResponse<500>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<string>;
    }
    if (response.error && response.httpCode === 400) {
      return response as ApiErrorResponse<400>;
    }
    if (response.error && response.httpCode === 401) {
      return response as ApiErrorResponse<401>;
    }
    if (response.error && response.httpCode === 429) {
      return response as ApiErrorResponse<429>;
    }
    if (response.error && response.httpCode === 500) {
      return response as ApiErrorResponse<500>;
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
   * Stream chat completions
   * Streams AI chat responses based on conversation history
   */
  public static aiChatStream(
    client: ClientOptions,
    {
      requestBody,
    }: {
      requestBody: AIChatRequest;
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<
    | ApiOkResponse<string>
    | ApiErrorResponse<400>
    | ApiErrorResponse<401>
    | ApiErrorResponse<429>
    | ApiErrorResponse<500>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse
  > {
    return __request<
      | string
      | {
          error?: string;
          message?: string;
          details?: Array<Record<string, any>>;
        }
    >(client, {
      method: "POST",
      url: "/api/ai/chat",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        400: `Bad request`,
        401: `Unauthorized`,
        429: `Too many requests`,
        500: `Internal server error`,
      },
      abortSignal,
    }).then(AiService.__mapResponse_aiChatStream);
  }
  private static __mapResponse_aiGenerateCompletion(
    response: ApiResult<
      | AICompletionResponse
      | {
          error?: string;
          message?: string;
          details?: Array<Record<string, any>>;
        }
    >,
  ):
    | ApiOkResponse<AICompletionResponse>
    | ApiErrorResponse<400>
    | ApiErrorResponse<401>
    | ApiErrorResponse<429>
    | ApiErrorResponse<500>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<AICompletionResponse>;
    }
    if (response.error && response.httpCode === 400) {
      return response as ApiErrorResponse<400>;
    }
    if (response.error && response.httpCode === 401) {
      return response as ApiErrorResponse<401>;
    }
    if (response.error && response.httpCode === 429) {
      return response as ApiErrorResponse<429>;
    }
    if (response.error && response.httpCode === 500) {
      return response as ApiErrorResponse<500>;
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
   * Generate text completion
   * Generates a text completion for the given prompt
   */
  public static aiGenerateCompletion(
    client: ClientOptions,
    {
      requestBody,
    }: {
      requestBody: AICompletionRequest;
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<
    | ApiOkResponse<AICompletionResponse>
    | ApiErrorResponse<400>
    | ApiErrorResponse<401>
    | ApiErrorResponse<429>
    | ApiErrorResponse<500>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse
  > {
    return __request<
      | AICompletionResponse
      | {
          error?: string;
          message?: string;
          details?: Array<Record<string, any>>;
        }
    >(client, {
      method: "POST",
      url: "/api/ai/completion",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        400: `Bad request`,
        401: `Unauthorized`,
        429: `Too many requests`,
        500: `Internal server error`,
      },
      abortSignal,
    }).then(AiService.__mapResponse_aiGenerateCompletion);
  }
  private static __mapResponse_aiGenerateObject(
    response: ApiResult<
      | AIGenerateObjectResponse
      | {
          error?: string;
          message?: string;
          details?: Array<Record<string, any>>;
        }
    >,
  ):
    | ApiOkResponse<AIGenerateObjectResponse>
    | ApiErrorResponse<400>
    | ApiErrorResponse<401>
    | ApiErrorResponse<429>
    | ApiErrorResponse<500>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<AIGenerateObjectResponse>;
    }
    if (response.error && response.httpCode === 400) {
      return response as ApiErrorResponse<400>;
    }
    if (response.error && response.httpCode === 401) {
      return response as ApiErrorResponse<401>;
    }
    if (response.error && response.httpCode === 429) {
      return response as ApiErrorResponse<429>;
    }
    if (response.error && response.httpCode === 500) {
      return response as ApiErrorResponse<500>;
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
   * Generate structured object
   * Generates a structured object based on the provided schema
   */
  public static aiGenerateObject(
    client: ClientOptions,
    {
      requestBody,
    }: {
      requestBody: AIGenerateObjectRequest;
    },
    abortSignal?: AbortSignal,
  ): CancelablePromise<
    | ApiOkResponse<AIGenerateObjectResponse>
    | ApiErrorResponse<400>
    | ApiErrorResponse<401>
    | ApiErrorResponse<429>
    | ApiErrorResponse<500>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse
  > {
    return __request<
      | AIGenerateObjectResponse
      | {
          error?: string;
          message?: string;
          details?: Array<Record<string, any>>;
        }
    >(client, {
      method: "POST",
      url: "/api/ai/generate-object",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        400: `Bad request`,
        401: `Unauthorized`,
        429: `Too many requests`,
        500: `Internal server error`,
      },
      abortSignal,
    }).then(AiService.__mapResponse_aiGenerateObject);
  }
  private static __mapResponse_aiGetConfig(
    response: ApiResult<
      | AIConfig
      | {
          error?: string;
        }
    >,
  ):
    | ApiOkResponse<AIConfig>
    | ApiErrorResponse<401>
    | ApiErrorResponse<500>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse {
    if (!response.error && response.httpCode === 200) {
      return response as ApiOkResponse<AIConfig>;
    }
    if (response.error && response.httpCode === 401) {
      return response as ApiErrorResponse<401>;
    }
    if (response.error && response.httpCode === 500) {
      return response as ApiErrorResponse<500>;
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
   * Get AI configuration
   * Returns available AI providers and models
   */
  public static aiGetConfig(
    client: ClientOptions,
    abortSignal?: AbortSignal,
  ): CancelablePromise<
    | ApiOkResponse<AIConfig>
    | ApiErrorResponse<401>
    | ApiErrorResponse<500>
    | ApiNetworkErrorResponse
    | ApiUnmappedResponse
  > {
    return __request<
      | AIConfig
      | {
          error?: string;
        }
    >(client, {
      method: "GET",
      url: "/api/ai/config",
      errors: {
        401: `Unauthorized`,
        500: `Internal server error`,
      },
      abortSignal,
    }).then(AiService.__mapResponse_aiGetConfig);
  }
}
