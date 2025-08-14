import { FormattingConfig, RequestParamConfig } from "@agentbridge/api";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { Tool } from "@prisma/client";
import axios, { AxiosError, AxiosResponse, isAxiosError } from "axios";
import Handlebars from "handlebars";
import { OpenAPIV3 } from "openapi-types";
import { Logger } from "winston";
import { HttpRequestOverrides } from "../../utils/generateRequestOverrides.js";
import { jsonValueToRecord } from "../../utils/json.js";
import { buildRequestConfig } from "./parameter-schema.js";

// Register Handlebars helpers
Handlebars.registerHelper("json", function (context) {
  return JSON.stringify(context);
});

// Comparison helpers
Handlebars.registerHelper("eq", function (a, b) {
  return a === b;
});

Handlebars.registerHelper("ne", function (a, b) {
  return a !== b;
});

Handlebars.registerHelper("gt", function (a, b) {
  return a > b;
});

Handlebars.registerHelper("lt", function (a, b) {
  return a < b;
});

// String concatenation helper
Handlebars.registerHelper("concat", function (...args) {
  args.pop(); // Remove the options object
  return args.join("");
});

// Encoding helper
Handlebars.registerHelper("base64", function (str) {
  if (typeof str !== "string") {
    throw new Error(`base64 helper expects string, got ${typeof str}`);
  }
  return Buffer.from(str, "utf8").toString("base64");
});

const logApiCall = (
  logger: Logger,
  tool: Tool,
  baseUrl: string,
  startTime: number,
  isPlayground: boolean,
  response: AxiosResponse | null,
) => {
  // Do not change the phrasing of this log message, it is used for metric extractions:
  //  https://github.com/OwnID/datadog-terraform/blob/develop/monitors/metric_agentbridge.tf
  logger.info("Analytics: API call completed", {
    toolId: tool.id,
    baseUrl,
    url: tool.url,
    method: tool.method,
    statusCode: response?.status || 0,
    bodyLen: response?.data ? String(response.data).length : 0,
    durationMS: Date.now() - startTime,
    failed: !response || response?.status >= 300 || response?.status < 200,
    isPlayground,
  });
};

