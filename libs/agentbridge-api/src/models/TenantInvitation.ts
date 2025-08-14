/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TenantRole } from "./TenantRole";
export type TenantInvitation = {
  /**
   * Unique identifier of the invitation
   */
  id: string;
  /**
   * Email address of the invited user
   */
  email: string;
  /**
   * Role that will be assigned to the user
   */
  role: TenantRole;
  /**
   * Current status of the invitation
   */
  status: TenantInvitation.status;
  invitedBy: {
    /**
     * ID of the admin who sent the invitation
     */
    id: string;
    /**
     * Email of the admin who sent the invitation
     */
    email: string;
    /**
     * Name of the admin who sent the invitation
     */
    name?: string | null;
  };
  /**
   * Name of the tenant the user joined
   */
  tenantName?: string;
  acceptedBy?: {
    /**
     * ID of the user who accepted the invitation
     */
    id: string;
    /**
     * Email of the user who accepted the invitation
     */
    email: string;
    /**
     * Name of the user who accepted the invitation
     */
    name?: string | null;
  } | null;
  /**
   * Timestamp when the invitation expires
   */
  expiresAt: string;
  /**
   * Timestamp when the invitation was created
   */
  createdAt: string;
};
export namespace TenantInvitation {
  /**
   * Current status of the invitation
   */
  export enum status {
    PENDING = "pending",
    ACCEPTED = "accepted",
    EXPIRED = "expired",
    CANCELLED = "cancelled",
  }
}
