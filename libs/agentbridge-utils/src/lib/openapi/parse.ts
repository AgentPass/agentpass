import { DeepPartial, OpenAPI } from "@agentbridge/utils";
import { HttpMethod, type Prisma } from "@prisma/client";
import { RefResolver } from "json-schema-ref-resolver";
import { OpenAPIV2, OpenAPIV3 } from "openapi-types";
import { Entries } from "type-fest";
import { filterObject } from "../filterObject.js";

export interface OpenApiValidationErrorContent {
  error: string;
  errorDescription: string;
}

enum Errors {
  NotResolvableRef = "cannot resolve $ref",
  EmptyRef = "$ref is not a string",
  Empty = "empty object",
  NotValidPath = "not a valid path",
}
class OpenApiValidationError extends Error {
  constructor(
    message: string,
    public error: string,
    public errorDescription?: string,
  ) {
    super(message);
    this.error = error;
    this.errorDescription = errorDescription;
  }
}
const isOpenApiV2 = (openApiContent: DeepPartial<OpenAPI.Document>): openApiContent is OpenAPI.V2Document => {
  return "swagger" in openApiContent;
};

type BaseValidatedOpenApi = DeepPartial<OpenAPI.Document> & { info: { title: string } };

export const validateOpenApiContent: (
  refResolver: RefResolver,
  openApiContent: DeepPartial<OpenAPI.Document>,
) => asserts openApiContent is BaseValidatedOpenApi = (
  refResolver: RefResolver,
  openApiContent: DeepPartial<OpenAPI.Document>,
): asserts openApiContent is BaseValidatedOpenApi => {
  if (!openApiContent) {
    throw new OpenApiValidationError("Empty OpenAPI content", "invalid_openapi", "OpenAPI content is empty");
  }

  if (!openApiContent?.info) {
    throw new OpenApiValidationError(
      "OpenAPI info section is required",
      "invalid_openapi",
      "OpenAPI info section is required",
    );
  }

  if (!openApiContent?.info?.title) {
    throw new OpenApiValidationError("OpenAPI title is required", "invalid_openapi", "OpenAPI title is required");
  }

  try {
    getServerUrlFromOpenApi(openApiContent);
  } catch {
    throw new OpenApiValidationError(
      "Server URL is required in the OpenAPI specification",
      "invalid_openapi",
      "Server URL is required in the OpenAPI specification",
    );
  }

  try {
    getSecuritySchemesFromOpenApi(refResolver, openApiContent);
  } catch (error) {
    console.log(error);
    throw new OpenApiValidationError(
      "Security schemes are required in the OpenAPI specification",
      "invalid_openapi",
      "Security schemes are required in the OpenAPI specification",
    );
  }
};

export const getServerUrlFromOpenApi = (openApiContent: DeepPartial<OpenAPI.Document>): string => {
  if (isOpenApiV2(openApiContent) && openApiContent.host) {
    return openApiContent.host;
  }

  if ("servers" in openApiContent && Array.isArray(openApiContent.servers) && openApiContent.servers.length > 0) {
    return openApiContent.servers[0].url;
  }

  throw new Error("Server URL is required in the OpenAPI specification");
};

const getSecuritySchemesFromOpenApi3 = (
  refResolver: RefResolver,
  openApiContent: DeepPartial<OpenAPI.Document>,
): OpenAPI.SecuritySchemeOAuth2 => {
  if (!("components" in openApiContent) || !openApiContent.components) {
    throw new Error("OAuth 2.0 security requirement must have exactly one scope");
  }
  if (!("securitySchemes" in openApiContent.components) || !openApiContent.components.securitySchemes) {
    throw new Error("OAuth 2.0 security requirement must have exactly one scope");
  }

  const secSchemas: Record<string, OpenAPI.SecuritySchemeOAuth2> = {};
  Object.keys(openApiContent.components.securitySchemes).forEach((key) => {
    if (openApiContent.components.securitySchemes[key]) {
      secSchemas[key] = resolveRef(refResolver, openApiContent.components.securitySchemes[key]);
    }
  });

  if (!secSchemas) {
    throw new Error("OAuth 2.0 security requirement must have exactly one scope");
  }
  const oauthSecurity = filterObject(secSchemas, ([_, item]) => item["type"] === "oauth2");
  if (Object.keys(oauthSecurity).length !== 1) {
    throw new Error("OAuth 2.0 security requirement must have exactly one scope");
  }

  const value = Object.values(oauthSecurity)[0];
  if (!value) {
    throw new Error("OAuth 2.0 security requirement must have exactly one scope");
  }
  return value;
};

