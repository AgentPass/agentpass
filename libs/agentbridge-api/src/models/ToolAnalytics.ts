/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AnalyticsDataPoint } from "./AnalyticsDataPoint";
import type { TimeSeriesData } from "./TimeSeriesData";
export type ToolAnalytics = {
  total: AnalyticsDataPoint;
  /**
   * Time series data for the server
   */
  timeSeriesData: Array<TimeSeriesData>;
};
