/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AdminRole } from "./AdminRole";
import type { Tenant } from "./Tenant";
export type Admin = {
  /**
   * Unique identifier of the admin
   */
  id: string;
  /**
   * Email address of the admin
   */
  email: string;
  /**
   * Tenant this admin belongs to
   */
  tenant: Tenant;
  /**
   * Display name of the admin
   */
  name?: string | null;
  /**
   * Always true for admin users
   */
  admin: boolean;
  /**
   * URL of the admin's profile picture
   */
  picture?: string | null;
  /**
   * Whether the admin is enabled
   */
  enabled: boolean;
  /**
   * Role of the admin
   */
  role: AdminRole;
  /**
   * Timestamp when the admin was created
   */
  createdAt: string;
};
