// JSON-RPC 2.0 Error Codes per specification
// https://www.jsonrpc.org/specification#error_object

// Standard JSON-RPC 2.0 error codes (-32768 to -32000)
export const JSONRPC_INTERNAL_ERROR = -32603; // Internal JSON-RPC error
export const JSONRPC_METHOD_NOT_ALLOWED = -32000; // Method not allowed

// Custom application error codes
export const APP_INSUFFICIENT_PERMISSIONS = -33001; // Authorization error
export const APP_INVALID_SERVER = -33003; // Invalid server ID
export const APP_USER_NOT_FOUND = -33100; // User not found, should re-auth
export const APP_BAD_REQUEST = -33400; // Bad request

// Interface for JSON-RPC 2.0 error response
export interface JsonRpcErrorResponse {
  jsonrpc: string;
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
  id: unknown;
}

// Interface for regular error response
export interface ErrorResponse {
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export class OAuthError extends Error {
  statusCode: number;
  errorCode: string;

  constructor(message: string, statusCode: number, errorCode: string) {
    super(message);
    this.name = "OAuthError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}
