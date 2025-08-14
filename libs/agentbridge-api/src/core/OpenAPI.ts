/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiRequestOptions } from "./ApiRequestOptions";
import { ApiResult } from "./ApiResult";

type Resolver<T> = (options: ApiRequestOptions) => Promise<T>;
type Headers = Record<string, string>;

export const DEFAULT_BASE_URL = "https://app.agentpass.ai";

export interface ClientOptions {
  readonly baseUrl: string;
  readonly accessToken?: string | Resolver<string> | undefined;
  readonly headers?: Headers | Resolver<Headers> | undefined;
  readonly timeoutMsec?: number | undefined;
  readonly onBeforeRequest?: (options: ApiRequestOptions) => ApiRequestOptions | undefined | void;
  readonly onAfterRequest?: (result: ApiResult<unknown>) => ApiResult<unknown> | undefined | void;
}
