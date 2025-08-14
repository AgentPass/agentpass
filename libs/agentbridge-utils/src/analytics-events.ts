/**
 * Centralized analytics event names following the pattern: <entity>.<action>.<status>
 */

export const AnalyticsEvents = {
  // Authentication & Authorization Events
  ADMIN_LOGIN_ATTEMPTED: "admin.login.attempted",
  ADMIN_LOGIN_SUCCESS: "admin.login.success",
  ADMIN_LOGIN_FAILED: "admin.login.failed",
  ADMIN_LOGOUT_COMPLETED: "admin.logout.completed",
  ADMIN_SESSION_STARTED: "admin.session.started",
  ADMIN_ACCOUNT_ACTIVATED: "admin.account.activated",
  ADMIN_PERMISSION_DENIED: "admin.permission.denied",
  ADMIN_VERIFICATION_FAILED: "admin.verification.failed",
  ADMIN_VERIFICATION_SUCCESS: "admin.verification.success",
  ADMIN_ENABLED: "admin.enable",
  ADMIN_DISABLED: "admin.disable",
  ADMIN_UPDATED: "admin.update",

  // Waitlist Management Events
  WAITLIST_SIGNUP_SUBMITTED: "waitlist.signup.submitted",

  // MCP Server Management Events
  MCP_SERVER_CREATE_COMPLETED: "mcp.server.create.completed",
  MCP_SERVER_CREATE_FAILED: "mcp.server.create.failed",
  MCP_EXAMPLE_SERVER_CREATE_COMPLETED: "mcp.example.server.create.completed",
  MCP_EXAMPLE_SERVER_CREATE_FAILED: "mcp.example.server.create.failed",

  // Tool Management Events
  MCP_TOOL_CREATE_COMPLETED: "mcp.tool.create.completed",
  MCP_TOOL_CREATE_FAILED: "mcp.tool.create.failed",
  MCP_TOOL_UPDATE_COMPLETED: "mcp.tool.update.completed",

  // Node Management Events
  MCP_NODE_DELETED: "mcp.node.deleted",

  // Tool Execution Events
  MCP_TOOL_EXECUTION_API_CALL: "mcp.tool.execution.api_call",
  MCP_TOOL_PLAYGROUND_OPENED: "mcp.tool.playground.opened",

  // Analytics View Events
  MCP_ANALYTICS_VIEWED: "mcp.analytics.viewed",

  // Tenant Management Events
  TENANT_INVITATION_SENT: "tenant.invitation.sent",
  TENANT_INVITATION_ACCEPTED: "tenant.invitation.accepted",
  TENANT_INVITATION_CANCELLED: "tenant.invitation.cancelled",
  TENANT_USER_REMOVED_SUCCESS: "tenant.user.removed.success",
  TENANT_USER_REMOVED_FAILURE: "tenant.user.remove.failure",
  TENANT_USER_ROLE_UPDATE_SUCCESS: "tenant.user.role.update.success",
  TENANT_USER_ROLE_UPDATE_FAILURE: "tenant.user.role.update.failure",

  // OAuth Provider Events
  OAUTH_PROVIDER_CREATED: "oauth.provider.created",
  OAUTH_FLOW_STARTED: "oauth.flow.started",
  OAUTH_FLOW_COMPLETED: "oauth.flow.completed",
  OAUTH_FLOW_UPDATE: "oauth.flow.update",
  OAUTH_FLOW_DROP: "oauth.flow.drop",
  OAUTH_FLOW_SELECTED: "oauth.flow.selected",

  // User Management Events
  USER_ACCESS_BLOCKED: "user.access.blocked",
  USER_ACCESS_REVOKED: "user.access.revoked",
  USER_TOKEN_REVOKED: "user.token.revoked",
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];
