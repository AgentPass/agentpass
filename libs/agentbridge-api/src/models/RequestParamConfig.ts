/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ParameterLocation } from "./ParameterLocation";
/**
 * Configuration for a request parameter override
 */
export type RequestParamConfig = {
  /**
   * The template or static value for the parameter
   */
  value: string;
  /**
   * Where to send the parameter in the request
   */
  location: ParameterLocation;
};
