/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AIUsage } from "./AIUsage";
export type AICompletionResponse = {
  text: string;
  usage?: AIUsage;
  finishReason?: AICompletionResponse.finishReason;
};
export namespace AICompletionResponse {
  export enum finishReason {
    STOP = "stop",
    LENGTH = "length",
    CONTENT_FILTER = "content-filter",
    ERROR = "error",
  }
}
