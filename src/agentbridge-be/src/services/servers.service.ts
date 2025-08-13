import {
  CreateServerRequest,
  CreateToolRequest,
  Folder,
  FormattingConfig,
  type HttpMethod,
  McpServer,
  Parameter,
  ParameterLocation,
  RequestParamConfig,
  Response,
  ServerAuthType,
  Tool,
  UpdateServerRequest,
  UpdateToolRequest,
} from "@agentbridge/api";
import {
  ApiKeyLocation,
  ApiKeyProvider as PrismaApiKeyProvider,
  OAuthProvider as PrismaOAuthProvider,
  McpServer as PrismaServer,
  Tool as PrismaTool,
} from "@prisma/client";
import { PrismaClient } from "@prisma/client/extension";
import groupBy from "lodash/groupBy.js";
import omit from "lodash/omit.js";
import snakeCase from "lodash/snakeCase.js";
import { OpenAPIV3 } from "openapi-types";
import { PaginatedList } from "../types/data.types.js";
import { DEFAULT_PAGE_SIZE } from "../utils/config.js";
import { Database } from "../utils/connection.js";
import { generateRequestOverridesFromOperation } from "../utils/generateRequestOverrides.js";
import { getIcon } from "../utils/icons.js";
import { getServerUrlFromOpenApi, OpenApi3Document } from "../utils/openapi.js";
import { getToolName, TOOL_NAME_MAX_LENGTH } from "../utils/tools.js";

const mapServer = (server: PrismaServer & { _count?: { tools: number } }): McpServer => ({
  ...server,
  description: server.description || undefined,
  toolCount: server._count?.tools,
  authType: server.authType as ServerAuthType,
  authConfigId: server.authConfigId || undefined,
  createdAt: server.createdAt.toISOString(),
  updatedAt: server.updatedAt.toISOString(),
});

type ServerWithAuthConfig = PrismaServer & {
  _count?: { tools: number };
  authConfig?: {
    id: string;
    serverId: string;
    authType: string;
    createdAt: Date;
    updatedAt: Date;
    jwtProvider?: {
      id: string;
      name: string;
      jwksUrl: string;
      enabled: boolean;
    } | null;
  } | null;
};

const mapServerWithAuth = (server: ServerWithAuthConfig) => ({
  ...mapServer(server),
  authConfig: server.authConfig
    ? {
        id: server.authConfig.id,
        serverId: server.authConfig.serverId,
        authType: server.authConfig.authType as ServerAuthType,
        createdAt: server.authConfig.createdAt.toISOString(),
        updatedAt: server.authConfig.updatedAt.toISOString(),
        jwtProvider: server.authConfig.jwtProvider
          ? {
              id: server.authConfig.jwtProvider.id,
              name: server.authConfig.jwtProvider.name,
              jwksUrl: server.authConfig.jwtProvider.jwksUrl,
              enabled: server.authConfig.jwtProvider.enabled,
            }
          : undefined,
      }
    : undefined,
});

const mapTool = (tool: PrismaTool, adminAuthorized = false): Tool => ({
  ...tool,
  folderId: tool.folderId || undefined,
  parameters: (tool.parameters as Record<string, Parameter>) || {},
  method: tool.method as HttpMethod,
  oAuthProviderId: tool.oAuthProviderId || undefined,
  apiKeyProviderId: tool.apiKeyProviderId || undefined,
  responseFormatting: tool.responseFormatting as FormattingConfig | undefined,
  requestParameterOverrides: tool.requestParameterOverrides as Record<string, RequestParamConfig> | null,
  responses: tool.responses as Record<string, Response> | undefined,
  adminAuthorized,
  enabled: tool.enabled,
  createdAt: tool.createdAt.toISOString(),
  updatedAt: tool.updatedAt.toISOString(),
});

