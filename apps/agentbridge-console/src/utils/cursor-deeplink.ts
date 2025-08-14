/**
 * Utility functions for generating Cursor deeplinks for MCP server installation
 */

export interface McpServerConfig {
  url: string;
}

/**
 * Creates an MCP server configuration object for Cursor
 */
export function createMcpConfig(serverUrl: string): McpServerConfig {
  return {
    url: serverUrl,
  };
}

/**
 * Generates a Cursor deeplink URL for MCP server installation
 */
export function generateCursorDeeplink(serverName: string, serverUrl: string): string {
  const config = createMcpConfig(serverUrl);
  const configJson = JSON.stringify(config);
  const encodedConfig = btoa(configJson);

  const params = new URLSearchParams({
    name: serverName,
    config: encodedConfig,
  });

  return `cursor://anysphere.cursor-deeplink/mcp/install?${params.toString()}`;
}

/**
 * Opens a Cursor deeplink in the browser (which will trigger Cursor if installed)
 */
export function openCursorDeeplink(serverName: string, serverUrl: string): void {
  const deeplinkUrl = generateCursorDeeplink(serverName, serverUrl);
  window.open(deeplinkUrl, "_self");
}
