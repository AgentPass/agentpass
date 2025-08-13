import { PrismaClient } from "@prisma/client";
import { CoreMessage } from "ai";
import { Request, Response } from "express";
import { z } from "zod";
import {
  AIProvider,
  generateCompletion,
  generateHandlebarsTemplate,
  generateStructuredObject,
  getAvailableModels,
  getConfiguredProviders,
  streamAIAgentChat,
  streamChat,
  streamCompletion,
} from "../services/ai.service.js";

// Extended request interfaces
interface AuthenticatedRequest extends Request {
  db: PrismaClient;
  admin?: { tenantId: string; id: string };
  user?: { tenantId: string; id: string };
}

// JSON Schema interfaces
interface JsonSchemaProperty {
  type?: string;
  properties?: Record<string, JsonSchemaProperty>;
  items?: JsonSchemaProperty;
  required?: string[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
}

interface JsonSchema {
  type: string;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
}

// Convert JSON Schema to Zod Schema
function convertJsonSchemaToZod(jsonSchema: JsonSchema): z.ZodSchema {
  if (!jsonSchema || typeof jsonSchema !== "object") {
    throw new Error("Invalid JSON schema provided");
  }

  if (jsonSchema.type === "object" && jsonSchema.properties) {
    const zodProperties: Record<string, z.ZodTypeAny> = {};

    // Convert each property
    for (const [key, prop] of Object.entries(jsonSchema.properties)) {
      zodProperties[key] = convertPropertyToZod(prop);
    }

    let objectSchema = z.object(zodProperties);

    // Handle required fields
    if (Array.isArray(jsonSchema.required)) {
      // Zod object schema is strict by default, so we just need to handle optional fields
      const requiredFields = new Set(jsonSchema.required);
      const partialFields: Record<string, z.ZodTypeAny> = {};

      for (const [key, zodType] of Object.entries(zodProperties)) {
        if (!requiredFields.has(key)) {
          partialFields[key] = zodType.optional();
        } else {
          partialFields[key] = zodType;
        }
      }

      objectSchema = z.object(partialFields);
    }

    return objectSchema;
  }

  throw new Error("Unsupported schema type - only object schemas are supported");
}

function convertPropertyToZod(prop: JsonSchemaProperty): z.ZodTypeAny {
  if (!prop || typeof prop !== "object") {
    return z.string(); // Default fallback
  }

  switch (prop.type) {
    case "string":
      let stringSchema = z.string();
      if (prop.minLength) stringSchema = stringSchema.min(prop.minLength);
      if (prop.maxLength) stringSchema = stringSchema.max(prop.maxLength);
      return stringSchema;

    case "number":
      let numberSchema = z.number();
      if (prop.minimum !== undefined) numberSchema = numberSchema.min(prop.minimum);
      if (prop.maximum !== undefined) numberSchema = numberSchema.max(prop.maximum);
      return numberSchema;

    case "integer":
      let intSchema = z.number().int();
      if (prop.minimum !== undefined) intSchema = intSchema.min(prop.minimum);
      if (prop.maximum !== undefined) intSchema = intSchema.max(prop.maximum);
      return intSchema;

    case "boolean":
      return z.boolean();

    case "array":
      const itemSchema = prop.items ? convertPropertyToZod(prop.items) : z.any();
      return z.array(itemSchema);

    case "object":
      if (prop.properties) {
        const nestedProps: Record<string, z.ZodTypeAny> = {};
        for (const [key, nestedProp] of Object.entries(prop.properties)) {
          nestedProps[key] = convertPropertyToZod(nestedProp);
        }
        return z.object(nestedProps);
      }
      // For objects without defined properties or with additionalProperties: true, use z.record()
      return z.record(z.unknown());

    default:
      return z.unknown(); // Fallback for unknown types
  }
}

// Request validation schemas
const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    }),
  ),
  config: z
    .object({
      provider: z.enum(["openai", "anthropic"]).optional(),
      model: z.string().optional(),
      maxTokens: z.number().positive().optional(),
      topP: z.number().min(0).max(1).optional(),
    })
    .optional(),
});

const completionRequestSchema = z.object({
  prompt: z.string().min(1),
  config: z
    .object({
      provider: z.enum(["openai", "anthropic"]).optional(),
      model: z.string().optional(),
      maxTokens: z.number().positive().optional(),
      topP: z.number().min(0).max(1).optional(),
    })
    .optional(),
  enableWebSearch: z.boolean().optional(),
});

const streamCompletionRequestSchema = completionRequestSchema.extend({
  enableReasoning: z.boolean().optional(),
});

const agentChatRequestSchema = completionRequestSchema.extend({
  conversationHistory: z.string().optional(),
  hasShownDesign: z.boolean().optional(),
  serverId: z.string().optional(),
});