async function createAuthProviderFromOpenApi(
  tx: PrismaClient,
  serverName: string,
  openApiContent: OpenApi3Document,
  tenantId: string,
): Promise<{ provider: PrismaOAuthProvider | PrismaApiKeyProvider; specName: string }[]> {
  const providers: { provider: PrismaOAuthProvider | PrismaApiKeyProvider; specName: string }[] = [];

  for (const [name, oauthScheme] of Object.entries(openApiContent?.components?.securitySchemes || {})) {
    if ("type" in oauthScheme && oauthScheme.type === "oauth2") {
      if (!oauthScheme.flows?.authorizationCode?.authorizationUrl || !oauthScheme.flows?.authorizationCode?.tokenUrl) {
        throw new Error("Missing required OAuth URLs in security scheme");
      }
      providers.push({
        specName: name,
        provider: await tx.oAuthProvider.create({
          data: {
            name: serverName + " OAuth",
            clientId: "",
            clientSecret: "",
            authorizationUrl: oauthScheme.flows.authorizationCode.authorizationUrl,
            tokenUrl: oauthScheme.flows.authorizationCode.tokenUrl,
            scopes: oauthScheme.flows.authorizationCode.scopes
              ? Object.keys(oauthScheme.flows.authorizationCode.scopes)
              : [],
            tenantId,
            svg: getIcon("oauthGeneric"),
            refreshUrl: oauthScheme.flows.authorizationCode.refreshUrl,
          },
        }),
      });
    }
  }

  for (const [name, apiKeyScheme] of Object.entries(openApiContent?.components?.securitySchemes || {})) {
    if ("type" in apiKeyScheme && apiKeyScheme.type === "apiKey") {
      providers.push({
        specName: name,
        provider: await tx.apiKeyProvider.create({
          data: {
            value: serverName + " API Key",
            keyName: apiKeyScheme.name,
            keyIn: apiKeyScheme.in,
            tenantId,
          },
        }),
      });
    }
  }

  return providers;
}

export async function createServer(db: Database, tenantId: string, server: CreateServerRequest) {
  return await db.mcpServer.create({
    data: { ...server, tenantId },
  });
}

export async function getServersForTenant(db: Database, tenantId: string): Promise<PaginatedList<McpServer>> {
  const servers = await db.mcpServer.findMany({
    where: {
      tenantId: tenantId,
    },
    include: {
      _count: {
        select: {
          tools: true,
        },
      },
    },
    orderBy: [
      {
        name: "asc",
      },
      {
        id: "asc",
      },
    ],
  });

  return {
    data: servers.map(mapServer),
    pagination: {
      currentPage: 1,
      itemsPerPage: DEFAULT_PAGE_SIZE,
      totalItems: servers.length,
      totalPages: Math.ceil(servers.length / DEFAULT_PAGE_SIZE),
    },
  };
}

export async function getServerById(db: Database, tenantId: string, serverId: string) {
  const server = await db.mcpServer.findUnique({
    where: {
      id: serverId,
      tenantId,
    },
    include: {
      authConfig: {
        include: {
          jwtProvider: true,
        },
      },
    },
  });
  return server ? mapServerWithAuth(server) : null;
}

export async function updateServerById(
  db: Database,
  tenantId: string,
  serverId: string,
  updateData: UpdateServerRequest,
) {
  return mapServer(
    await db.mcpServer.update({
      where: {
        id: serverId,
        tenantId,
      },
      data: updateData,
    }),
  );
}

export async function deleteServerById(db: Database, tenantId: string, serverId: string) {
  return mapServer(
    await db.mcpServer.delete({
      where: {
        id: serverId,
        tenantId,
      },
    }),
  );
}

export async function getServerSlim(db: Database, tenantId: string, serverId: string) {
  return await db.mcpServer.findUnique({
    where: {
      id: serverId,
      tenantId,
    },
    select: {
      id: true,
      tenantId: true,
    },
  });
}

