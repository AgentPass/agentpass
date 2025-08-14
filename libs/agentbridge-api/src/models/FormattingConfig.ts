/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Configuration for formatting API responses and requests
 */
export type FormattingConfig = {
  /**
   * Template for formatting the entire response
   */
  template?: string;
  /**
   * Template for formatting individual items in a collection
   */
  itemTemplate?: string;
  /**
   * Header text to display before the results
   */
  header?: string;
  /**
   * Text to display when the result is empty
   */
  emptyResult?: string;
  /**
   * Separator between items in a collection
   */
  separator?: string;
  /**
   * Template for formatting error messages
   */
  errorTemplate?: string;
  /**
   * Template for formatting request information (optional, for debugging/logging)
   */
  requestTemplate?: string;
  /**
   * Whether to include request data in the template context
   */
  includeRequestData?: boolean;
};
