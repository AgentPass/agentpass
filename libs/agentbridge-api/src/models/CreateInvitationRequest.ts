/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TenantRole } from "./TenantRole";
export type CreateInvitationRequest = {
  /**
   * Email address of the user to invite
   */
  email: string;
  /**
   * Role to assign to the invited user
   */
  role: TenantRole;
};