export async function createToolsFromOpenApiSpec(
  db: Database,
  tenantId: string,
  serverId: string,
  openApiContent: OpenApi3Document,
  selectedTools?: string[],
) {
  return await db.$transaction(async (tx: PrismaClient) => {
    const foldersByName: Record<string, Folder> = {};
    const createdTools: Tool[] = [];

    // Get existing folders for this server
    const existingFolders = await tx.folder.findMany({
      where: { serverId, tenantId },
    });
    existingFolders.forEach((folder: Folder) => {
      foldersByName[folder.name] = folder;
    });

    // Create auth providers
    const providers = await createAuthProviderFromOpenApi(tx, `Server ${serverId}`, openApiContent, tenantId);
    const oauthProvidersByName = groupBy(
      providers.filter((p) => "authorizationUrl" in p.provider),
      "specName",
    );
    const apiKeyProvidersByName = groupBy(
      providers.filter((p) => "keyIn" in p.provider),
      "specName",
    );

    if (openApiContent.paths) {
      for (const [path, pathItem] of Object.entries(openApiContent.paths)) {
        if (typeof pathItem === "object" && pathItem !== null) {
          for (const [method, operation] of Object.entries(pathItem)) {
            if (
              typeof operation === "object" &&
              operation !== null &&
              ("operationId" in operation || "responses" in operation)
            ) {
              const parameters =
                operation.parameters?.reduce(
                  (acc, param) => {
                    if (typeof param === "object" && param !== null && "name" in param) {
                      acc[param.name] = param;
                    }
                    return acc;
                  },
                  {} as Record<string, OpenAPIV3.ParameterObject>,
                ) || {};

              if (operation.requestBody) {
                const requestBody = operation.requestBody;
                if (typeof requestBody === "object" && "content" in requestBody) {
                  // Check for JSON content
                  const jsonContent = requestBody.content?.["application/json"];
                  if (jsonContent?.schema) {
                    parameters["body"] = {
                      in: "body",
                      name: "body",
                      schema: jsonContent.schema,
                      required: requestBody.required ?? true,
                    };
                  }

                  // Check for form-encoded content
                  const formContent = requestBody.content?.["application/x-www-form-urlencoded"];
                  if (
                    formContent?.schema &&
                    typeof formContent.schema === "object" &&
                    "properties" in formContent.schema
                  ) {
                    const schema = formContent.schema as OpenAPIV3.SchemaObject;
                    if (schema.properties) {
                      // Extract each form field as a separate parameter
                      for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
                        parameters[fieldName] = {
                          in: "formData",
                          name: fieldName,
                          schema: fieldSchema,
                          required: schema.required?.includes(fieldName) ?? false,
                        } as OpenAPIV3.ParameterObject;
                      }
                    }
                  }
                }
              }

              let folderId: string | null = null;
              const tags = operation.tags || [];
              if (tags.length > 0) {
                const tag = tags[0];
                if (!foldersByName[tag]) {
                  foldersByName[tag] = await tx.folder.create({
                    data: {
                      name: tag,
                      tenantId,
                      serverId,
                    },
                  });
                }
                folderId = foldersByName[tag].id;
              }

              let apiKeyProviderId: string | null = null;
              let oAuthProviderId: string | null = null;
              const securitySpecNames = operation.security?.flatMap((sec) => Object.keys(sec)) || [];
              for (const security of securitySpecNames) {
                if (apiKeyProvidersByName[security]) {
                  apiKeyProviderId = apiKeyProvidersByName[security][0].provider.id;
                }
                if (oauthProvidersByName[security]) {
                  oAuthProviderId = oauthProvidersByName[security][0].provider.id;
                }
              }

              const toolName = getToolName(operation, method, path);
              const isSelected = selectedTools
                ? selectedTools.some((selectedTool) => selectedTool.toLowerCase() === toolName.toLowerCase())
                : true;

              if (isSelected) {
                const createdTool = await tx.tool.create({
                  data: {
                    name: toolName,
                    description: operation.summary || operation.description || "",
                    enabled: true,
                    parameters,
                    responses: operation.responses || {},
                    method: method.toUpperCase() as HttpMethod,
                    url: path,
                    responseFormatting: {},
                    requestParameterOverrides: generateRequestOverridesFromOperation(
                      operation,
                      pathItem,
                      openApiContent as OpenAPIV3.Document,
                    ),
                    tenantId,
                    serverId,
                    folderId,
                    apiKeyProviderId,
                    oAuthProviderId,
                  },
                });
                createdTools.push(mapTool(createdTool));
              }
            }
          }
        }
      }
    }

    return {
      tools: createdTools,
      authProviders: providers.map((p) => p.provider),
    };
  });
}