export async function executeApiRequest(
  tool: Tool,
  baseUrl: string,
  specParameters: Record<string, OpenAPIV3.ParameterObject>,
  callParameters: Record<string, unknown>,
  logger: Logger,
  isPlayground = false,
  authContext?: Record<string, unknown>,
): Promise<CallToolResult> {
  const responseFormatting: FormattingConfig = tool.responseFormatting
    ? JSON.parse(JSON.stringify(tool.responseFormatting))
    : {};

  const startTime = Date.now();

  // Capture request data for templating if enabled (declare outside try block for error handling)
  let requestData: Record<string, unknown> | null = null;

  try {
    // Process request parameter overrides if configured
    let finalParameters = callParameters;
    let finalSpecParameters = specParameters;

    if (tool.requestParameterOverrides) {
      const overrides = tool.requestParameterOverrides as Record<string, RequestParamConfig> | HttpRequestOverrides;

      // Check if this is the new format (has query/headers/path/body properties)
      const isNewFormat = "query" in overrides || "headers" in overrides || "path" in overrides || "body" in overrides;

      if (isNewFormat) {
        logger.debug(`Using new HTTP request override format`);

        // Build parameters from the new format
        finalParameters = {};
        const newSpecParameters: Record<string, OpenAPIV3.ParameterObject> = {};

        // Process query parameters
        if (overrides.query) {
          for (const [key, value] of Object.entries(overrides.query)) {
            const processedValue = processHandlebarsTemplate(logger, value as string, { toolParams: callParameters });
            // Only add non-empty query parameters
            if (processedValue !== "" && processedValue !== null && processedValue !== undefined) {
              finalParameters[key] = processedValue;
              newSpecParameters[key] = {
                name: key,
                in: "query",
                required: specParameters[key]?.required || false,
                schema: specParameters[key]?.schema || { type: "string" },
              };
            } else {
              logger.debug(`Skipping empty query parameter: ${key}`);
            }
          }
        }

        // Process headers
        if (overrides.headers) {
          for (const [key, value] of Object.entries(overrides.headers)) {
            const processedValue = processHandlebarsTemplate(logger, value as string, {
              toolParams: callParameters,
              auth: authContext || {},
            });
            // Only add non-empty headers
            if (processedValue !== "" && processedValue !== null && processedValue !== undefined) {
              finalParameters[key] = processedValue;
              newSpecParameters[key] = {
                name: key,
                in: "header",
                required: specParameters[key]?.required || false,
                schema: specParameters[key]?.schema || { type: "string" },
              };
            } else {
              logger.debug(`Skipping empty header parameter: ${key}`);
            }
          }
        }

        // Process path parameters
        if (overrides.path) {
          for (const [key, value] of Object.entries(overrides.path)) {
            const processedValue = processHandlebarsTemplate(logger, value as string, { toolParams: callParameters });
            // Path parameters should typically always have a value, but we'll check anyway
            if (processedValue !== "" && processedValue !== null && processedValue !== undefined) {
              finalParameters[key] = processedValue;
              newSpecParameters[key] = {
                name: key,
                in: "path",
                required: specParameters[key]?.required || true, // Path params are usually required
                schema: specParameters[key]?.schema || { type: "string" },
              };
            } else {
              logger.warn(`Empty path parameter: ${key} - this may cause request to fail`);
            }
          }
        }

        // Process body
        if (overrides.body !== undefined) {
          const bodyFormat = overrides.bodyFormat || "json";

          if (bodyFormat === "form") {
            // Handle form-encoded body - extract individual form fields
            if (typeof overrides.body === "object" && overrides.body !== null) {
              for (const [fieldName, fieldTemplate] of Object.entries(overrides.body)) {
                const processedValue = processHandlebarsTemplate(logger, fieldTemplate as string, {
                  toolParams: callParameters,
                });
                if (processedValue !== "" && processedValue !== null && processedValue !== undefined) {
                  finalParameters[fieldName] = processedValue;
                  newSpecParameters[fieldName] = {
                    name: fieldName,
                    in: "formData",
                    required: false,
                    schema: { type: "string" },
                  };
                }
              }
            }
          } else {
            // Handle JSON body (existing logic)
            let bodyValue = overrides.body;

            // If body is an object/array, process template strings within it while preserving types
            if (typeof bodyValue === "object" && bodyValue !== null) {
              bodyValue = processTemplateInObject(logger, bodyValue, { toolParams: callParameters }) as
                | Record<string, unknown>
                | unknown[]
                | string;
            } else if (typeof bodyValue === "string") {
              bodyValue = processHandlebarsTemplate(logger, bodyValue, { toolParams: callParameters });
            }

            finalParameters.body = bodyValue;
            newSpecParameters.body = {
              name: "body",
              in: "body",
              required: specParameters.body?.required || false,
              schema: specParameters.body?.schema || { type: "object" },
            };
          }
        }

        finalSpecParameters = newSpecParameters;
      } else {
        // Old format - existing logic
        logger.debug(`Using old request parameter override format`);
        // const oldOverrides = overrides as Record<string, RequestParamConfig>;

        // Build a new parameters object based on overrides
        finalParameters = {};
        const newSpecParameters: Record<string, OpenAPIV3.ParameterObject> = {};

        // Process each override
        for (const [paramName, override] of Object.entries(overrides)) {
          // Process the template value
          const processedValue = processHandlebarsTemplate(logger, override.value, {
            toolParams: callParameters,
            auth: authContext || {},
          });
          finalParameters[paramName] = processedValue;

          // Create or update the parameter spec
          newSpecParameters[paramName] = {
            name: paramName,
            in: override.location as OpenAPIV3.ParameterObject["in"],
            required: specParameters[paramName]?.required || false,
            schema: specParameters[paramName]?.schema || { type: "string" },
          };
        }

        // Use the new parameter specifications
        finalSpecParameters = newSpecParameters;
      }

      logger.debug(`Applied request parameter overrides`, {
        original: callParameters,
        overrides,
        final: finalParameters,
        specs: finalSpecParameters,
        format: isNewFormat ? "new" : "old",
      });
    }

    const { config, missingRequiredParam } = buildRequestConfig(
      logger,
      tool.method,
      tool.url,
      baseUrl,
      finalSpecParameters,
      finalParameters,
      tool.name,
    );

    if (missingRequiredParam) {
      return {
        content: [
          {
            type: "text",
            text: `Required parameter ${missingRequiredParam} is missing`,
          },
        ],
        isError: true,
      };
    }

    logger.debug(
      `Executing API call with config: ${JSON.stringify({
        method: config.method,
        url: config.url,
        headers: config.headers,
        params: config.params,
        data: config.data ? "[DATA]" : null,
      })}`,
    );

    // Capture request data for templating if enabled
    requestData = responseFormatting.includeRequestData
      ? {
          schema: specParameters,
          data: {
            parameters: {
              headers: config.headers || {},
              query: config.params || {},
              path: extractPathParams(tool.url, finalParameters, finalSpecParameters),
            },
            payload: config.data || {},
          },
        }
      : null;

    const response = await axios(config);

    logger.debug(`API call completed, status: ${response.status}`);

    const result = {
      schema: getResponseSchema(jsonValueToRecord(tool.responses), response.status, response.headers["content-type"]),
      data: {
        headers: response.headers,
        body: response.data,
      },
    };

    logger.debug(`API call result:`, { result });

    let formattedResponse: string;

    if (responseFormatting.template) {
      logger.debug(`Formatting response with template`);
      const templateData = {
        request: requestData,
        response: result,
        toolParams: callParameters,
        auth: authContext || {},
      };
      formattedResponse = processHandlebarsTemplate(logger, responseFormatting.template, templateData);
    } else if (responseFormatting.itemTemplate && Array.isArray(result.data.body)) {
      logger.debug(`Formatting response as array with itemTemplate`);
      const header = responseFormatting.header
        ? processHandlebarsTemplate(logger, responseFormatting.header, { count: result.data.body.length })
        : "";

      if (result.data.body.length === 0 && responseFormatting.emptyResult) {
        formattedResponse = `${header}${responseFormatting.emptyResult}`;
      } else {
        const separator = responseFormatting.separator || "\n\n";
        const items = result.data.body.map((item) =>
          processHandlebarsTemplate(logger, responseFormatting.itemTemplate!, {
            item,
            request: requestData,
            response: result,
            toolParams: callParameters,
            auth: authContext || {},
          }),
        );
        formattedResponse = `${header}${items.join(separator)}`;
      }
    } else {
      logger.debug(`No formatting configuration, returning JSON string`);
      formattedResponse = typeof result === "string" ? result : JSON.stringify(result, null, 2);
    }

    logger.debug(`Returning tool response (${formattedResponse.length} chars)`);

    logApiCall(logger, tool, baseUrl, startTime, isPlayground, response);

    return {
      content: [
        {
          type: "text",
          text: formattedResponse,
        },
      ],
    };
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError;
      logApiCall(logger, tool, baseUrl, startTime, isPlayground, axiosError.response || null);
      logger.debug(
        `API call failed: ${axiosError.config?.method} ${axiosError.config?.url} - ${axiosError.response?.status}`,
        {
          status: axiosError.response?.status,
          method: axiosError.config?.method,
          url: axiosError.config?.url,
        },
      );
    } else {
      logApiCall(logger, tool, baseUrl, startTime, isPlayground, null);
      logger.debug(`API call failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (responseFormatting.errorTemplate) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const templateData = {
        error: errorMessage,
        message: errorMessage,
        request: requestData,
        response: {
          schema: getResponseSchema(jsonValueToRecord(tool.responses), 0, "application/json"),
          data: {
            headers: {},
            body: { error: errorMessage },
          },
        },
        toolParams: callParameters,
        auth: authContext || {},
      };
      const formattedError = processHandlebarsTemplate(
        logger,
        responseFormatting.errorTemplate as string,
        templateData,
      );

      logger.debug(`Returning formatted error: ${formattedError}`);

      return {
        content: [
          {
            type: "text",
            text: formattedError,
          },
        ],
        isError: true,
      };
    }

    let formattedResponse: string;

    if (isAxiosError(error) && error.response) {
      const errorResponse = {
        data: {
          content: {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
          },
          headers: error.response.headers,
        },
        schema:
          getResponseSchema(
            jsonValueToRecord(tool.responses),
            error.response.status,
            error.response.headers["content-type"],
          ) || "no schema found for response",
      };
      formattedResponse = typeof errorResponse === "string" ? errorResponse : JSON.stringify(errorResponse, null, 2);
    } else {
      formattedResponse = `API call failed: ${error instanceof Error ? error.message : String(error)}`;
    }

    return {
      content: [
        {
          type: "text",
          text: formattedResponse,
        },
      ],
      isError: true,
    };
  }
}

function getResponseSchema(
  responses: Record<string, unknown>,
  status: string | number,
  contentType = "application/json",
) {
  const statusKey = String(status);

  const response = responses[statusKey] || responses["default"];
  if (!response) return undefined;

  if (
    typeof response === "object" &&
    response !== null &&
    "content" in response &&
    typeof (response as Record<string, unknown>).content === "object" &&
    (response as Record<string, unknown>).content !== null
  ) {
    const content = (response as { content: Record<string, { schema?: unknown }> }).content;
    if (content[contentType]?.schema) {
      return {
        ...response,
        content: content[contentType].schema,
      };
    }
    // Fallback: return the first available schema
    const firstContent = Object.values(content)[0];
    if (firstContent && typeof firstContent === "object" && "schema" in firstContent) {
      return (firstContent as { schema?: unknown }).schema;
    }
  }

  return undefined;
}

function extractPathParams(
  url: string,
  callParameters: Record<string, unknown>,
  specParameters: Record<string, OpenAPIV3.ParameterObject>,
): Record<string, unknown> {
  const pathParams: Record<string, unknown> = {};

  for (const [key, param] of Object.entries(specParameters)) {
    if (param.in === "path" && callParameters[key] !== undefined) {
      pathParams[key] = callParameters[key];
    }
  }

  return pathParams;
}

function processHandlebarsTemplate(logger: Logger, template: string, data: Record<string, unknown>): string {
  logger.debug(`Processing Handlebars template with data keys: ${Object.keys(data).join(", ")}`);

  if (!template) {
    return "";
  }

  try {
    const compiledTemplate = Handlebars.compile(template);
    return compiledTemplate(data);
  } catch (error) {
    logger.warn(`Error processing Handlebars template`, error);
    return `Template processing error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Process template strings in an object while preserving data types
 * Only processes string values that contain template syntax
 */
function processTemplateInObject(logger: Logger, obj: unknown, data: Record<string, unknown>): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => processTemplateInObject(logger, item, data));
  }

  // Handle objects
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string" && value.includes("{{")) {
        // This is a template string, process it
        const processed = processHandlebarsTemplate(logger, value, data);

        // Try to parse the result to preserve types
        // Check if it's a complete template replacement (e.g., "{{toolParams.someBoolean}}")
        if (value.trim().match(/^{{[^}]+}}$/)) {
          // This is a direct variable reference, try to get the actual value
          const varPath = value.trim().slice(2, -2).trim();
          const actualValue = getNestedValue(data, varPath);
          if (actualValue !== undefined) {
            result[key] = actualValue;
          } else {
            // Fallback to processed string if we can't find the actual value
            result[key] = tryParseValue(processed);
          }
        } else {
          // Mixed content, keep as string
          result[key] = processed;
        }
      } else if (typeof value === "object") {
        // Recursively process nested objects
        result[key] = processTemplateInObject(logger, value, data);
      } else {
        // Keep non-string values as-is
        result[key] = value;
      }
    }
    return result;
  }

  // Return primitive values as-is
  return obj;
}

/**
 * Get a nested value from an object using a dot-notation path
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Try to parse a string value to its appropriate type
 */
function tryParseValue(value: string): unknown {
  // Try boolean
  if (value === "true") return true;
  if (value === "false") return false;

  // Try number
  if (value !== "" && !isNaN(Number(value))) {
    return Number(value);
  }

  // Try null
  if (value === "null") return null;

  // Try JSON
  if (value.startsWith("{") || value.startsWith("[")) {
    try {
      return JSON.parse(value);
    } catch {
      // Not valid JSON, keep as string
    }
  }

  // Default to string
  return value;
}
