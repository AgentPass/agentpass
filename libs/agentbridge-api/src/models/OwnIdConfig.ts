/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type OwnIdConfig = {
  /**
   * Unique identifier of the OwnID application
   */
  appId?: string;
  /**
   * Environment name
   */
  env?: OwnIdConfig.env;
};
export namespace OwnIdConfig {
  /**
   * Environment name
   */
  export enum env {
    PROD = "prod",
    UAT = "uat",
    DEV = "dev",
  }
}