const templateRequestSchema = z.object({
  tool: z.object({
    name: z.string(),
    description: z.string(),
    method: z.string(),
    url: z.string(),
    parameters: z.record(z.unknown()).optional().nullable(),
    requestParameterOverrides: z.record(z.unknown()).optional().nullable(),
    responses: z.record(z.unknown()).optional().nullable(),
  }),
  config: z
    .object({
      provider: z.enum(["openai", "anthropic"]).optional(),
      model: z.string().optional(),
      maxTokens: z.number().positive().optional(),
      topP: z.number().min(0).max(1).optional(),
    })
    .optional(),
});

// Stream chat response
export async function chatStream(req: Request, res: Response) {
  try {
    // Validate request body
    const body = chatRequestSchema.parse(req.body);

    // Get tenant ID from authenticated user (admin or end user)
    const authReq = req as unknown as AuthenticatedRequest;
    const admin = authReq.admin;
    const user = authReq.user;
    const tenantId = admin?.tenantId || user?.tenantId;
    const userId = admin?.id || user?.id;

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required" });
    }

    // Set up SSE headers for streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

    // Stream the chat response
    const result = await streamChat((req as unknown as AuthenticatedRequest).db, {
      messages: body.messages as CoreMessage[],
      config: body.config,
      tenantId,
      userId,
    });

    // Convert to data stream response
    const response = result.toTextStreamResponse();

    // Pipe the response body to our response
    if (response.body) {
      const reader = response.body.getReader();
      let chunkCount = 0;
      let totalBytes = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log(`🏁 Stream finished after ${chunkCount} chunks, ${totalBytes} total bytes`);
            break;
          }

          chunkCount++;
          totalBytes += value.length;

          // Write the chunk to the response
          res.write(value);
        }
      } finally {
        reader.releaseLock();
      }
    } else {
      console.error(`❌ No response body from stream`);
    }

    res.end();
  } catch (error) {
    console.error("Chat stream error:", error);

    // If headers haven't been sent, send error response
    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to process chat request",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } else {
      // If streaming has started, send error event
      res.write(`data: ${JSON.stringify({ error: "Stream error occurred" })}\n\n`);
      res.end();
    }
  }
}

// Generate text completion
export async function generateCompletionHandler(req: Request, res: Response) {
  try {
    // Validate request body
    const body = completionRequestSchema.parse(req.body);

    // Get tenant ID from authenticated user (admin or end user)
    const authReq = req as unknown as AuthenticatedRequest;
    const admin = authReq.admin;
    const user = authReq.user;
    const tenantId = admin?.tenantId || user?.tenantId;
    const userId = admin?.id || user?.id;

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required" });
    }

    // Generate completion
    const result = await generateCompletion((req as unknown as AuthenticatedRequest).db, {
      prompt: body.prompt,
      config: body.config,
      tenantId,
      userId,
      enableWebSearch: body.enableWebSearch,
    });

    // Return the result
    res.json({
      text: result.text,
      usage: result.usage,
      finishReason: result.finishReason,
    });
  } catch (error) {
    console.error("Completion error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request",
        details: error.errors,
      });
    }

    res.status(500).json({
      error: "Failed to generate completion",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Stream text completion with reasoning support
export async function streamCompletionHandler(req: Request, res: Response) {
  try {
    // Validate request body
    const body = streamCompletionRequestSchema.parse(req.body);

    // Get tenant ID from authenticated user (admin or end user)
    const authReq = req as unknown as AuthenticatedRequest;
    const admin = authReq.admin;
    const user = authReq.user;
    const tenantId = admin?.tenantId || user?.tenantId;
    const userId = admin?.id || user?.id;

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required" });
    }

    // Set up SSE headers for streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    // Stream the completion
    const result = await streamCompletion((req as unknown as AuthenticatedRequest).db, {
      prompt: body.prompt,
      config: body.config,
      tenantId,
      userId,
      enableWebSearch: body.enableWebSearch,
      enableReasoning: body.enableReasoning,
    });

    // Convert to UI message stream response with reasoning enabled
    const response = result.toUIMessageStreamResponse({
      sendReasoning: body.enableReasoning || false,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });

    // Pipe the response body to our response
    if (response.body) {
      const reader = response.body.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      } finally {
        reader.releaseLock();
      }
    }

    res.end();
  } catch (error) {
    console.error("Stream completion error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to stream completion",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error occurred" })}\n\n`);
      res.end();
    }
  }
}

