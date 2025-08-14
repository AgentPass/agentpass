/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ServerAuthType } from "./ServerAuthType";
import type { ServerJwtProvider } from "./ServerJwtProvider";
export type ServerAuthConfig = {
  /**
   * Unique identifier of the auth configuration
   */
  id: string;
  /**
   * ID of the server this configuration belongs to
   */
  serverId: string;
  /**
   * Type of authentication to use
   */
  authType: ServerAuthType;
  /**
   * ID of the JWT provider (if using JWT auth)
   */
  jwtProviderId?: string | null;
  /**
   * JWT provider configuration
   */
  jwtProvider?: ServerJwtProvider | null;
  /**
   * Timestamp when the configuration was created
   */
  createdAt: string;
  /**
   * Timestamp when the configuration was last updated
   */
  updatedAt: string;
};
