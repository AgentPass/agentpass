/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ToolRunResult = {
  /**
   * Indicates if the tool execution resulted in an error
   */
  isError: boolean;
  /**
   * Execution time in milliseconds
   */
  runtimeMs: number;
  /**
   * Possibly formatted or raw contents of the response
   */
  content: string;
};
