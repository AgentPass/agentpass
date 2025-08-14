/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AIServiceConfig } from "./AIServiceConfig";
export type AIGenerateObjectRequest = {
  prompt: string;
  /**
   * JSON schema definition for the object to generate
   */
  schema: Record<string, any>;
  config?: AIServiceConfig;
};
