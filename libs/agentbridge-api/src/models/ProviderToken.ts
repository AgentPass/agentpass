/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ProviderToken = {
  /**
   * Unique identifier of the token
   */
  id: string;
  /**
   * ID of the OAuth provider
   */
  providerId: string;
  /**
   * Name of the OAuth provider
   */
  providerName: string;
  /**
   * Timestamp when the token was issued
   */
  issuedAt: string;
  /**
   * Timestamp when the token expires
   */
  expiresAt?: string;
  /**
   * Scopes associated with the token
   */
  scopes?: Array<string>;
};
