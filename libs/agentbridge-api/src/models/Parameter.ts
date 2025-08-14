/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ParameterLocation } from "./ParameterLocation";
export type Parameter = {
  /**
   * Name of the parameter
   */
  name: string;
  schema: {
    /**
     * Data type of the parameter
     */
    type: Parameter.type;
    /**
     * Description of the parameter
     */
    description?: string;
    /**
     * Enumerated values for the parameter
     */
    enum?: Array<string>;
    /**
     * Schema for array items (if type is 'array')
     */
    items?: {
      type?: Parameter.type;
      /**
       * Nested object properties (used if item type is object)
       */
      properties?: Record<string, any>;
    };
    /**
     * Nested properties (used if type is 'object')
     */
    properties?: Record<string, any>;
  };
  /**
   * Description of the parameter
   */
  description?: string;
  /**
   * Whether the parameter is required
   */
  required?: boolean;
  /**
   * Default value for the parameter
   */
  default?: string;
  /**
   * Enumerated values for the parameter
   */
  enum?: Array<string>;
  /**
   * Format of the parameter (e.g., date, email, uri)
   */
  format?: string;
  in: ParameterLocation;
};
export namespace Parameter {
  /**
   * Data type of the parameter
   */
  export enum type {
    STRING = "string",
    NUMBER = "number",
    BOOLEAN = "boolean",
    ARRAY = "array",
    OBJECT = "object",
  }
}
