/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Folder = {
  /**
   * Unique identifier of the folder
   */
  id: string;
  /**
   * Name of the folder
   */
  name: string;
  /**
   * ID of the parent folder (if nested)
   */
  parentFolderId?: string;
  /**
   * Timestamp when the folder was created
   */
  createdAt: string;
  /**
   * Timestamp when the folder was last updated
   */
  updatedAt?: string;
};
