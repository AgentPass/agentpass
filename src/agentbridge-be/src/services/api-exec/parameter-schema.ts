import { AxiosRequestConfig } from "axios";
import { OpenAPIV3 } from "openapi-types";
import { Logger } from "winston";
import { z } from "zod";

type SchemaObject = OpenAPIV3.SchemaObject;
type ParameterObject = OpenAPIV3.ParameterObject;

export function createZodSchemaFromParameters(
  logger: Logger,
  parameters: Record<string, ParameterObject>,
): Record<string, z.ZodType<unknown>> {
  logger.debug(`Converting parameters to Zod schema`);
  const paramSchema: Record<string, z.ZodType<unknown>> = {};

  for (const [key, param] of Object.entries(parameters)) {
    logger.debug(`Processing parameter: ${key}`);

    if (!param || typeof param !== "object") {
      logger.debug(`Invalid parameter ${key}, defaulting to any`);
      paramSchema[key] = z.any();
      continue;
    }

    const isRequired = !!param.required;

    // Special handling for body parameters
    if (param.in === "body") {
      logger.debug(`Found body parameter: ${key}`);
      if (!param.schema) {
        paramSchema[key] = isRequired ? z.any() : z.any().optional();
        continue;
      }
      if ("$ref" in param.schema) {
        paramSchema[key] = isRequired ? z.any() : z.any().optional();
        continue;
      }
      const schema = param.schema as SchemaObject;
      if (schema.type === "object" && schema.properties) {
        // Create a schema based on the properties
        const bodySchema = z.object(
          Object.entries(schema.properties).reduce(
            (acc, [propName, propSchema]) => {
              const propType = (propSchema as SchemaObject).type;
              let zodType: z.ZodType = z.any();

              if (propType === "string") {
                zodType = z.string();
              } else if (propType === "number" || propType === "integer") {
                zodType = z.number();
              } else if (propType === "boolean") {
                zodType = z.boolean();
              } else if (propType === "array") {
                zodType = z.array(z.any());
              } else if (propType === "object") {
                zodType = z.record(z.any());
              }

              if ("description" in propSchema && propSchema.description) {
                zodType = zodType.describe(propSchema.description);
              }

              // Check if property is required in schema
              const isPropRequired = schema.required?.includes(propName) === true;
              acc[propName] = isPropRequired ? zodType : zodType.optional();
              return acc;
            },
            {} as Record<string, z.ZodType>,
          ),
        );

        paramSchema[key] = isRequired ? bodySchema : bodySchema.optional();
      } else {
        paramSchema[key] = isRequired ? z.any() : z.any().optional();
      }
      continue;
    }

    // Special handling for formData parameters
    if (param.in === "formData") {
      logger.debug(`Found formData parameter: ${key}`);
      if (!param.schema) {
        paramSchema[key] = isRequired ? z.string() : z.string().optional();
        continue;
      }
      if ("$ref" in param.schema) {
        paramSchema[key] = isRequired ? z.any() : z.any().optional();
        continue;
      }
      const schema = param.schema as SchemaObject;
      const schemaType = schema.type;

      // Handle formData parameter based on its type
      if (schemaType === "string") {
        paramSchema[key] = isRequired ? z.string() : z.string().optional();
      } else if (schemaType === "number" || schemaType === "integer") {
        paramSchema[key] = isRequired ? z.number() : z.number().optional();
      } else if (schemaType === "boolean") {
        paramSchema[key] = isRequired ? z.boolean() : z.boolean().optional();
      } else {
        paramSchema[key] = isRequired ? z.any() : z.any().optional();
      }
      continue;
    }

    if (!param.schema) {
      logger.debug(`No schema found for parameter ${key}, defaulting to any`);
      paramSchema[key] = isRequired ? z.any() : z.any().optional();
      continue;
    }

    if ("$ref" in param.schema) {
      logger.debug(`Reference schema found for parameter ${key}, defaulting to any`);
      paramSchema[key] = isRequired ? z.any() : z.any().optional();
      continue;
    }

    const schema = param.schema as SchemaObject;
    const schemaType = schema.type;

    switch (schemaType) {
      case "string":
        const stringSchema = z.string();

        if (schema.format === "date-time") {
          paramSchema[key] = isRequired ? z.string().datetime() : z.string().datetime().optional();
        } else if (schema.format === "email") {
          paramSchema[key] = isRequired ? z.string().email() : z.string().email().optional();
        } else if (schema.format === "uri") {
          paramSchema[key] = isRequired ? z.string().url() : z.string().url().optional();
        } else if (schema.enum) {
          if (Array.isArray(schema.enum) && schema.enum.length > 0) {
            paramSchema[key] = isRequired
              ? z.enum(schema.enum as [string, ...string[]])
              : z.enum(schema.enum as [string, ...string[]]).optional();
          } else {
            paramSchema[key] = isRequired ? stringSchema : stringSchema.optional();
          }
        } else {
          paramSchema[key] = isRequired ? stringSchema : stringSchema.optional();
        }
        break;

      case "number":
      case "integer":
        let numberSchema = z.number();

        if (typeof schema.minimum === "number") {
          numberSchema = numberSchema.min(schema.minimum);
        }
        if (typeof schema.maximum === "number") {
          numberSchema = numberSchema.max(schema.maximum);
        }

        paramSchema[key] = isRequired ? numberSchema : numberSchema.optional();
        break;

      case "boolean":
        paramSchema[key] = isRequired ? z.boolean() : z.boolean().optional();
        break;

      case "array":
        if (schema.items) {
          if ("$ref" in schema.items) {
            paramSchema[key] = isRequired ? z.array(z.any()) : z.array(z.any()).optional();
          } else {
            const itemSchema = schema.items as SchemaObject;
            const itemType = itemSchema.type;

            if (itemType === "string") {
              paramSchema[key] = isRequired ? z.array(z.string()) : z.array(z.string()).optional();
            } else if (itemType === "number" || itemType === "integer") {
              paramSchema[key] = isRequired ? z.array(z.number()) : z.array(z.number()).optional();
            } else if (itemType === "boolean") {
              paramSchema[key] = isRequired ? z.array(z.boolean()) : z.array(z.boolean()).optional();
            } else {
              paramSchema[key] = isRequired ? z.array(z.any()) : z.array(z.any()).optional();
            }
          }
        } else {
          paramSchema[key] = isRequired ? z.array(z.any()) : z.array(z.any()).optional();
        }
        break;

      case "object":
        paramSchema[key] = isRequired ? z.record(z.any()) : z.record(z.any()).optional();
        break;

      default:
        logger.debug(`Unknown parameter type ${schemaType} for ${key}, defaulting to any`);
        paramSchema[key] = isRequired ? z.any() : z.any().optional();
    }
    if (schema.description && paramSchema[key]) {
      paramSchema[key] = (paramSchema[key] as z.ZodType).describe(schema.description);
    }
  }

  return paramSchema;
}

