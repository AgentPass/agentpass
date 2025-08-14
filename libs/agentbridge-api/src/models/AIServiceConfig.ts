/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AIServiceConfig = {
  /**
   * AI provider to use
   */
  provider?: AIServiceConfig.provider;
  /**
   * Specific model to use (optional)
   */
  model?: string;
  /**
   * Sampling temperature
   */
  temperature?: number;
  /**
   * Maximum tokens to generate
   */
  maxTokens?: number;
  /**
   * Top-p sampling parameter
   */
  topP?: number;
};
export namespace AIServiceConfig {
  /**
   * AI provider to use
   */
  export enum provider {
    OPENAI = "openai",
    ANTHROPIC = "anthropic",
  }
}
