import { HttpMethod, Parameter, RequestParamConfig } from "@agentbridge/api";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { PrismaClient } from "@prisma/client";
import { CoreMessage, generateObject, GenerateObjectResult, generateText, streamText, tool } from "ai";
import { z } from "zod";
import { HttpRequestOverrides } from "../utils/generateRequestOverrides.js";
import { anthropicApiKey, openaiApiKey } from "./ownid.secret.service.js";
import { PromptService } from "./prompts.service.js";

// AI Provider types
export type AIProvider = "openai" | "anthropic";

// Model configurations
const AI_MODELS = {
  openai: {
    chat: "gpt-4.1",
    completion: "gpt-4.1",
    advanced: "gpt-4.1",
  },
  anthropic: {
    chat: "claude-3-5-sonnet-20241022",
    completion: "claude-3-haiku-20240307",
    advanced: "claude-3-opus-20240229",
  },
} as const;

// Service configuration
export interface AIServiceConfig {
  provider?: AIProvider;
  model?: string;
  maxTokens?: number;
  topP?: number;
}

// Request types
export interface ChatRequest {
  messages: CoreMessage[];
  config?: AIServiceConfig;
  tenantId: string;
  userId?: string;
}

export interface CompletionRequest {
  prompt: string;
  config?: AIServiceConfig;
  tenantId: string;
  userId?: string;
  enableWebSearch?: boolean;
}

export interface StreamCompletionRequest extends CompletionRequest {
  enableReasoning?: boolean;
}

export interface AIAgentChatRequest extends CompletionRequest {
  conversationHistory?: string;
  hasShownDesign?: boolean;
}

export interface GenerateObjectRequest<T = unknown> {
  prompt: string;
  schema: z.ZodSchema<T>;
  config?: AIServiceConfig;
  tenantId: string;
  userId?: string;
}

// Get AI model based on provider and model type
async function getAIModel(provider: AIProvider = "openai", modelType = "chat") {
  const providerModels = AI_MODELS[provider];
  const modelName = providerModels[modelType as keyof typeof providerModels] || providerModels.chat;

  switch (provider) {
    case "anthropic": {
      const apiKey = await anthropicApiKey();
      const anthropic = createAnthropic({ apiKey });
      return anthropic(modelName);
    }
    case "openai":
    default: {
      const apiKey = await openaiApiKey();
      const openai = createOpenAI({ apiKey });
      // Use responses API for OpenAI models
      return openai.responses(modelName);
    }
  }
}

// Get API key for provider
async function getAPIKey(provider: AIProvider): Promise<string> {
  const keys = {
    openai: await openaiApiKey(),
    anthropic: await anthropicApiKey(),
  };

  const key = keys[provider];
  if (!key) {
    console.error(`API key not configured for provider: ${provider}`);
    throw new Error(`API key not configured for provider: ${provider}`);
  }

  return key;
}

