/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AIChatMessage = {
  id: string;
  role: AIChatMessage.role;
  content: string;
};
export namespace AIChatMessage {
  export enum role {
    USER = "user",
    ASSISTANT = "assistant",
    SYSTEM = "system",
  }
}
