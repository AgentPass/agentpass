/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Workflow = {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  enabled: boolean;
  /**
   * Workflow definition including nodes, edges, and metadata
   */
  definition: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastExecutedAt?: string;
  executionCount: number;
};