export async function createServerFromOpenApiSpec(
  db: Database,
  tenantId: string,
  name: string | null,
  description: string | null,
  openApiContent: OpenApi3Document,
  selectedTools?: string[],
) {
  return await db.$transaction(async (tx: PrismaClient) => {
    const foldersByName: Record<string, Folder> = {};

    const server = await tx.mcpServer.create({
      data: {
        name: name || openApiContent.info.title,
        description: description || openApiContent.info.description || "",
        enabled: true,
        tenantId: tenantId,
        baseUrl: getServerUrlFromOpenApi(openApiContent),
      },
    });

    const providers = await createAuthProviderFromOpenApi(tx, server.name, openApiContent, tenantId);
    const oauthProvidersByName = groupBy(
      providers.filter((p) => "authorizationUrl" in p.provider),
      "specName",
    );
    const apiKeyProvidersByName = groupBy(
      providers.filter((p) => "keyIn" in p.provider),
      "specName",
    );

    if (openApiContent.paths) {
      for (const [path, pathItem] of Object.entries(openApiContent.paths)) {
        if (typeof pathItem === "object" && pathItem !== null) {
          for (const [method, operation] of Object.entries(pathItem)) {
            if (
              typeof operation === "object" &&
              operation !== null &&
              ("operationId" in operation || "responses" in operation)
            ) {
              const parameters =
                operation.parameters?.reduce(
                  (acc, param) => {
                    if (typeof param === "object" && param !== null && "name" in param) {
                      acc[param.name] = param;
                    }
                    return acc;
                  },
                  {} as Record<string, OpenAPIV3.ParameterObject>,
                ) || {};

              if (operation.requestBody) {
                const requestBody = operation.requestBody;
                if (typeof requestBody === "object" && "content" in requestBody) {
                  // Check for JSON content
                  const jsonContent = requestBody.content?.["application/json"];
                  if (jsonContent?.schema) {
                    parameters["body"] = {
                      in: "body",
                      name: "body",
                      schema: jsonContent.schema,
                      required: requestBody.required ?? true,
                    };
                  }

                  // Check for form-encoded content
                  const formContent = requestBody.content?.["application/x-www-form-urlencoded"];
                  if (
                    formContent?.schema &&
                    typeof formContent.schema === "object" &&
                    "properties" in formContent.schema
                  ) {
                    const schema = formContent.schema as OpenAPIV3.SchemaObject;
                    if (schema.properties) {
                      // Extract each form field as a separate parameter
                      for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
                        parameters[fieldName] = {
                          in: "formData",
                          name: fieldName,
                          schema: fieldSchema,
                          required: schema.required?.includes(fieldName) ?? false,
                        } as OpenAPIV3.ParameterObject;
                      }
                    }
                  }
                }
              }

              let folderId: string | null = null;
              const tags = operation.tags || [];
              if (tags.length > 0) {
                const tag = tags[0];
                if (!foldersByName[tag]) {
                  foldersByName[tag] = await tx.folder.create({
                    data: {
                      name: tag,
                      tenantId,
                      serverId: server.id,
                    },
                  });
                }
                folderId = foldersByName[tag].id;
              }
              let apiKeyProviderId: string | null = null;
              let oAuthProviderId: string | null = null;
              const securitySpecNames = operation.security?.flatMap((sec) => Object.keys(sec)) || [];
              for (const security of securitySpecNames) {
                if (apiKeyProvidersByName[security]) {
                  apiKeyProviderId = apiKeyProvidersByName[security][0].provider.id;
                }
                if (oauthProvidersByName[security]) {
                  oAuthProviderId = oauthProvidersByName[security][0].provider.id;
                }
              }
              const toolName = getToolName(operation, method, path);
              const isSelected = selectedTools
                ? selectedTools.some((selectedTool) => selectedTool.toLowerCase() === toolName.toLowerCase())
                : true;

              await tx.tool.create({
                data: {
                  name: toolName,
                  description: operation.summary || operation.description || "",
                  enabled: isSelected,
                  parameters,
                  responses: operation.responses || {},
                  method: method.toUpperCase() as HttpMethod,
                  url: path,
                  responseFormatting: {},
                  requestParameterOverrides: generateRequestOverridesFromOperation(
                    operation,
                    pathItem,
                    openApiContent as OpenAPIV3.Document,
                  ),
                  tenantId,
                  serverId: server.id,
                  folderId,
                  apiKeyProviderId,
                  oAuthProviderId,
                },
              });
            }
          }
        }
      }
    }

    return {
      ...server,
      oauthProviders: Object.values(oauthProvidersByName).map((providers) => providers[0].provider),
    };
  });
}

