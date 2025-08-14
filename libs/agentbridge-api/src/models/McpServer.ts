/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ServerAuthConfig } from "./ServerAuthConfig";
import type { ServerAuthType } from "./ServerAuthType";
export type McpServer = {
  /**
   * Unique identifier of the MCP server
   */
  id: string;
  /**
   * Name of the MCP server
   */
  name: string;
  /**
   * Description of the MCP server
   */
  description?: string;
  /**
   * Whether the MCP server is enabled
   */
  enabled: boolean;
  /**
   * Base URL for the MCP server
   */
  baseUrl: string;
  /**
   * Number of tools associated with the MCP server
   */
  toolCount?: number;
  /**
   * Timestamp when the MCP server was created
   */
  createdAt: string;
  /**
   * Timestamp when the MCP server was last updated
   */
  updatedAt?: string;
  /**
   * Authentication type for the server
   */
  authType?: ServerAuthType;
  /**
   * ID of the authentication configuration
   */
  authConfigId?: string | null;
  /**
   * Server authentication configuration
   */
  authConfig?: ServerAuthConfig | null;
};
