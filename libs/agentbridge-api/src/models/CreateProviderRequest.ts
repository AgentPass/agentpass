/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateProviderRequest = {
  /**
   * Name of the OAuth provider
   */
  name: string;
  /**
   * Client ID for the OAuth provider
   */
  clientId: string;
  /**
   * Client secret for the OAuth provider
   */
  clientSecret?: string;
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
};