const TODOS_OPENAPI_SPEC = {
  openapi: "3.0.0",
  info: {
    title: "Todos API",
    description: "A REST API for testing and prototyping applications that need to interact with a TODO list.",
    version: "1.0.0",
    contact: {
      name: "Todos API",
      url: "https://jsonplaceholder.typicode.com",
    },
  },
  servers: [
    {
      url: "https://jsonplaceholder.typicode.com",
      description: "JSONPlaceholder API Server",
    },
  ],
  tags: [
    {
      name: "todos",
      description: "Operations related to todo items",
    },
  ],
  paths: {
    "/todos": {
      get: {
        operationId: "get-all-todos",
        tags: ["todos"],
        summary: "Get all todos",
        description: "Returns a list of all todo items",
        parameters: [
          {
            name: "userId",
            in: "query",
            description: "Filter todos by user ID",
            required: false,
            schema: {
              type: "integer",
              format: "int64",
            },
          },
        ],
        responses: {
          "200": {
            description: "A list of todo items",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/Todo",
                  },
                },
              },
            },
          },
        },
      },
      post: {
        operationId: "create-a-new-todo",
        tags: ["todos"],
        summary: "Create a new todo",
        description: "Creates a new todo item",
        requestBody: {
          description: "Todo item to create",
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/TodoInput",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Todo created successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Todo",
                },
              },
            },
          },
        },
      },
    },
    "/todos/{id}": {
      get: {
        operationId: "get-a-todo",
        tags: ["todos"],
        summary: "Get a todo by ID",
        description: "Returns a single todo by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "ID of the todo to retrieve",
            required: true,
            schema: {
              type: "integer",
              format: "int64",
            },
          },
        ],
        responses: {
          "200": {
            description: "Todo found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Todo",
                },
              },
            },
          },
        },
      },
      put: {
        operationId: "update-a-todo",
        tags: ["todos"],
        summary: "Update a todo completely",
        description: "Replaces all properties of a todo item",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "ID of the todo to update",
            required: true,
            schema: {
              type: "integer",
              format: "int64",
            },
          },
        ],
        requestBody: {
          description: "Updated todo object",
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/TodoUpdate",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Todo updated successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Todo",
                },
              },
            },
          },
        },
      },
      delete: {
        operationId: "delete-a-todo",
        tags: ["todos"],
        summary: "Delete a todo",
        description: "Deletes a todo item",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "ID of the todo to delete",
            required: true,
            schema: {
              type: "integer",
              format: "int64",
            },
          },
        ],
        responses: {
          "200": {
            description: "Todo deleted successfully",
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Todo: {
        type: "object",
        required: ["id", "userId", "title", "completed"],
        properties: {
          id: {
            type: "integer",
            format: "int64",
            description: "Unique identifier for the todo",
            example: 1,
          },
          userId: {
            type: "integer",
            format: "int64",
            description: "ID of the user who owns this todo",
            example: 1,
          },
          title: {
            type: "string",
            description: "Task description",
            example: "Complete project documentation",
          },
          completed: {
            type: "boolean",
            description: "Whether the task is completed",
            example: false,
          },
        },
      },
      TodoInput: {
        type: "object",
        required: ["userId", "title"],
        properties: {
          userId: {
            type: "integer",
            format: "int64",
            description: "ID of the user who owns this todo",
            example: 1,
          },
          title: {
            type: "string",
            description: "Task description",
            example: "Write unit tests",
          },
          completed: {
            type: "boolean",
            description: "Whether the task is completed",
            example: false,
            default: false,
          },
        },
      },
      TodoUpdate: {
        type: "object",
        required: ["id", "userId", "title", "completed"],
        properties: {
          id: {
            type: "integer",
            format: "int64",
            description: "ID of the todo (must match path parameter)",
            example: 1,
          },
          userId: {
            type: "integer",
            format: "int64",
            description: "ID of the user who owns this todo",
            example: 1,
          },
          title: {
            type: "string",
            description: "Task description",
            example: "Updated task description",
          },
          completed: {
            type: "boolean",
            description: "Whether the task is completed",
            example: true,
          },
        },
      },
    },
  },
};

export async function createExampleTodosServer(db: Database, tenantId: string) {
  try {
    return await createServerFromOpenApiSpec(
      db,
      tenantId,
      "Todos API Example",
      "A sample To-Dos API for testing and learning MCP capabilities",
      TODOS_OPENAPI_SPEC as OpenApi3Document,
    );
  } catch (error) {
    console.error("Error in createExampleTodosServer:", error);
    throw error;
  }
}

export async function getToolsForServer(db: Database, tenantId: string, serverId: string, adminEmail: string) {
  return (
    await db.tool.findMany({
      where: {
        serverId: serverId,
        tenantId,
      },
      include: {
        oAuthProvider: {
          include: {
            providerTokens: {
              where: {
                user: {
                  email: adminEmail,
                  tenantId,
                },
              },
            },
          },
        },
      },
      orderBy: [
        {
          name: "asc",
        },
        {
          id: "asc",
        },
      ],
    })
  ).map((tool) => mapTool(tool, (tool.oAuthProvider?.providerTokens || []).length > 0));
}

export async function getToolById(db: Database, tenantId: string, toolId: string, adminEmail: string) {
  const tool = await db.tool.findUnique({
    where: {
      id: toolId,
      tenantId,
    },
    include: {
      oAuthProvider: {
        include: {
          providerTokens: {
            where: {
              user: {
                email: adminEmail,
                tenantId,
              },
            },
          },
        },
      },
    },
  });
  return tool ? mapTool(tool, (tool.oAuthProvider?.providerTokens || []).length > 0) : null;
}