// Stream text for chat conversations
export async function streamChat(prisma: PrismaClient, request: ChatRequest) {
  const { messages, config = {} } = request;
  const { provider = "openai", ...modelConfig } = config;

  // Get the appropriate model
  const model = await getAIModel(provider, "chat");

  // Messages are already in CoreMessage format
  const coreMessages = messages;

  const streamConfig = {
    model,
    messages: coreMessages,
    maxOutputTokens: modelConfig.maxTokens,
    topP: modelConfig.topP,
    system:
      "You are a concise, grounded assistant for AgentBridge. Prefer accurate, source-backed answers; ask one clarifying question when requirements are ambiguous; avoid speculation; never produce secrets or PII. Do not mention or imply your underlying model, provider, or architecture; if asked, reply: 'I can’t disclose model details.'",
  };

  try {
    // Add timeout to detect hanging calls
    const streamPromise = streamText(streamConfig);
    const timeoutPromise = new Promise<never>((resolve, reject) => {
      setTimeout(() => reject(new Error("StreamText call timed out after 30 seconds")), 30000);
    });

    const result = await Promise.race([streamPromise, timeoutPromise]);

    // Test if we can read from the stream immediately
    try {
      const textStreamResponse = result.toTextStreamResponse();
      console.log(`🔍 Text stream response created, status: ${textStreamResponse.status}`);
    } catch (streamError) {
      console.error(`❌ Error creating text stream response:`, streamError);
    }

    // TODO: Track usage in database if needed
    // This could be done by listening to the stream events

    return result;
  } catch (error) {
    console.error(`❌ Stream creation failed:`, error);

    // Enhanced error logging with better structure
    if (error instanceof Error) {
      console.error(`🔍 Error details:`);
      console.error(`  Message: ${error.message}`);
      console.error(`  Name: ${error.name}`);
      console.error(`  Stack: ${error.stack}`);
    }

    // Log the full error object to see its structure
    console.error(`🔍 Full error object:`, JSON.stringify(error, null, 2));

    // Check for API-specific error properties
    if (error && typeof error === "object") {
      const errorObj = error as {
        status?: number;
        statusCode?: number;
        code?: number;
        message?: string;
        error?: { message?: string };
      };

      // Check for status code in various possible locations
      const statusCode = errorObj.status || errorObj.statusCode || errorObj.code;
      const message = errorObj.message || errorObj.error?.message || String(error);

      console.error(`🔍 Extracted status: ${statusCode}, message: ${message}`);

      // Check for 429 errors specifically
      if (statusCode === 429 || message.includes("429") || message.includes("quota") || message.includes("exceeded")) {
        const quotaError = `❌ QUOTA EXCEEDED: You've exceeded your OpenAI quota. Please check your billing at https://platform.openai.com/account/billing`;
        console.error(quotaError);
        throw new Error(quotaError);
      }

      if (statusCode === 401 || message.includes("401") || message.includes("Unauthorized")) {
        const authError = `❌ INVALID API KEY: Please check your OpenAI API key`;
        console.error(authError);
        throw new Error(authError);
      }

      if (message.includes("rate limit")) {
        const rateLimitError = `❌ RATE LIMIT: Too many requests to ${provider}. Please try again later.`;
        console.error(rateLimitError);
        throw new Error(rateLimitError);
      }
    }

    throw error;
  }
}

// Generate text completion
export async function generateCompletion(prisma: PrismaClient, request: CompletionRequest) {
  const { prompt, config = {} } = request;
  // tenantId and userId are for future use in usage tracking
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { tenantId, userId } = request;
  const { provider = "openai", ...modelConfig } = config;

  // Get the appropriate model
  const model = await getAIModel(provider, "completion");

  // TODO: Web search will be re-added after responses API migration is complete
  // For now, focusing on basic migration without web search tools

  // Generate the response
  const result = await generateText({
    model,
    prompt,
    maxOutputTokens: modelConfig.maxTokens,
    topP: modelConfig.topP,
  });

  // TODO: Track usage in database if needed
  // You can access result.usage for token counts

  return result;
}

// Stream completion with reasoning support
export async function streamCompletion(prisma: PrismaClient, request: StreamCompletionRequest) {
  const { prompt, config = {}, enableReasoning = false } = request;
  // tenantId and userId are for future use in usage tracking
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { tenantId, userId } = request;
  const { provider = "openai", ...modelConfig } = config;

  // Get the appropriate model - use advanced model for reasoning if enabled
  const model = await getAIModel(provider, enableReasoning ? "advanced" : "completion");

  // Stream the response
  const result = streamText({
    model,
    prompt,
    maxOutputTokens: modelConfig.maxTokens,
    topP: modelConfig.topP,
  });

  // TODO: Track usage in database if needed
  // You can access result.usage for token counts

  return result;
}

// Generate structured object
export async function generateStructuredObject<T>(
  prisma: PrismaClient,
  request: GenerateObjectRequest<T>,
): Promise<GenerateObjectResult<T>> {
  const { prompt, schema, config = {} } = request;
  const { provider = "openai", ...modelConfig } = config;

  // Validate API key
  await getAPIKey(provider);

  // Get the appropriate model
  const model = await getAIModel(provider, "chat");

  // Generate the structured response with appropriate settings for complex schemas
  const result = await generateObject({
    model,
    output: "object", // Explicitly specify output mode
    schema,
    prompt,
    maxOutputTokens: modelConfig.maxTokens ?? 4096, // Ensure enough tokens for complex responses
    topP: modelConfig.topP,
    maxRetries: 2, // Retry on failures
  });

  // TODO: Track usage in database if needed

  return result;
}

