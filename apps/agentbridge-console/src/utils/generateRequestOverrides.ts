import { Parameter, ParameterLocation } from "@agentbridge/api";

export interface HttpRequestOverrides {
  query?: Record<string, string>;
  headers?: Record<string, string>;
  path?: Record<string, string>;
  body?: unknown;
  bodyFormat?: string;
}

/**
 * Generates default HTTP request overrides from tool parameters
 */
export function generateRequestOverrides(parameters: Record<string, Parameter>): HttpRequestOverrides {
  const overrides: HttpRequestOverrides = {};
  const queryParams: Record<string, string> = {};
  const headerParams: Record<string, string> = {};
  const pathParams: Record<string, string> = {};
  let hasBodyParam = false;
  let bodyStructure: Record<string, string> | string = {};

  for (const [name, param] of Object.entries(parameters)) {
    const template = `{{toolParams.${name}}}`;

    switch (param.in) {
      case ParameterLocation.QUERY:
      case undefined: // Default to query for backward compatibility
        queryParams[name] = template;
        break;

      case ParameterLocation.HEADER:
        headerParams[name] = template;
        break;

      case ParameterLocation.PATH:
        pathParams[name] = template;
        break;

      case ParameterLocation.BODY:
        hasBodyParam = true;
        if (param.schema?.properties) {
          // Generate body structure from schema
          const bodyObj = bodyStructure as Record<string, string>;
          Object.keys(param.schema.properties).forEach((propName) => {
            bodyObj[propName] = `{{toolParams.${name}.${propName}}}`;
          });
          bodyStructure = bodyObj;
        } else {
          // Simple body parameter
          bodyStructure = `{{toolParams.${name}}}`;
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
  }

  return overrides;
}

/**
 * Generates overrides from OpenAPI operation parameters
 */
export function generateOverridesFromOpenAPI(parameters: unknown[], requestBody?: unknown): HttpRequestOverrides {
  const overrides: HttpRequestOverrides = {};
  const queryParams: Record<string, string> = {};
  const headerParams: Record<string, string> = {};
  const pathParams: Record<string, string> = {};

  // Process parameters
  parameters?.forEach((param) => {
    if (param && typeof param === "object" && "name" in param && "in" in param) {
      const paramObj = param as { name: string; in: string };
      const template = `{{toolParams.${paramObj.name}}}`;

      switch (paramObj.in) {
        case "query":
          queryParams[paramObj.name] = template;
          break;
        case "header":
          headerParams[paramObj.name] = template;
          break;
        case "path":
          pathParams[paramObj.name] = template;
          break;
      }
    }
  });

  // Process request body
  if (requestBody && typeof requestBody === "object" && requestBody !== null && "content" in requestBody) {
    const reqBody = requestBody as {
      content?: { "application/json"?: { schema?: { properties?: Record<string, unknown> } } };
    };
    const schema = reqBody.content?.["application/json"]?.schema;
    if (schema?.properties) {
      const bodyStructure: Record<string, string> = {};
      Object.keys(schema.properties).forEach((propName) => {
        bodyStructure[propName] = `{{toolParams.body.${propName}}}`;
      });
      overrides.body = bodyStructure;
      overrides.bodyFormat = "json";
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
