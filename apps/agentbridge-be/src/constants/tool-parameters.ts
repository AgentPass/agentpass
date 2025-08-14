import { WithServerIdRequest } from "../utils/req-guards.js";

/**
 * Request context for parameter extraction
 */
interface RequestContext {
  hasUserAuth: boolean;
  serverAuth?: {
    userContext?: {
      originalToken?: string;
    };
  };
}

/**
 * Configuration for context parameters that are automatically injected into tool calls
 */
export interface ContextParameter {
  readonly key: string;
  readonly description: string;
  readonly source: "request" | "user" | "server";
  readonly condition?: (context: RequestContext) => boolean;
}

/**
 * Available context parameters that can be injected into tool calls
 */
export const CONTEXT_PARAMETERS: Record<string, ContextParameter> = {
  JWT: {
    key: "jwt",
    description: "JWT token from request Authorization header",
    source: "request",
    condition: (context) => !context.hasUserAuth && !!context.serverAuth?.userContext?.originalToken,
  },
} as const;

/**
 * Extract context parameters from request and add to call parameters
 */
export function injectContextParameters(
  req: WithServerIdRequest,
  callParameters: Record<string, unknown>,
  hasUserAuth: boolean,
): void {
  const context: RequestContext = {
    hasUserAuth,
    serverAuth: "serverAuth" in req ? req.serverAuth : undefined,
  };

  Object.values(CONTEXT_PARAMETERS).forEach((param) => {
    if (!param.condition || param.condition(context)) {
      const value = extractParameterValue(req, param, hasUserAuth);
      if (value !== undefined) {
        callParameters[param.key] = value;
      }
    }
  });
}

function extractParameterValue(req: WithServerIdRequest, param: ContextParameter, hasUserAuth: boolean): unknown {
  switch (param.key) {
    case "jwt":
      return !hasUserAuth && "serverAuth" in req && req.serverAuth?.userContext?.originalToken;
    default:
      return undefined;
  }
}