export function buildRequestConfig(
  logger: Logger,
  apiCallMethod: string,
  apiCallUrl: string,
  baseUrl: string,
  specParameters: Record<string, ParameterObject>,
  callParameters: Record<string, unknown>,
  toolName: string,
): { config: AxiosRequestConfig; missingRequiredParam?: string } {
  const config: AxiosRequestConfig = {
    method: apiCallMethod.toLowerCase(),
    url: apiCallUrl.startsWith("http") ? apiCallUrl : baseUrl ? `${baseUrl}${apiCallUrl}` : apiCallUrl,
    headers: {},
    params: {},
    data: null,
  };

  for (const [key, param] of Object.entries(specParameters)) {
    if (!param || typeof param !== "object") {
      continue;
    }

    let value = callParameters[key];
    if (value === undefined) {
      if (param.schema && "default" in param.schema) {
        value = param.schema.default;
        logger.debug(`Using default value for parameter ${key}: ${value}`);
      } else if (param.required) {
        logger.debug(`Required parameter ${key} missing for tool ${toolName}`);
        return { config, missingRequiredParam: key };
      } else {
        logger.debug(`Optional parameter ${key} not provided`);
        continue;
      }
    }

    if (!param.in) {
      continue;
    }

    switch (param.in) {
      case "query":
        logger.debug(`Adding query parameter ${key}=${value}`);
        config.params = config.params || {};
        if (Array.isArray(value)) {
          config.params[key] = param.explode
            ? value
                .map(String)
                .map((v) => encodeURIComponent(v))
                .join("&")
            : value.map(String).map(encodeURIComponent).join(",");
        } else {
          config.params[key] = value;
        }
        break;

      case "path":
        logger.debug(`Replacing path parameter ${key}=${value}`);
        const pathValue = typeof value === "number" ? Math.floor(value).toString() : String(value);
        config.url = config.url?.replace(`{${key}}`, encodeURIComponent(pathValue));
        break;

      case "header":
        logger.debug(`Adding header ${key}=${value}`);
        config.headers = config.headers || {};
        config.headers[key] = String(value);
        break;

      case "cookie":
        logger.debug(`Adding cookie ${key}=${value}`);
        const cookieValue = `${key}=${encodeURIComponent(String(value))}`;
        if (config.headers?.Cookie) {
          config.headers.Cookie += `; ${cookieValue}`;
        } else {
          config.headers = config.headers || {};
          config.headers.Cookie = cookieValue;
        }
        break;

      case "formData":
        // Handle form data parameters - they'll be processed later
        logger.debug(`Found formData parameter ${key}, will process with body`);
        break;

      default:
        if (["POST", "PUT", "PATCH"].includes(apiCallMethod)) {
          logger.debug(`Adding ${key} to request body`);
          config.data = config.data || {};
          (config.data as Record<string, unknown>)[key] = value;
        }
    }
  }

  config.headers = config.headers || {};

  if (["POST", "PUT", "PATCH"].includes(apiCallMethod)) {
    const bodyParams: Record<string, unknown> = {};
    const formDataParams: Record<string, unknown> = {};
    let hasBodyParameter = false;
    let hasFormDataParameters = false;

    // Check for body or formData parameters
    for (const [key, param] of Object.entries(specParameters)) {
      if (param.in === "body" && callParameters[key] !== undefined) {
        logger.debug(`Found body parameter: ${key}`);
        config.data = callParameters[key];
        config.headers["Content-Type"] = "application/json";
        hasBodyParameter = true;
        break;
      } else if (param.in === "formData" && callParameters[key] !== undefined) {
        logger.debug(`Found formData parameter: ${key}`);
        formDataParams[key] = callParameters[key];
        hasFormDataParameters = true;
      }
    }

    // If we have formData parameters, use form-encoded format
    if (hasFormDataParameters && !hasBodyParameter) {
      logger.debug(`Building form-encoded body from formData parameters`);
      const formData = new URLSearchParams();
      for (const [key, value] of Object.entries(formDataParams)) {
        formData.append(key, String(value));
      }
      config.data = formData.toString();
      config.headers["Content-Type"] = "application/x-www-form-urlencoded";
    } else if (!hasBodyParameter) {
      // Default behavior for non-specified parameters
      for (const [key, value] of Object.entries(callParameters)) {
        const param = specParameters[key];
        if (
          !param ||
          (param.in !== "query" &&
            param.in !== "path" &&
            param.in !== "header" &&
            param.in !== "cookie" &&
            param.in !== "formData")
        ) {
          bodyParams[key] = value;
        }
      }

      if (Object.keys(bodyParams).length > 0) {
        logger.debug(`Building request body from non-path/query/header parameters`);
        config.data = bodyParams;
        config.headers["Content-Type"] = "application/json";
      }
    }
  }

  if (callParameters["Authorization"]) {
    config.headers["Authorization"] = callParameters["Authorization"];
  }

  return { config };
}
