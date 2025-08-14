/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TenantRole } from "./TenantRole";
export type TenantUser = {
  /**
   * Unique identifier of the user
   */
  id: string;
  /**
   * Email address of the user
   */
  email: string;
  /**
   * Display name of the user
   */
  name?: string | null;
  /**
   * Role of the user in the tenant
   */
  role: TenantRole;
  /**
   * Timestamp when the user joined the tenant
   */
  createdAt: string;
  /**
   * Timestamp when the user was last updated
   */
  updatedAt: string;
};