// Get available models for a provider
export function getAvailableModels(provider: AIProvider) {
  return AI_MODELS[provider] || {};
}

// Check if a provider is configured
export async function isProviderConfigured(provider: AIProvider): Promise<boolean> {
  try {
    await getAPIKey(provider);
    return true;
  } catch {
    return false;
  }
}

// Get all configured providers
export function getConfiguredProviders(): AIProvider[] {
  const providers: AIProvider[] = ["openai", "anthropic"];
  return providers.filter(isProviderConfigured);
}

// AI Agent Chat with centralized prompt
export interface AIAgentChatRequest extends CompletionRequest {
  conversationHistory?: string;
  hasShownDesign?: boolean;
  serverId?: string;
}

export async function streamAIAgentChat(prisma: PrismaClient, request: AIAgentChatRequest) {
  const { conversationHistory = "", hasShownDesign = false, serverId, ...baseRequest } = request;
  const { config = {}, tenantId } = baseRequest;
  const { provider = "openai", ...modelConfig } = config;

  // Use centralized system prompt
  const systemPrompt = PromptService.renderPrompt("ai-agent-system", {
    conversationHistory,
    hasShownDesign: hasShownDesign
      ? "Note: You've already shown a tool design in this conversation. Check if the user is responding to it."
      : "",
  });

  if (!systemPrompt) {
    throw new Error("AI Agent system prompt not found");
  }

  // Validate API key
  const apiKey = await getAPIKey(provider);

  // Create provider instance (needed for both model and tools)
  const openaiProvider = provider === "openai" ? createOpenAI({ apiKey }) : null;

  // Get the appropriate model
  const model = await getAIModel(provider, "chat");

  // Store prisma in a variable that will be captured by the closure
  const db = prisma;

  // Define tools for the AI to use
  const tools = {
    // Use OpenAI's built-in web search as a provider-executed tool
    ...(openaiProvider
      ? {
          web_search_preview: openaiProvider.tools.webSearchPreview({
            searchContextSize: "medium",
          }),
        }
      : {}),

    // MCP tool creation - only if serverId is provided
    ...(serverId
      ? {
          createMCPTool: tool({
            description: "Create an MCP tool with the provided specification.",
            inputSchema: z.object({
              tool: z.object({
                name: z.string().describe("The name of the tool"),
                description: z.string().describe("Clear description of what this tool does"),
                method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).describe("HTTP method"),
                url: z.string().describe("The API endpoint URL"),
                parameters: z.object({}).passthrough().default({}).describe("Parameter definitions object."),
                requestParameterOverrides: z
                  .object({})
                  .passthrough()
                  .optional()
                  .describe("Direct HTTP request overrides (for GraphQL)"),
                responses: z.object({}).passthrough().default({}).optional().describe("Response definitions object"),
              }),
              auth: z
                .object({
                  type: z.enum(["oauth", "apikey", "none"]).describe("Authentication type"),
                  oauth: z
                    .object({
                      name: z.string().describe("OAuth provider name"),
                      authorizationUrl: z.string().describe("OAuth authorization URL"),
                      tokenUrl: z.string().describe("OAuth token URL"),
                      scopes: z.array(z.string()).describe("Required OAuth scopes"),
                      clientId: z.string().optional().describe("OAuth client ID"),
                      clientSecret: z.string().optional().describe("OAuth client secret"),
                    })
                    .optional(),
                  apikey: z
                    .object({
                      name: z.string().describe("API key provider name"),
                      keyName: z.string().describe("Header or query parameter name for the API key"),
                      keyIn: z.enum(["header", "query", "path", "body"]).describe("Where to send the API key"),
                    })
                    .optional(),
                })
                .optional(),
              service: z.string().describe("The service name (e.g., 'github', 'slack')"),
            }),
            execute: async ({ tool, auth, service }) => {
              try {
                const { createTool } = await import("./servers.service.js");
                const { generateRequestOverrides } = await import("../utils/generateRequestOverrides.js");

                let oAuthProviderId: string | undefined;

                // Create authentication providers if specified
                if (auth && auth.type !== "none") {
                  if (auth.type === "oauth" && auth.oauth) {
                    const oauthProvider = await db.oAuthProvider.create({
                      data: {
                        name: auth.oauth.name,
                        clientId: auth.oauth.clientId || "",
                        clientSecret: auth.oauth.clientSecret || "",
                        authorizationUrl: auth.oauth.authorizationUrl,
                        tokenUrl: auth.oauth.tokenUrl,
                        scopes: auth.oauth.scopes || [],
                        tenantId,
                      },
                    });
                    oAuthProviderId = oauthProvider.id;
                  }
                } else {
                  console.log("🔐 No authentication provider specified or auth type is 'none'");
                }

                // Check if requestParameterOverrides was provided directly (e.g., for GraphQL)
                let requestParameterOverrides: Record<string, RequestParamConfig> | HttpRequestOverrides;
                if (tool.requestParameterOverrides) {
                  requestParameterOverrides = tool.requestParameterOverrides;
                } else {
                  // Generate request overrides - this creates the proper HTTP request structure
                  const httpOverrides = generateRequestOverrides((tool.parameters || {}) as Record<string, Parameter>);
                  requestParameterOverrides = httpOverrides;
                }

                // Add API key to the appropriate location if configured
                if (auth && auth.type === "apikey" && auth.apikey) {
                  // For Authorization header, add "Bearer " prefix
                  const template =
                    auth.apikey.keyName === "Authorization"
                      ? `Bearer {{${auth.apikey.keyName}}}`
                      : `{{${auth.apikey.keyName}}}`;

                  // Check if this is the new HTTP format (has body, bodyFormat, headers, query, etc.)
                  const isHttpFormat =
                    "body" in requestParameterOverrides ||
                    "bodyFormat" in requestParameterOverrides ||
                    "headers" in requestParameterOverrides ||
                    "query" in requestParameterOverrides;

                  if (isHttpFormat) {
                    const httpOverrides = requestParameterOverrides as HttpRequestOverrides;
                    switch (auth.apikey.keyIn) {
                      case "header":
                        if (!httpOverrides.headers) {
                          httpOverrides.headers = {};
                        }
                        httpOverrides.headers[auth.apikey.keyName] = template;
                        break;
                      case "query":
                        if (!httpOverrides.query) {
                          httpOverrides.query = {};
                        }
                        httpOverrides.query[auth.apikey.keyName] = template;
                        break;
                    }
                    requestParameterOverrides = httpOverrides;
                  }
                }

                // Convert Zod parameters to the expected Parameter type structure
                const convertedParameters: Record<string, Parameter> = {};
                if (tool.parameters) {
                  for (const [key, param] of Object.entries(tool.parameters)) {
                    // Assume param already has the correct Parameter structure
                    // since it comes from the AI tool specification
                    convertedParameters[key] = param as Parameter;
                  }
                }

                // Create the tool - note the correct parameter order
                const toolData = {
                  name: tool.name,
                  description: tool.description,
                  method: tool.method as HttpMethod,
                  url: tool.url,
                  parameters: convertedParameters,
                  requestParameterOverrides: requestParameterOverrides as Record<string, RequestParamConfig> | null, // Type assertion needed for now
                  oAuthProviderId, // Only set for OAuth
                  apiKeyProviderId: undefined, // API keys are now embedded in parameters
                };

                if (!db) {
                  throw new Error("Prisma client is not available in tool execution context");
                }

                const createdTool = await createTool(db, serverId, tenantId, toolData);

                console.log("✅ Tool created successfully!");
                console.log("🆔 Created tool:", JSON.stringify(createdTool, null, 2));

                // Build success message with auth info
                let successMessage = `Successfully created tool "${tool.name}"!`;
                if (oAuthProviderId) {
                  successMessage += ` OAuth authentication provider has been configured.`;
                } else if (auth && auth.type === "apikey") {
                  successMessage += ` API Key parameter has been added to the tool.`;
                }
                successMessage += ` The tool is now available in your workflow canvas.`;

                return {
                  success: true,
                  message: successMessage,
                  toolId: createdTool.id,
                  toolName: createdTool.name,
                  authProviderId: oAuthProviderId,
                  authProviderType: oAuthProviderId ? "oauth" : auth?.type === "apikey" ? "apikey" : undefined,
                };
              } catch (error) {
                console.error("❌ [TOOL CREATION ERROR] Failed to create tool in backend");
                console.error("🔍 Error details:", error);
                console.error("📊 Stack trace:", error instanceof Error ? error.stack : "No stack trace");

                // Log specific error details
                if (error instanceof Error) {
                  console.error("📌 Error name:", error.name);
                  console.error("📌 Error message:", error.message);
                }

                return {
                  success: false,
                  message: `Failed to create tool: ${error instanceof Error ? error.message : "Unknown error"}`,
                  error: error instanceof Error ? error.message : "Unknown error",
                };
              }
            },
          }),
        }
      : {}),
  };

  // Include conversation history if provided
  const contextSection = conversationHistory ? `\n\nPrevious conversation:\n${conversationHistory}\n\n` : "";
  const fullPrompt = `${systemPrompt}${contextSection}Current user message: ${baseRequest.prompt}`;

  // Stream the response with tools (if available)
  // Use lower temperature for agent chat to reduce hallucination
  const streamConfig: Parameters<typeof streamText>[0] = {
    model,
    prompt: fullPrompt,
    maxOutputTokens: modelConfig.maxTokens,
    temperature: 0.3, // Lower temperature to reduce hallucination and invention of APIs
    topP: modelConfig.topP ?? 0.9, // Also constrain topP for more focused responses
    onError: (error) => {
      console.error("Stream error in AI service:", error);
    },
  };

  // Add tools to stream config
  console.log("🛠️ [AI SERVICE] Tools are defined, adding to stream config");
  console.log("🔧 [AI SERVICE] Available tools:", Object.keys(tools));
  streamConfig.tools = tools;
  streamConfig.toolChoice = "auto";

  console.log("🚀 [AI SERVICE] Starting streamText with config:", {
    model: streamConfig.model,
    hasTools: !!streamConfig.tools,
    toolChoice: streamConfig.toolChoice,
  });

  return streamText(streamConfig);
}