const getToolName = (path: string, method: OpenAPI.HttpMethods, operation: OpenAPI.Operation): string => {
  return operation?.operationId || `${method.toUpperCase()} ${path}`;
};

const getSecuritySchemesFromOpenApi2 = (
  refResolver: RefResolver,
  openApiContent: DeepPartial<OpenAPI.Document>,
): OpenAPI.SecuritySchemeOAuth2 => {
  if (!("securityDefinitions" in openApiContent) || !openApiContent.securityDefinitions) {
    throw new Error("OAuth 2.0 security requirement must have exactly one scope");
  }
  const secSchemas: OpenAPI.SecuritySchemeOAuth2[] =
    "$ref" in openApiContent.securityDefinitions && typeof openApiContent.securityDefinitions["$ref"] === "string"
      ? refResolver.getDerefSchema(openApiContent.securityDefinitions["$ref"])
      : openApiContent.securityDefinitions;
  if (secSchemas === undefined) {
    throw new Error("OAuth 2.0 security requirement must have exactly one scope");
  }
  const oauthSecurity = secSchemas.filter((scheme) => scheme.type === "oauth2");
  if (oauthSecurity.length !== 1) {
    throw new Error("OAuth 2.0 security requirement must have exactly one scope");
  }

  if ("$ref" in oauthSecurity[0] && typeof oauthSecurity[0]["$ref"] === "string") {
    const resolvedValue = refResolver.getDerefSchema(oauthSecurity[0]["$ref"]);
    if (resolvedValue === undefined) {
      throw new Error("OAuth 2.0 security requirement must have exactly one scope");
    }
    return resolvedValue;
  }
  throw new Error("OAuth 2.0 security requirement must have exactly one scope");
};

export const getSecuritySchemesFromOpenApi = (
  refResolver: RefResolver,
  openApiContent: DeepPartial<OpenAPI.Document>,
): OpenAPI.SecuritySchemeOAuth2 => {
  if (isOpenApiV2(openApiContent)) {
    return getSecuritySchemesFromOpenApi2(refResolver, openApiContent);
  }
  return getSecuritySchemesFromOpenApi3(refResolver, openApiContent);
};

const isHttpMethod = (method: unknown): method is OpenAPI.HttpMethods =>
  // @ts-expect-error ts(2345) error should be ignored
  [...Object.values(OpenAPIV2.HttpMethods), ...Object.values(OpenAPIV3.HttpMethods)].includes(method);

const isOperationObject = (object: unknown): object is OpenAPI.OperationObject => {
  return (
    !!object &&
    typeof object === "object" &&
    "operationId" in object &&
    "parameters" in object &&
    "responses" in object &&
    "security" in object
  );
};
const resolveRef = <T>(
  refResolver: RefResolver,
  item: T | OpenAPI.ReferenceObject,
): Exclude<T, OpenAPI.ReferenceObject> | T => {
  if (!item || typeof item !== "object") {
    return item;
  }
  if (!("$ref" in item)) {
    return item as Exclude<T, OpenAPI.ReferenceObject>;
  }
  if (typeof item["$ref"] !== "string") {
    throw new Error(Errors.NotResolvableRef);
  }
  const resolvedPathItem = refResolver.getDerefSchema(item["$ref"]);
  if (!resolvedPathItem) {
    throw new Error(Errors.NotResolvableRef);
  }
  return resolvedPathItem as Exclude<T, OpenAPI.ReferenceObject>;
};

const isRequestBody = (object: unknown): object is OpenAPI.RequestBodyObject => {
  return (
    !!object &&
    typeof object === "object" &&
    "content" in object &&
    typeof object.content === "object" &&
    object.content !== null
  );
};

