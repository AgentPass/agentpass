import { ToolInfo } from "@/components/onboarding/ToolSelectionStep";
import snakeCase from "lodash/snakeCase";
import { OpenApiDocument } from "../pages/servers/openapiValidator";

interface Operation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
}

function getToolName(operation: Operation, method: string, path: string): string {
  const TOOL_NAME_MAX_LENGTH = 60;

  if (operation.operationId) {
    return snakeCase(operation.operationId).slice(0, TOOL_NAME_MAX_LENGTH);
  }
  if (operation.summary) {
    return snakeCase(operation.summary).slice(0, TOOL_NAME_MAX_LENGTH);
  }
  return snakeCase(`${method}_${path}`).slice(0, TOOL_NAME_MAX_LENGTH);
}

export function extractToolsFromOpenAPI(openApiContent: OpenApiDocument): ToolInfo[] {
  const tools: ToolInfo[] = [];

  Object.entries(openApiContent.paths || {}).forEach(([path, pathObj]) => {
    Object.entries(pathObj).forEach(([method, operation]) => {
      if (method === "parameters") return;

      const op = operation as Operation;
      const toolName = getToolName(op, method, path);
      const operationId = op.operationId;

      const description = op.summary || op.description || "";
      const tags = op.tags || [];
      const folder = tags.length > 0 ? tags[0] : undefined;

      tools.push({
        name: toolName,
        description,
        operationId: operationId || toolName,
        folder,
      });
    });
  });

  return tools;
}
