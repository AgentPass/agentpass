/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TenantRole } from "./TenantRole";
export type UserTenant = {
  /**
   * Unique identifier of the tenant
   */
  id: string;
  /**
   * Name of the tenant
   */
  name: string;
  /**
   * Description of the tenant
   */
  description?: string | null;
  /**
   * Role of the user in this tenant
   */
  role: TenantRole;
  /**
   * Timestamp when the user joined this tenant
   */
  joinedAt: string;
};
