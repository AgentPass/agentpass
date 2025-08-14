import { clearUser, getUser } from "@/contexts/auth-context.tsx";
import { log } from "@/utils/log.ts";
import { ApiCreatedResponse, ApiOkResponse, ApiResult, ClientOptions } from "@agentbridge/api";

type ApiRequestOptions = ReturnType<NonNullable<ClientOptions["onBeforeRequest"]>>;

const baseUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;
log.debug("Will work with API URL", baseUrl);

export const ServerIdBackendUrl = (serverId: string) =>
  import.meta.env.VITE_BACKEND_URL || window.location.origin.replace("://", `://${serverId}.`).replace("app", "server");

export const ApiClientOptions: ClientOptions = {
  baseUrl,
  timeoutMsec: 5 * 1000,
  onBeforeRequest: (options: ApiRequestOptions): ApiRequestOptions => {
    const user = getUser();
    if (user) {
      return {
        ...options,
        headers: {
          ...(options!.headers || {}),
          "ngrok-skip-browser-warning": "69420",
          Authorization: `Bearer ${user.accessToken}`,
        },
      } as ApiRequestOptions;
    }
    return options;
  },
  onAfterRequest: (result: ApiResult<unknown>) => {
    if (result.error && result.httpCode === 401) {
      log.debug("Session expired, redirecting to login", result);
      log.error("Your session has expired. Please log in again.");
      clearUser();
      window.location.href = "/login";
    }
  },
};

log.info("API Client Options", { ApiClientOptions });

export const apiCallSucceeded = <T>(result: ApiResult<T>): result is ApiOkResponse<T> | ApiCreatedResponse<T> =>
  !result.error;

export const apiResultToError = (result: ApiResult<unknown> & { error: unknown }) =>
  new Error(
    result.httpCode === 0
      ? "Network error"
      : ((result.body as { error?: string } | undefined)?.error ??
        `API call to ${result.url} failed with code ${result.httpCode}`),
  );
