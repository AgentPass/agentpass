/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateServerJwtProviderRequest = {
  /**
   * Name of the JWT provider
   */
  name: string;
  /**
   * URL to fetch JWKS keys from
   */
  jwksUrl: string;
  /**
   * Whether the JWT provider is enabled
   */
  enabled?: boolean;
};
