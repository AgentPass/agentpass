import { OpenAPI } from "@agentbridge/utils";
import { readFileSync } from "fs";
import yaml from "js-yaml";
import { RefResolver } from "json-schema-ref-resolver";
import { join } from "path";
import { DeepPartial } from "../../types/deep-partial.js";
import { getMcpServerFromOpenApi, validateOpenApiContent } from "./parse.js";

describe("getMcpServerFromOpenApi", () => {
  it("should parse the fixed spotify.yaml and extract tools", () => {
    const yamlPath = join(__dirname, "testData", "fixed-spotify.yaml");
    const yamlContent = readFileSync(yamlPath, "utf8");
    const openApiContent = yaml.load(yamlContent) as DeepPartial<OpenAPI.Document>;

    const result = getMcpServerFromOpenApi(openApiContent);

    expect(result).toBeDefined();
    expect(Object.keys(result.server.folders).length).toBeGreaterThan(0);

    // Check that we have some expected endpoints
    const toolNames = Object.values(result.server.folders)
      .map((folder) => folder.map((tool) => tool.name))
      .flat();
    expect(toolNames).toContain("search");
    expect(toolNames).toContain("get-the-users-currently-player");
  });
});

describe("validateOpenApiContent", () => {
  it("should validate a valid OpenAPI document", () => {
    const validOpenApi: DeepPartial<OpenAPI.Document> = {
      info: {
        title: "Test API",
      },
      servers: [
        {
          url: "https://api.example.com",
        },
      ],
      components: {
        securitySchemes: {
          oauth2: {
            type: "oauth2",
            flows: {
              authorizationCode: {
                authorizationUrl: "https://example.com/oauth/authorize",
                tokenUrl: "https://example.com/oauth/token",
                scopes: {
                  read: "Read access",
                },
              },
            },
          },
        },
      },
    };
    const refResolver = new RefResolver();
    refResolver.addSchema(validOpenApi);
    expect(() => validateOpenApiContent(refResolver, validOpenApi)).not.toThrow();
  });

  it("should throw error for missing info section", () => {
    const invalidOpenApi: DeepPartial<OpenAPI.Document> = {
      servers: [
        {
          url: "https://api.example.com",
        },
      ],
    };
    const refResolver = new RefResolver();
    refResolver.addSchema(invalidOpenApi);
    expect(() => validateOpenApiContent(refResolver, invalidOpenApi)).toThrow("OpenAPI info section is required");
  });

  it("should throw error for missing title", () => {
    const invalidOpenApi: DeepPartial<OpenAPI.Document> = {
      info: {},
      servers: [
        {
          url: "https://api.example.com",
        },
      ],
    };
    const refResolver = new RefResolver();
    refResolver.addSchema(invalidOpenApi);
    expect(() => validateOpenApiContent(refResolver, invalidOpenApi)).toThrow("OpenAPI title is required");
  });

  it("should throw error for missing server URL", () => {
    const invalidOpenApi: DeepPartial<OpenAPI.Document> = {
      info: {
        title: "Test API",
      },
    };
    const refResolver = new RefResolver();
    refResolver.addSchema(invalidOpenApi);
    expect(() => validateOpenApiContent(refResolver, invalidOpenApi)).toThrow("Server URL is required");
  });

  it("should throw error for missing security schemes", () => {
    const invalidOpenApi: DeepPartial<OpenAPI.Document> = {
      info: {
        title: "Test API",
      },
      servers: [
        {
          url: "https://api.example.com",
        },
      ],
    };
    const refResolver = new RefResolver();
    refResolver.addSchema(invalidOpenApi);
    expect(() => validateOpenApiContent(refResolver, invalidOpenApi)).toThrow("Security schemes are required");
  });
});
