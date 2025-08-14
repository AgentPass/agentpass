/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ServerAuthType } from "./ServerAuthType";
export type UpdateServerAuthConfigRequest = {
  /**
   * Type of authentication to use
   */
  authType: ServerAuthType;
  /**
   * ID of the JWT provider (if using JWT auth)
   */
  jwtProviderId?: string | null;
};
