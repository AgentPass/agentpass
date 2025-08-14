/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FormattingConfig } from "./FormattingConfig";
import type { HttpMethod } from "./HttpMethod";
import type { Parameter } from "./Parameter";
import type { RequestParamConfig } from "./RequestParamConfig";
export type CreateToolRequest = {
  /**
   * Name of the tool
   */
  name: string;
  /**
   * Description of the tool
   */
  description: string;
  /**
   * ID of the folder to contain the tool
   */
  folderId?: string | null;
  /**
   * Input parameters for the tool
   */
  parameters?: Record<string, Parameter>;
  /**
   * HTTP method for the API call
   */
  method?: HttpMethod;
  /**
   * URL for the API call
   */
  url?: string;
  /**
   * ID of the OAuth provider to use for authentication
   */
  oAuthProviderId?: string | null;
  /**
   * ID of the API key provider to use for authentication
   */
  apiKeyProviderId?: string | null;
  /**
   * Response formatting configuration
   */
  responseFormatting?: FormattingConfig;
  /**
   * Overrides for request parameters, with parameter names as keys and configuration objects
   */
  requestParameterOverrides?: Record<string, RequestParamConfig> | null;
};
