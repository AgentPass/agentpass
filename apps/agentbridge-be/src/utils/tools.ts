import snakeCase from "lodash/snakeCase.js";
import { OpenAPIV3 } from "openapi-types";

export const TOOL_NAME_MAX_LENGTH = process.env.TOOL_NAME_MAX_LENGTH ? parseInt(process.env.TOOL_NAME_MAX_LENGTH) : 60;

export const getToolName = (operation: OpenAPIV3.OperationObject, method: string, path: string): string => {
  if (operation.operationId) {
    return snakeCase(operation.operationId);
  }
  if (operation.summary) {
    return snakeCase(operation.summary);
  }
  return snakeCase(`${method}_${path}`).slice(0, TOOL_NAME_MAX_LENGTH);
};
