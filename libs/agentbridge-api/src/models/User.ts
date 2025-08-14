/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type User = {
  /**
   * Unique identifier of the user
   */
  id: string;
  /**
   * Email address of the user
   */
  email: string;
  /**
   * Whether the user is enabled
   */
  enabled: boolean;
  /**
   * URL of the user's profile picture (if available)
   */
  picture?: string;
  /**
   * Timestamp when the user was created
   */
  createdAt: string;
};
