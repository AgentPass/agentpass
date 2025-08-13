import { AdminRole } from "@prisma/client";
import { PrismaClient } from "@prisma/client/extension";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Logger } from "winston";
import { AdminRequest } from "../utils/req-guards.js";
import { createServerFromOpenApi } from "./servers.controller.js";

// Mock OpenAPIParser
jest.mock("@readme/openapi-parser", () => ({
  __esModule: true,
  validate: jest.fn().mockResolvedValue({ valid: true }),
}));

describe("Servers Controller", () => {
  describe("createServerFromOpenApi", () => {
    let mockRequest: Partial<AdminRequest>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
      mockRequest = {
        body: Buffer.from(""),
        query: {},
        headers: {
          "content-type": "application/octet-stream",
        },
        admin: {
          id: "test-admin-id",
          email: "admin@test.com",
          tenantId: "test-tenant-id",
          name: "Test Admin",
          picture: null,
          admin: true,
          role: AdminRole.admin,
        },
        db: {
          $transaction: jest.fn().mockImplementation(async (callback) => {
            return await callback({
              mcpServer: mockRequest.db?.mcpServer,
              folder: mockRequest.db?.folder,
              tool: mockRequest.db?.tool,
            });
          }),
          mcpServer: {
            create: jest.fn().mockResolvedValue({
              id: "test-server-id",
              name: "Test Server",
              description: "Test Description",
              enabled: true,
              baseUrl: "https://api.example.com/v1",
              tenantId: "test-tenant-id",
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
            findFirst: jest.fn().mockResolvedValue(null),
          },
          tenant: {
            findUnique: jest.fn().mockResolvedValue({
              id: "test-tenant-id",
              name: "Test Tenant",
              description: "Test Description",
            }),
          },
          folder: {
            create: jest.fn().mockResolvedValue({ id: "test-folder-id" }),
            findFirst: jest.fn().mockResolvedValue({ id: "test-folder-id" }),
          },
          apiCall: {
            create: jest.fn().mockResolvedValue({
              id: "test-api-call-id",
              method: "GET",
              url: "/test",
              headers: {},
              body: null,
            }),
          },
          tool: {
            create: jest.fn().mockResolvedValue({
              id: "test-tool-id",
              name: "Test Tool",
              description: "Test Description",
              parameters: [],
              apiCallId: "test-api-call-id",
              responseFormatting: {},
              tenantId: "test-tenant-id",
              serverId: "test-server-id",
              folderId: "test-folder-id",
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          },
        } as unknown as PrismaClient,
        logger: {
          info: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
        } as unknown as Logger,
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        send: jest.fn(),
      };
    });

    it("should create a server from valid OpenAPI specification", async () => {
      const validOpenApi = `
openapi: 3.0.0
info:
  title: Test Server
  description: Test Description
  version: 1.0.0
servers:
  - url: https://api.example.com/v1
    description: Production server
paths:
  /users:
    get:
      operationId: listUsers
      summary: List all users
      description: Returns a list of users with pagination
      tags:
        - Users
      parameters:
        - name: page
          in: query
          description: Page number
          required: false
          schema:
            type: integer
        - name: limit
          in: query
          description: Items per page
          required: false
          schema:
            type: integer
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
    post:
      operationId: createUser
      summary: Create a new user
      description: Creates a new user in the system
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserInput'
      responses:
        '201':
          description: User created successfully
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        email:
          type: string
    UserInput:
      type: object
      required:
        - name
        - email
      properties:
        name:
          type: string
        email:
          type: string
          format: email
`;

      mockRequest.body = Buffer.from(validOpenApi);

      await createServerFromOpenApi(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(mockRequest.db?.mcpServer.create).toHaveBeenCalledWith({
        data: {
          name: "Test Server",
          description: "Test Description",
          enabled: true,
          tenantId: "test-tenant-id",
          baseUrl: "https://api.example.com/v1",
        },
      });
      expect(mockRequest.db?.folder.create).toHaveBeenCalledTimes(1);
      expect(mockRequest.db?.folder.create).toHaveBeenCalledWith({
        data: {
          name: "Users",
          tenantId: "test-tenant-id",
          serverId: "test-server-id",
        },
      });
      expect(mockRequest.db?.tool.create).toHaveBeenCalledTimes(2);
      expect(mockRequest.db?.tool.create).toHaveBeenNthCalledWith(1, {
        data: {
          name: "list_users",
          description: "List all users",
          enabled: true,
          parameters: {
            page: {
              name: "page",
              in: "query",
              description: "Page number",
              required: false,
              schema: {
                type: "integer",
              },
            },
            limit: {
              name: "limit",
              in: "query",
              description: "Items per page",
              required: false,
              schema: {
                type: "integer",
              },
            },
          },
          method: "GET",
          url: "/users",
          responseFormatting: {},
          responses: {
            "200": {
              description: "Successful response",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/User",
                    },
                  },
                },
              },
            },
          },
          requestParameterOverrides: {
            query: {
              limit: "{{toolParams.limit}}",
              page: "{{toolParams.page}}",
            },
          },
          tenantId: "test-tenant-id",
          serverId: "test-server-id",
          folderId: "test-folder-id",
          oAuthProviderId: null,
          apiKeyProviderId: null,
        },
      });
      expect(mockRequest.db?.tool.create).toHaveBeenNthCalledWith(2, {
        data: {
          name: "create_user",
          enabled: true,
          description: "Create a new user",
          parameters: {
            body: {
              name: "body",
              in: "body",
              required: true,
              schema: {
                $ref: "#/components/schemas/UserInput",
              },
            },
          },
          method: "POST",
          url: "/users",
          responseFormatting: {},
          requestParameterOverrides: {
            body: "{{toolParams.body}}",
            bodyFormat: "json",
          },
          oAuthProviderId: null,
          apiKeyProviderId: null,
          folderId: null,
          tenantId: "test-tenant-id",
          serverId: "test-server-id",
          responses: {
            "201": {
              description: "User created successfully",
            },
          },
        },
      });
    });

    it("should handle empty OpenAPI content", async () => {
      mockRequest.body = Buffer.from("");

      await createServerFromOpenApi(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "invalid_openapi",
        errorDescription: "OpenAPI content is empty",
      });
    });

    it("should handle invalid OpenAPI format", async () => {
      const invalidOpenApi = "invalid: openapi: content";
      mockRequest.body = Buffer.from(invalidOpenApi);

      await createServerFromOpenApi(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "invalid_openapi",
        errorDescription: expect.stringContaining("Invalid OpenAPI"),
      });
    });

    it("should handle minimal OpenAPI content", async () => {
      const minimalOpenApi = `
openapi: 3.0.0
info:
  title: Test Server
servers:
  - url: https://api.example.com/v1
paths:
  /test:
    get:
      operationId: getTest
`;

      mockRequest.body = Buffer.from(minimalOpenApi);

      await createServerFromOpenApi(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(mockRequest.db?.mcpServer.create).toHaveBeenCalledWith({
        data: {
          name: "Test Server",
          description: "",
          enabled: true,
          tenantId: "test-tenant-id",
          baseUrl: "https://api.example.com/v1",
        },
      });
    });
  });
});