export async function createTool(db: Database, serverId: string, tenantId: string, toolData: CreateToolRequest) {
  return await db.$transaction(async (tx: PrismaClient) => {
    if (toolData.oAuthProviderId) {
      const provider = await tx.oAuthProvider.findUnique({
        where: { id: toolData.oAuthProviderId, tenantId },
      });
      if (!provider) {
        throw new Error(`OAuth provider with ID ${toolData.oAuthProviderId} not found`);
      }
    }

    if (toolData.apiKeyProviderId) {
      const provider = await tx.apiKeyProvider.findUnique({
        where: { id: toolData.apiKeyProviderId, tenantId },
      });
      if (!provider) {
        throw new Error(`API Key provider with ID ${toolData.apiKeyProviderId} not found`);
      }
    }

    // Check if server has JWT authentication enabled
    const server = await tx.mcpServer.findUnique({
      where: { id: serverId },
      select: { authType: true },
    });

    // Prepare request parameter overrides, automatically adding JWT header if server uses JWT auth
    let requestParameterOverrides = toolData.requestParameterOverrides || {};

    if (server?.authType === ServerAuthType.JWT) {
      // Automatically add JWT authorization header for tools on servers with JWT auth
      requestParameterOverrides = {
        ...requestParameterOverrides,
        Authorization: {
          value: "Bearer {{toolParams.jwt}}",
          location: ParameterLocation.HEADER,
        },
      };
    }

    return await tx.tool.create({
      data: {
        name: snakeCase(toolData.name).slice(0, TOOL_NAME_MAX_LENGTH),
        description: toolData.description,
        folderId: toolData.folderId,
        parameters: toolData.parameters || {},
        method: toolData.method || "GET",
        url: toolData.url || "",
        oAuthProviderId: toolData.oAuthProviderId,
        apiKeyProviderId: toolData.apiKeyProviderId,
        responseFormatting: toolData.responseFormatting || {},
        requestParameterOverrides: requestParameterOverrides || null,
        tenantId: tenantId,
        serverId: serverId,
      },
    });
  });
}

export async function updateToolById(db: Database, tenantId: string, toolId: string, updateData: UpdateToolRequest) {
  // Filter out null values for JSON fields to avoid Prisma type issues
  const { requestParameterOverrides, responseFormatting, parameters, responses, ...rest } = updateData;

  const jsonFields: Record<string, unknown> = {};
  if (requestParameterOverrides !== null && requestParameterOverrides !== undefined) {
    jsonFields.requestParameterOverrides = requestParameterOverrides;
  }
  if (responseFormatting !== null && responseFormatting !== undefined) {
    jsonFields.responseFormatting = responseFormatting;
  }
  if (parameters !== null && parameters !== undefined) {
    jsonFields.parameters = parameters;
  }
  if (responses !== null && responses !== undefined) {
    jsonFields.responses = responses;
  }

  return mapTool(
    await db.tool.update({
      where: {
        id: toolId,
        tenantId,
      },
      data: {
        ...omit(rest, ["folderId", "providerId"]),
        ...jsonFields,
        ...(updateData.name ? { name: snakeCase(updateData.name).slice(0, TOOL_NAME_MAX_LENGTH) } : {}),
        ...("folderId" in updateData
          ? updateData.folderId
            ? {
                folder: {
                  connect: {
                    id: updateData.folderId,
                  },
                },
              }
            : {
                folder: {
                  disconnect: true,
                },
              }
          : {}),
        ...(updateData.providerId
          ? {
              oAuthProvider: {
                connect: {
                  id: updateData.providerId,
                },
              },
            }
          : {
              oAuthProvider: {
                disconnect: true,
              },
            }),
      },
    }),
  );
}

export async function deleteToolById(db: Database, tenantId: string, toolId: string) {
  return await db.tool.delete({
    where: {
      id: toolId,
      tenantId,
    },
  });
}

export interface McpServerExport {
  version: string;
  exportedAt: string;
  server: {
    name: string;
    description?: string;
    baseUrl: string;
    enabled: boolean;
    authType: ServerAuthType;
    authConfig?: {
      authType: ServerAuthType;
      jwtProvider?: {
        name: string;
        jwksUrl: string;
        enabled: boolean;
      };
    };
  };
  folders: Array<{
    name: string;
    parentFolderName?: string;
  }>;
  tools: Array<{
    name: string;
    description: string;
    method: HttpMethod;
    url: string;
    folderName?: string;
    enabled: boolean;
    parameters: Record<string, Parameter>;
    responses?: Record<string, Response>;
    responseFormatting?: FormattingConfig;
    requestParameterOverrides?: Record<string, RequestParamConfig> | null;
    authProvider?: {
      type: "oauth" | "apiKey";
      name: string;
      config: {
        // OAuth config (without secrets)
        authorizationUrl?: string;
        tokenUrl?: string;
        refreshUrl?: string;
        scopes?: string[];
        contentType?: string;
        // API Key config (without actual key)
        keyName?: string;
        keyIn?: ApiKeyLocation;
      };
    };
  }>;
  authProviders: {
    oauth: Array<{
      name: string;
      authorizationUrl: string;
      tokenUrl: string;
      refreshUrl?: string;
      scopes: string[];
      contentType?: string;
    }>;
    apiKey: Array<{
      name: string;
      keyName: string;
      keyIn: ApiKeyLocation;
    }>;
  };
}

