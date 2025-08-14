/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Header } from "./Header";
import type { ResponseContent } from "./ResponseContent";
export type Response = {
  /**
   * HTTP status code
   */
  statusCode: number;
  /**
   * Description of the response
   */
  description?: string;
  content?: Record<string, ResponseContent>;
  headers?: Record<string, Header>;
};
