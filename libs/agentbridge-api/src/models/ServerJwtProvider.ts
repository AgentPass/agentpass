/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ServerJwtProvider = {
  /**
   * Unique identifier of the JWT provider
   */
  id: string;
  /**
   * ID of the server this provider belongs to
   */
  serverId: string;
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
  enabled: boolean;
  /**
   * Timestamp when the provider was created
   */
  createdAt: string;
  /**
   * Timestamp when the provider was last updated
   */
  updatedAt: string;
};