// Generate mock data with centralized prompt
export async function generateMockData(
  prisma: PrismaClient,
  toolContext: {
    toolName: string;
    toolDescription: string;
    method: string;
    url: string;
    serverName: string;
    parameterDetails: string;
    hasAuthFields: boolean;
  },
  schema: z.ZodSchema,
  config?: AIServiceConfig,
) {
  const mockPrompt = PromptService.renderPrompt("mock-data-generation", toolContext);

  if (!mockPrompt) {
    throw new Error("Mock data generation prompt not found");
  }

  return generateStructuredObject(prisma, {
    prompt: mockPrompt,
    schema,
    config: config || {},
    tenantId: "system", // Internal system operation
    userId: "system",
  });
}

// Generate Handlebars template with centralized prompt
export async function generateHandlebarsTemplate(
  prisma: PrismaClient,
  toolContext: {
    toolName: string;
    toolDescription: string;
    method: string;
    url: string;
    parameters: string;
    responses: string;
  },
  config?: AIServiceConfig,
) {
  const templatePrompt = PromptService.renderPrompt("handlebars-template-generation", toolContext);

  if (!templatePrompt) {
    throw new Error("Handlebars template generation prompt not found");
  }

  return generateCompletion(prisma, {
    prompt: templatePrompt,
    config: config || { maxTokens: 1000 },
    tenantId: "system", // Internal system operation
    userId: "system",
  });
}
