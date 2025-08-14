/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AIServiceConfig } from "./AIServiceConfig";
export type AICompletionRequest = {
  prompt: string;
  config?: AIServiceConfig;
  /**
   * Enable web search capabilities for enhanced information retrieval
   */
  enableWebSearch?: boolean;
};