const getToolsFromOpenApi = (
  refResolver: RefResolver,
  openApiContent: DeepPartial<OpenAPI.Document>,
): [McpServerCreate["server"]["folders"], McpServerCreate["failedTools"]] => {
  const folders: McpServerCreate["server"]["folders"] = {};
  const failedTools: { toolName: string; error: string }[] = [];

  if (!openApiContent.paths) {
    return [folders, failedTools];
  }

  // path: /pet/{id}
  // eslint-disable-next-line prefer-const
  for (let [path, _pathObject] of Object.entries(openApiContent["paths"]) as Entries<
    DeepPartial<OpenAPI.Document["paths"]>
  >) {
    const pathObject = resolveRef(refResolver, _pathObject);
    if (!pathObject) {
      continue;
    }
    for (const [method, _operation] of Object.entries(pathObject) as Entries<typeof pathObject>) {
      if (!isHttpMethod(method) || !isOperationObject(_operation)) {
        continue;
      }
      const operation = resolveRef(refResolver, _operation);
      const methodStr = String(method);
      const folderName: string = operation.tags?.[0] || "unknown";
      try {
        const toolName = getToolName(String(path), method, operation);

        const description = operation.summary || operation.description || `${methodStr.toUpperCase()} ${path}`;

        // Extract parameters

        const parameters: Record<string, OpenAPI.OpenAPIV3 | OpenAPI.RequestBodyObject> =
          resolveRef(refResolver, operation.parameters) ?? Object();

        // Extract request body for OpenAPI 3.x
        if ("requestBody" in operation && isRequestBody(operation["requestBody"])) {
          const requestBody = resolveRef(refResolver, operation["requestBody"]);
          if (requestBody) {
            parameters["requestBody"] = requestBody;
          }
        }

        // Extract responses
        const responses = resolveRef(refResolver, operation.responses);
        if (!(folderName in folders)) {
          folders[folderName] = [];
        }
        folders[folderName].push({
          name: toolName,
          description,
          method: methodStr.toUpperCase() as HttpMethod,
          url: path,
          parameters: parameters as unknown as Prisma.InputJsonObject,
          responses: responses as Prisma.InputJsonObject,
        });
      } catch (error) {
        const methodStr = String(method);

        const toolName = operation?.operationId || `${methodStr.toUpperCase()} ${path}`;
        failedTools.push({
          toolName,
          error: error instanceof Error ? error.message : "Unknown error processing tool",
        });
      }
    }
  }

  return [folders, failedTools];
};

const getAuthProviderFromOpenApi = (
  refResolver: RefResolver,
  openApiContent: DeepPartial<OpenAPI.Document>,
): McpServerCreate["server"]["authProvider"] => {
  const securitySchemes = getSecuritySchemesFromOpenApi(refResolver, openApiContent);

  // Extract OAuth URLs from security schemes
  let authorizationUrl = "";
  let tokenUrl = "";
  let scopes: string[] = [];

  if ("flows" in securitySchemes && securitySchemes.flows) {
    const flow =
      securitySchemes.flows.authorizationCode ||
      securitySchemes.flows.implicit ||
      securitySchemes.flows.password ||
      securitySchemes.flows.clientCredentials;

    if (flow) {
      authorizationUrl = "authorizationUrl" in flow ? flow.authorizationUrl : "";
      tokenUrl = "tokenUrl" in flow ? flow.tokenUrl : "";
      scopes = flow.scopes ? Object.keys(flow.scopes) : [];
    }
  } else if ("authorizationUrl" in securitySchemes && "tokenUrl" in securitySchemes) {
    // OpenAPI 2.0 format
    authorizationUrl = securitySchemes.authorizationUrl || "";
    tokenUrl = securitySchemes.tokenUrl || "";
    scopes = securitySchemes.scopes ? Object.keys(securitySchemes.scopes) : [];
  }

  const authProvider: McpServerCreate["server"]["authProvider"] = {
    name: "OAuth 2.0",
    clientId: "",
    clientSecret: "",
    authorizationUrl,
    tokenUrl,
    scopes,
  };
  return authProvider;
};

interface McpServerCreate {
  server: {
    server: Omit<Prisma.McpServerCreateInput, "tenant">;
    folders: Record<string, Omit<Prisma.ToolCreateInput, "tenant" | "server">[]>;
    authProvider: Omit<Prisma.OAuthProviderCreateInput, "tenant" | "server">;
  };
  failedTools: {
    toolName: string;
    error: string;
  }[];
}

export const getMcpServerFromOpenApi = (openApiContent: DeepPartial<OpenAPI.Document>): McpServerCreate => {
  // #region: setup
  const refResolver = new RefResolver();
  refResolver.addSchema(openApiContent);
  validateOpenApiContent(refResolver, openApiContent);
  const server: McpServerCreate["server"]["server"] = {
    name: openApiContent.info.title,
    baseUrl: getServerUrlFromOpenApi(openApiContent),
    description: openApiContent.info?.description,
  };
  // #endregion

  const authProvider = getAuthProviderFromOpenApi(refResolver, openApiContent);

  const [folders, failedTools] = getToolsFromOpenApi(refResolver, openApiContent);

  return {
    server: {
      server,
      folders: folders,
      authProvider,
    },
    failedTools,
  };
};
