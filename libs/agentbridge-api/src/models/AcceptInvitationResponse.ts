/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TenantRole } from "./TenantRole";
export type AcceptInvitationResponse = {
  /**
   * ID of the tenant the user joined
   */
  tenantId: string;
  /**
   * Name of the tenant the user joined
   */
  tenantName: string;
  /**
   * Role assigned to the user in the tenant
   */
  role: TenantRole;
};