export async function exportServer(db: Database, tenantId: string, serverId: string): Promise<McpServerExport> {
  // Get server with all related data
  const server = await db.mcpServer.findUnique({
    where: {
      id: serverId,
      tenantId,
    },
    include: {
      authConfig: {
        include: {
          jwtProvider: true,
        },
      },
      folders: {
        orderBy: { name: "asc" },
      },
      tools: {
        include: {
          folder: true,
          oAuthProvider: true,
          apiKeyProvider: true,
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!server) {
    throw new Error("Server not found");
  }

  // Build folder hierarchy map
  const folderMap = new Map<string, string | undefined>();
  const folderById = new Map<string, (typeof server.folders)[0]>();

  server.folders.forEach((folder) => {
    folderById.set(folder.id, folder);
  });

  server.folders.forEach((folder) => {
    const parentFolder = folder.parentFolderId ? folderById.get(folder.parentFolderId) : undefined;
    folderMap.set(folder.id, parentFolder?.name);
  });

  // Collect unique auth providers
  const oauthProviders = new Map<string, (typeof server.tools)[0]["oAuthProvider"]>();
  const apiKeyProviders = new Map<string, (typeof server.tools)[0]["apiKeyProvider"]>();

  server.tools.forEach((tool) => {
    if (tool.oAuthProvider) {
      oauthProviders.set(tool.oAuthProvider.id, tool.oAuthProvider);
    }
    if (tool.apiKeyProvider) {
      apiKeyProviders.set(tool.apiKeyProvider.id, tool.apiKeyProvider);
    }
  });

  // Build export object
  const exportData: McpServerExport = {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    server: {
      name: server.name,
      description: server.description || undefined,
      baseUrl: server.baseUrl,
      enabled: server.enabled,
      authType: server.authType as ServerAuthType,
      authConfig: server.authConfig
        ? {
            authType: server.authConfig.authType as ServerAuthType,
            jwtProvider: server.authConfig.jwtProvider
              ? {
                  name: server.authConfig.jwtProvider.name,
                  jwksUrl: server.authConfig.jwtProvider.jwksUrl,
                  enabled: server.authConfig.jwtProvider.enabled,
                }
              : undefined,
          }
        : undefined,
    },
    folders: server.folders.map((folder) => ({
      name: folder.name,
      parentFolderName: folderMap.get(folder.id) || undefined,
    })),
    tools: server.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      method: tool.method as HttpMethod,
      url: tool.url,
      folderName: tool.folder?.name || undefined,
      enabled: tool.enabled,
      parameters: (tool.parameters as Record<string, Parameter>) || {},
      responses: tool.responses as Record<string, Response> | undefined,
      responseFormatting: tool.responseFormatting as FormattingConfig | undefined,
      requestParameterOverrides: tool.requestParameterOverrides as Record<string, RequestParamConfig> | null,
      authProvider: tool.oAuthProvider
        ? {
            type: "oauth" as const,
            name: tool.oAuthProvider.name,
            config: {
              authorizationUrl: tool.oAuthProvider.authorizationUrl,
              tokenUrl: tool.oAuthProvider.tokenUrl,
              refreshUrl: tool.oAuthProvider.refreshUrl || undefined,
              scopes: tool.oAuthProvider.scopes,
              contentType: tool.oAuthProvider.contentType || undefined,
            },
          }
        : tool.apiKeyProvider
          ? {
              type: "apiKey" as const,
              name: tool.apiKeyProvider.value,
              config: {
                keyName: tool.apiKeyProvider.keyName,
                keyIn: tool.apiKeyProvider.keyIn as ApiKeyLocation,
              },
            }
          : undefined,
    })),
    authProviders: {
      oauth: Array.from(oauthProviders.values()).map((provider) => ({
        name: provider!.name,
        authorizationUrl: provider!.authorizationUrl,
        tokenUrl: provider!.tokenUrl,
        refreshUrl: provider?.refreshUrl || undefined,
        scopes: provider!.scopes,
        contentType: provider?.contentType || undefined,
      })),
      apiKey: Array.from(apiKeyProviders.values()).map((provider) => ({
        name: provider!.value,
        keyName: provider!.keyName,
        keyIn: provider!.keyIn as ApiKeyLocation,
      })),
    },
  };

  return exportData;
}

export async function importServer(db: Database, tenantId: string, importData: McpServerExport): Promise<PrismaServer> {
  // Validate import data version
  if (importData.version !== "1.0.0") {
    throw new Error(`Unsupported import version: ${importData.version}`);
  }

  return await db.$transaction(async (tx: PrismaClient) => {
    // Create the server
    const server = await tx.mcpServer.create({
      data: {
        name: importData.server.name,
        description: importData.server.description || "",
        baseUrl: importData.server.baseUrl,
        enabled: importData.server.enabled,
        authType: importData.server.authType,
        tenantId,
      },
    });

    // Create JWT auth config if present
    if (importData.server.authConfig?.jwtProvider) {
      const jwtProvider = await tx.serverJwtProvider.create({
        data: {
          serverId: server.id,
          tenantId,
          name: importData.server.authConfig.jwtProvider.name,
          jwksUrl: importData.server.authConfig.jwtProvider.jwksUrl,
          enabled: importData.server.authConfig.jwtProvider.enabled,
        },
      });

      await tx.serverAuthConfig.create({
        data: {
          serverId: server.id,
          authType: importData.server.authConfig.authType,
          jwtProviderId: jwtProvider.id,
        },
      });
    }

    // Create auth providers
    const oauthProviderMap = new Map<string, string>();
    const apiKeyProviderMap = new Map<string, string>();

    for (const oauthConfig of importData.authProviders.oauth) {
      const provider = await tx.oAuthProvider.create({
        data: {
          name: oauthConfig.name,
          clientId: "", // User will need to configure
          clientSecret: "", // User will need to configure
          authorizationUrl: oauthConfig.authorizationUrl,
          tokenUrl: oauthConfig.tokenUrl,
          refreshUrl: oauthConfig.refreshUrl,
          scopes: oauthConfig.scopes,
          contentType: oauthConfig.contentType,
          tenantId,
          svg: getIcon("oauthGeneric"),
        },
      });
      oauthProviderMap.set(oauthConfig.name, provider.id);
    }

    for (const apiKeyConfig of importData.authProviders.apiKey) {
      const provider = await tx.apiKeyProvider.create({
        data: {
          value: apiKeyConfig.name,
          keyName: apiKeyConfig.keyName,
          keyIn: apiKeyConfig.keyIn,
          tenantId,
        },
      });
      apiKeyProviderMap.set(apiKeyConfig.name, provider.id);
    }

    // Create folders with hierarchy
    const folderMap = new Map<string, string>();
    const foldersToCreate = [...importData.folders];
    const createdFolders = new Set<string>();

    // Create folders without parents first
    for (const folderData of foldersToCreate.filter((f) => !f.parentFolderName)) {
      const folder = await tx.folder.create({
        data: {
          name: folderData.name,
          serverId: server.id,
          tenantId,
        },
      });
      folderMap.set(folderData.name, folder.id);
      createdFolders.add(folderData.name);
    }

    // Create folders with parents
    while (foldersToCreate.some((f) => f.parentFolderName && !createdFolders.has(f.name))) {
      for (const folderData of foldersToCreate.filter(
        (f) => f.parentFolderName && !createdFolders.has(f.name) && createdFolders.has(f.parentFolderName!),
      )) {
        const parentId = folderMap.get(folderData.parentFolderName!);
        const folder = await tx.folder.create({
          data: {
            name: folderData.name,
            parentFolderId: parentId,
            serverId: server.id,
            tenantId,
          },
        });
        folderMap.set(folderData.name, folder.id);
        createdFolders.add(folderData.name);
      }
    }

    // Create tools
    for (const toolData of importData.tools) {
      const folderId = toolData.folderName ? folderMap.get(toolData.folderName) : undefined;

      let oAuthProviderId: string | undefined;
      let apiKeyProviderId: string | undefined;

      if (toolData.authProvider) {
        if (toolData.authProvider.type === "oauth") {
          oAuthProviderId = oauthProviderMap.get(toolData.authProvider.name);
        } else if (toolData.authProvider.type === "apiKey") {
          apiKeyProviderId = apiKeyProviderMap.get(toolData.authProvider.name);
        }
      }

      await tx.tool.create({
        data: {
          name: toolData.name,
          description: toolData.description,
          method: toolData.method,
          url: toolData.url,
          enabled: toolData.enabled,
          parameters: toolData.parameters || {},
          responses: toolData.responses || {},
          responseFormatting: toolData.responseFormatting || {},
          requestParameterOverrides: toolData.requestParameterOverrides || null,
          serverId: server.id,
          tenantId,
          folderId,
          oAuthProviderId,
          apiKeyProviderId,
        },
      });
    }

    return server;
  });
}
