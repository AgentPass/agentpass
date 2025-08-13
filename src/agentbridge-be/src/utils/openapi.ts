import { compileErrors, validate } from "@readme/openapi-parser";
import { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

export type OpenApi3Document = OpenAPIV3.Document | OpenAPIV3_1.Document;
export type OpenApiDocument = OpenAPIV2.Document | OpenApi3Document;

export interface OpenApiValidationError {
  error: "invalid_openapi";
  errorDescription: string;
}

export const validateOpenApiContent = async (content: unknown): Promise<OpenApiValidationError | null> => {
  if (!content || typeof content !== "object") {
    return {
      error: "invalid_openapi",
      errorDescription: "OpenAPI content is empty",
    };
  }
  if (!("info" in content) || !content.info || typeof content.info !== "object" || !("title" in content.info)) {
    return {
      error: "invalid_openapi",
      errorDescription: "OpenAPI info section is required and must include a title",
    };
  }

  // Servers are optional, but if they exist, they must have a url property
  if ("servers" in content) {
    if (!Array.isArray(content.servers)) {
      return {
        error: "invalid_openapi",
        errorDescription: "Servers must be an array in the OpenAPI specification",
      };
    }
    const hasValidServer = content.servers.some(
      (server) => server && typeof server === "object" && "url" in server && typeof server.url === "string",
    );

    if (!hasValidServer) {
      return {
        error: "invalid_openapi",
        errorDescription: "At least one server must have a valid URL in the OpenAPI specification",
      };
    }
  }

  try {
    const result = await validate(content as OpenApiDocument);
    if (result.valid === true) {
      return null;
    }
    return {
      error: "invalid_openapi",
      errorDescription: compileErrors(result),
    };
  } catch (error) {
    return {
      error: "invalid_openapi",
      errorDescription: error instanceof Error ? error.message : "Invalid OpenAPI specification",
    };
  }
};

export const getServerUrlFromOpenApi = (openApiContent: OpenApi3Document): string => {
  if (!openApiContent.servers?.length) {
    return "";
  }

  const firstServer = openApiContent.servers[0];
  if (!firstServer?.url || typeof firstServer.url !== "string") {
    return "";
  }

  return firstServer.url;
};
