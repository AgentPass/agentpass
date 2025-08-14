import { Parameter } from "@agentbridge/api";
import { OpenAPIV3 } from "openapi-types";

export interface HttpRequestOverrides {
  query?: Record<string, string>;
  headers?: Record<string, string>;
  path?: Record<string, string>;
  body?: Record<string, unknown> | unknown[] | string;
  bodyFormat?: string;
}

/**
 * Generates HTTP request overrides from OpenAPI operation and path item
 */
export function generateRequestOverridesFromOperation(
  operation: OpenAPIV3.OperationObject,
  pathItem: OpenAPIV3.PathItemObject,
  openApiDocument?: OpenAPIV3.Document,
): HttpRequestOverrides {
  const overrides: HttpRequestOverrides = {};
  const queryParams: Record<string, string> = {};
  const headerParams: Record<string, string> = {};
  const pathParams: Record<string, string> = {};

  // Combine path-level and operation-level parameters
  const allParameters = [...(pathItem.parameters || []), ...(operation.parameters || [])];

  // Process parameters
  allParameters.forEach((param) => {
    if (typeof param === "object" && "name" in param) {
      const parameter = param as OpenAPIV3.ParameterObject;
      const template = `{{toolParams.${parameter.name}}}`;

      switch (parameter.in) {
        case "query":
          queryParams[parameter.name] = template;
          break;
        case "header":
          headerParams[parameter.name] = template;
          break;
        case "path":
          pathParams[parameter.name] = template;
          break;
      }
    }
  });

  // Process security schemes if they exist
  if (openApiDocument && (operation.security || openApiDocument.security)) {
    const securityRequirements = operation.security || openApiDocument.security || [];
    const securitySchemes = openApiDocument.components?.securitySchemes || {};

    securityRequirements.forEach((requirement) => {
      Object.keys(requirement).forEach((schemeName) => {
        const scheme = securitySchemes[schemeName];

        if (scheme && typeof scheme === "object" && "type" in scheme) {
          const securityScheme = scheme as OpenAPIV3.SecuritySchemeObject;

          // Handle API Key authentication
          if (securityScheme.type === "apiKey" && securityScheme.in === "header" && securityScheme.name) {
            // Add header with placeholder value - these should be configured at server/environment level
            headerParams[securityScheme.name] = `<${schemeName}>`;
          }

          // Handle HTTP Bearer authentication
          if (securityScheme.type === "http" && securityScheme.scheme === "bearer") {
            // Add Authorization header with placeholder - should be configured at server/environment level
            headerParams["Authorization"] = "Bearer <token>";
          }
        }
      });
    });
  }

  // Process request body
  if (operation.requestBody && typeof operation.requestBody === "object" && "content" in operation.requestBody) {
    const requestBody = operation.requestBody as OpenAPIV3.RequestBodyObject;

    // Check for JSON content
    const jsonContent = requestBody.content?.["application/json"];
    if (jsonContent?.schema) {
      const schema = jsonContent.schema as OpenAPIV3.SchemaObject;

      if (schema.properties) {
        const bodyStructure: Record<string, string> = {};
        Object.keys(schema.properties).forEach((propName) => {
          bodyStructure[propName] = `{{toolParams.body.${propName}}}`;
        });
        overrides.body = bodyStructure;
        overrides.bodyFormat = "json";
      } else {
        // Simple body without properties
        overrides.body = "{{toolParams.body}}";
        overrides.bodyFormat = "json";
      }
    }

    // Check for form-encoded content
    const formContent = requestBody.content?.["application/x-www-form-urlencoded"];
    if (formContent?.schema) {
      const schema = formContent.schema as OpenAPIV3.SchemaObject;

      if (schema.properties) {
        const bodyStructure: Record<string, string> = {};
        Object.keys(schema.properties).forEach((propName) => {
          bodyStructure[propName] = `{{toolParams.${propName}}}`;
        });
        overrides.body = bodyStructure;
        overrides.bodyFormat = "form";
      }
    }
  }

  // Only add sections that have parameters
  if (Object.keys(queryParams).length > 0) {
    overrides.query = queryParams;
  }

  if (Object.keys(headerParams).length > 0) {
    overrides.headers = headerParams;
  }

  if (Object.keys(pathParams).length > 0) {
    overrides.path = pathParams;
  }

  return overrides;
}

/**
 * Generates HTTP request overrides from tool parameters (for consistency with frontend)
 */
export function generateRequestOverrides(parameters: Record<string, Parameter>): HttpRequestOverrides {
  const overrides: HttpRequestOverrides = {};
  const queryParams: Record<string, string> = {};
  const headerParams: Record<string, string> = {};
  const pathParams: Record<string, string> = {};
  let hasBodyParam = false;
  let hasFormDataParam = false;
  const bodyStructure: Record<string, string> = {};
  const formDataStructure: Record<string, string> = {};

  for (const [name, param] of Object.entries(parameters)) {
    const template = `{{toolParams.${name}}}`;

    switch (param.in) {
      case "query":
      case undefined: // Default to query for backward compatibility
        queryParams[name] = template;
        break;

      case "header":
        headerParams[name] = template;
        break;

      case "path":
        pathParams[name] = template;
        break;

      case "body":
        hasBodyParam = true;
        if (param.schema?.properties) {
          // Generate body structure from schema
          Object.keys(param.schema.properties).forEach((propName) => {
            bodyStructure[propName] = `{{toolParams.${name}.${propName}}}`;
          });
        } else {
          // Simple body parameter - create proper JSON object structure
          bodyStructure[name] = `{{toolParams.${name}}}`;
        }
        break;

      default:
        // Handle formData as a special case outside the enum
        if ((param.in as string) === "formData") {
          hasFormDataParam = true;
          formDataStructure[name] = template;
        }
        break;
    }
  }

  // Only add sections that have parameters
  if (Object.keys(queryParams).length > 0) {
    overrides.query = queryParams;
  }

  if (Object.keys(headerParams).length > 0) {
    overrides.headers = headerParams;
  }

  if (Object.keys(pathParams).length > 0) {
    overrides.path = pathParams;
  }

  if (hasBodyParam) {
    overrides.body = bodyStructure;
    overrides.bodyFormat = "json";
  } else if (hasFormDataParam) {
    overrides.body = formDataStructure;
    overrides.bodyFormat = "form";
  }

  return overrides;
}
