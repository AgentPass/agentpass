import { bundle, compileErrors, parse, validate } from "@readme/openapi-parser";
import { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

export class OpenApiValidationError extends Error {}

export type OpenApi3Document = OpenAPIV3.Document | OpenAPIV3_1.Document;
export type OpenApiDocument = OpenAPIV2.Document | OpenApi3Document;

export const validateOpenApiContent = async (content: string | object) => {
  const result = await validate(content as "APIDocument");
  if (!result.valid) {
    throw new OpenApiValidationError(compileErrors(result));
  }
  const parsed = await parse(content as "APIDocument");
  const bundled = await bundle(parsed);
  return bundled;
};