// Generate structured object
export async function generateObjectHandler(req: Request, res: Response) {
  try {
    const { prompt, schema: schemaDefinition, config } = req.body;

    // Get tenant ID from authenticated user (admin or end user)
    const authReq = req as unknown as AuthenticatedRequest;
    const admin = authReq.admin;
    const user = authReq.user;
    const tenantId = admin?.tenantId || user?.tenantId;
    const userId = admin?.id || user?.id;

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required" });
    }

    if (!prompt || !schemaDefinition) {
      return res.status(400).json({
        error: "Prompt and schema are required",
      });
    }

    // Convert JSON schema to Zod schema
    let schema: z.ZodSchema;
    try {
      schema = convertJsonSchemaToZod(schemaDefinition);
    } catch (error) {
      console.error("❌ Schema conversion error:", error);
      return res.status(400).json({
        error: "Invalid schema definition",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Generate structured object
    const result = await generateStructuredObject((req as unknown as AuthenticatedRequest).db, {
      prompt,
      schema,
      config,
      tenantId,
      userId,
    });

    // Return the result
    res.json({
      object: result.object,
      usage: result.usage,
      finishReason: result.finishReason,
    });
  } catch (error) {
    console.error("Generate object error:", error);

    res.status(500).json({
      error: "Failed to generate object",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Stream AI agent chat with centralized prompts
export async function streamAIAgentChatHandler(req: Request, res: Response) {
  try {
    // Validate request body
    const body = agentChatRequestSchema.parse(req.body);

    // Get tenant ID from authenticated user (admin or end user)
    const authReq = req as unknown as AuthenticatedRequest;
    const admin = authReq.admin;
    const user = authReq.user;
    const tenantId = admin?.tenantId || user?.tenantId;
    const userId = admin?.id || user?.id;

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required" });
    }

    // Set up SSE headers for streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    // Stream the AI agent chat response
    const result = await streamAIAgentChat((req as unknown as AuthenticatedRequest).db, {
      prompt: body.prompt,
      conversationHistory: body.conversationHistory,
      hasShownDesign: body.hasShownDesign,
      serverId: body.serverId,
      config: body.config,
      tenantId,
      userId,
    });

    // Convert to UI message stream response for richer interaction
    const response = result.toUIMessageStreamResponse();

    // Pipe the response body to our response
    if (response.body) {
      const reader = response.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      } finally {
        reader.releaseLock();
      }
    }

    res.end();
  } catch (error) {
    console.error("AI agent chat stream error:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to process AI agent chat request",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } else {
      // Send error in UI message stream format
      const errorData = JSON.stringify({
        type: "error",
        error: error instanceof Error ? error.message : "Stream error occurred",
      });
      res.write(`${errorData}\n`);
      res.end();
    }
  }
}

// Generate agent-optimized response template
export async function generateTemplateHandler(req: Request, res: Response) {
  try {
    // Validate request body
    const body = templateRequestSchema.parse(req.body);

    // Get tenant ID from authenticated user (admin or end user)
    const authReq = req as unknown as AuthenticatedRequest;
    const admin = authReq.admin;
    const user = authReq.user;
    const tenantId = admin?.tenantId || user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required" });
    }

    const { tool, config } = body;

    // Use requestParameterOverrides if available, otherwise fall back to parameters
    // Handle null values by converting them to empty objects
    const parametersToUse = tool.requestParameterOverrides || tool.parameters || {};

    // Build the tool context for the prompt
    const toolContext = {
      toolName: tool.name,
      toolDescription: tool.description,
      method: tool.method,
      url: tool.url,
      parameters: JSON.stringify(parametersToUse, null, 2),
      responses: JSON.stringify(tool.responses || {}, null, 2),
    };

    // Generate template using the centralized backend function
    const result = await generateHandlebarsTemplate((req as unknown as AuthenticatedRequest).db, toolContext, config);

    // Extract the template from the completion
    let template = result.text.trim();

    // Remove code fence markers if present
    if (template.startsWith("```") && template.endsWith("```")) {
      const lines = template.split("\n");
      if (lines.length > 2) {
        template = lines.slice(1, -1).join("\n");
      }
    }

    // Return the generated template
    res.json({
      template,
      usage: result.usage,
      finishReason: result.finishReason,
    });
  } catch (error) {
    console.error("Template generation error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request",
        details: error.errors,
      });
    }

    res.status(500).json({
      error: "Failed to generate template",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Get AI configuration and available providers
export async function getAIConfig(req: Request, res: Response) {
  try {
    const providers = getConfiguredProviders();

    const config = {
      providers: providers.map((provider) => ({
        id: provider,
        name: provider.charAt(0).toUpperCase() + provider.slice(1),
        models: getAvailableModels(provider as AIProvider),
        configured: true,
      })),
      defaultProvider: providers[0] || null,
    };

    res.json(config);
  } catch (error) {
    console.error("Get AI config error:", error);
    res.status(500).json({
      error: "Failed to get AI configuration",
    });
  }
}
