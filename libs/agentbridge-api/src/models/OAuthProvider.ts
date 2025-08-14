/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type OAuthProvider = {
  /**
   * Unique identifier of the OAuth provider
   */
  id: string;
  /**
   * Name of the OAuth provider
   */
  name: string;
  /**
   * Client ID for the OAuth provider
   */
  clientId: string;
  /**
   * Authorization URL for the OAuth provider
   */
  authorizationUrl: string;
  /**
   * Token URL for the OAuth provider
   */
  tokenUrl: string;
  /**
   * Scopes supported by the OAuth provider
   */
  scopes?: Array<string>;
  /**
   * Content type for the API call
   */
  contentType?: string;
  /**
   * Refresh URL for the OAuth provider
   */
  refreshUrl?: string;
  /**
   * Timestamp when the OAuth provider was created
   */
  createdAt: string;
  /**
   * Timestamp when the OAuth provider was last updated
   */
  updatedAt?: string;
};
