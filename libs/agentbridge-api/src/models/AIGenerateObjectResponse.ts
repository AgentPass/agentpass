/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AIUsage } from "./AIUsage";
export type AIGenerateObjectResponse = {
  /**
   * The generated object matching the requested schema
   */
  object: Record<string, any>;
  usage?: AIUsage;
  finishReason?: AIGenerateObjectResponse.finishReason;
};
export namespace AIGenerateObjectResponse {
  export enum finishReason {
    STOP = "stop",
    LENGTH = "length",
    CONTENT_FILTER = "content-filter",
    ERROR = "error",
  }
}
