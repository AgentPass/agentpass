import {
  AIChatRequest,
  AICompletionRequest,
  AICompletionResponse,
  AIConfig,
  AIGenerateObjectRequest,
  AIGenerateObjectResponse,
} from "@agentbridge/api";
import { apiCallSucceeded, ApiClientOptions } from "../api-options";

export interface AIStreamCompletionRequest extends AICompletionRequest {
  enableReasoning?: boolean;
}

// Stream chat completions
export async function streamChat(request: AIChatRequest): Promise<ReadableStream> {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;

  // Get user from localStorage (matches auth context)
  const user = localStorage.getItem("ab_admin_user");
  const accessToken = user ? JSON.parse(user).accessToken : null;

  const response = await fetch(`${baseUrl}/api/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to stream chat");
  }

  if (!response.body) {
    throw new Error("No response body");
  }

  return response.body;
}

// Generate text completion
export async function generateCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
  try {
    const api = await import("@agentbridge/api");

    // Create options with longer timeout for AI completion
    const optionsWithTimeout = {
      ...ApiClientOptions,
      timeoutMsec: 60000, // 60 seconds for AI completion
    };

    const result = await api.AiService.aiGenerateCompletion(optionsWithTimeout, { requestBody: request });

    if (apiCallSucceeded(result)) {
      return result.body as AICompletionResponse;
    }

    // Better error messages based on failure type
    if (result.httpCode === 0) {
      throw new Error("Request timed out or was aborted. Check your connection.");
    } else if (result.httpCode >= 400 && result.httpCode < 500) {
      throw new Error(`Request failed: ${result.body || "Invalid request"}`);
    } else if (result.httpCode >= 500) {
      // Try to extract more meaningful error from server response
      let errorMessage = "Internal server error";
      if (result.body) {
        if (typeof result.body === "string") {
          errorMessage = result.body;
        } else if (typeof result.body === "object" && result.body && "message" in result.body) {
          errorMessage = result.body.message as string;
        } else if (typeof result.body === "object" && result.body && "error" in result.body) {
          errorMessage = result.body.error as string;
        } else {
          errorMessage = JSON.stringify(result.body);
        }
      }
      throw new Error(`Server error: ${errorMessage}`);
    }

    throw new Error(`Failed to generate completion: HTTP ${result.httpCode}`);
  } catch (error) {
    // Handle abort errors specifically
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request was aborted or timed out.");
    }

    throw error;
  }
}

// Generate Handlebars template for tool response formatting
export async function generateHandlebarsTemplate(
  tool: {
    name: string;
    description: string;
    method: string;
    url: string;
    parameters?: Record<string, unknown>;
    requestParameterOverrides?: Record<string, unknown>;
    responses?: Record<string, unknown>;
  },
  config?: AICompletionRequest["config"],
): Promise<{ template: string; usage?: unknown; finishReason?: string }> {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;

  // Get user from localStorage (matches auth context)
  const user = localStorage.getItem("ab_admin_user");
  const accessToken = user ? JSON.parse(user).accessToken : null;

  const response = await fetch(`${baseUrl}/api/ai/generate-template`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ tool, config }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to generate template");
  }

  return response.json();
}

// Stream text completion with reasoning support
export async function streamCompletion(request: AIStreamCompletionRequest): Promise<ReadableStream> {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;

  // Get user from localStorage (matches auth context)
  const user = localStorage.getItem("ab_admin_user");
  const accessToken = user ? JSON.parse(user).accessToken : null;

  const response = await fetch(`${baseUrl}/api/ai/stream-completion`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to stream completion");
  }

  if (!response.body) {
    throw new Error("No response body");
  }

  return response.body;
}

// Generate structured object
export async function generateObject(request: AIGenerateObjectRequest): Promise<AIGenerateObjectResponse> {
  try {
    const api = await import("@agentbridge/api");

    // Create options with longer timeout for complex schemas
    const optionsWithTimeout = {
      ...ApiClientOptions,
      timeoutMsec: 120000, // 120 seconds for complex AI generation
    };

    const result = await api.AiService.aiGenerateObject(optionsWithTimeout, { requestBody: request });

    if (apiCallSucceeded(result)) {
      return result.body as AIGenerateObjectResponse;
    }

    // Better error messages based on failure type
    if (result.httpCode === 0) {
      throw new Error("Request timed out or was aborted. Try with a simpler schema or check your connection.");
    } else if (result.httpCode >= 400 && result.httpCode < 500) {
      throw new Error(`Request failed: ${result.body || "Invalid request"}`);
    } else if (result.httpCode >= 500) {
      // Try to extract more meaningful error from server response
      let errorMessage = "Internal server error";
      if (result.body) {
        if (typeof result.body === "string") {
          errorMessage = result.body;
        } else if (typeof result.body === "object" && result.body && "message" in result.body) {
          errorMessage = result.body.message as string;
        } else if (typeof result.body === "object" && result.body && "error" in result.body) {
          errorMessage = result.body.error as string;
        } else {
          errorMessage = JSON.stringify(result.body);
        }
      }
      throw new Error(`Server error: ${errorMessage}`);
    }

    throw new Error("Failed to generate object");
  } catch (error) {
    // Handle abort errors specifically
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        "Request was aborted or timed out. The schema might be too complex for the AI to process quickly.",
      );
    }

    throw error;
  }
}

// Stream AI agent chat
export async function streamAgentChat(request: {
  prompt: string;
  conversationHistory?: string;
  hasShownDesign?: boolean;
  serverId?: string;
  config?: AICompletionRequest["config"];
}): Promise<ReadableStream> {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;

  // Get user from localStorage (matches auth context)
  const user = localStorage.getItem("ab_admin_user");
  const accessToken = user ? JSON.parse(user).accessToken : null;

  const response = await fetch(`${baseUrl}/api/ai/agent-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to stream agent chat");
  }

  if (!response.body) {
    throw new Error("No response body");
  }

  return response.body;
}

// Get AI configuration
export async function getAIConfig(): Promise<AIConfig> {
  const api = await import("@agentbridge/api");
  const result = await api.AiService.aiGetConfig(ApiClientOptions);

  if (apiCallSucceeded(result)) {
    return result.body as AIConfig;
  }

  throw new Error("Failed to get AI configuration");
}

// Helper to parse text stream (for Vercel AI SDK v5 toTextStreamResponse)
export function parseTextStream(stream: ReadableStream): AsyncIterable<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  return {
    async *[Symbol.asyncIterator]() {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Vercel AI SDK v5 toTextStreamResponse sends raw text chunks
          const chunk = decoder.decode(value, { stream: true });
          if (chunk) {
            yield chunk;
          }
        }
      } finally {
        reader.releaseLock();
      }
    },
  };
}

// Helper to parse SSE stream (kept for compatibility if needed)
export function parseSSEStream(stream: ReadableStream): AsyncIterable<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  return {
    async *[Symbol.asyncIterator]() {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                yield data;
              } catch {
                // Ignore parsing errors for individual data chunks
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    },
  };
}

// Types for streaming data
export interface StreamChunk {
  type: "text" | "reasoning" | "error" | "finish" | "tool-call" | "tool-result";
  text?: string;
  reasoning?: string;
  error?: string;
  finishReason?: string;
  toolCall?: {
    id: string;
    name: string;
    args: unknown;
  };
  toolResult?: {
    id: string;
    name: string;
    type?: string; // Add type field for cleaner detection
    result: unknown;
  };
}

// Helper to parse Vercel AI SDK v5 UI message stream
export function parseDataStream(stream: ReadableStream): AsyncIterable<StreamChunk> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  return {
    async *[Symbol.asyncIterator]() {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;

            // Handle SSE format with "data: " prefix
            let jsonStr = line;
            if (line.startsWith("data: ")) {
              jsonStr = line.slice(6); // Remove "data: " prefix
              if (jsonStr === "[DONE]") continue; // Skip end marker
            }

            try {
              // Parse JSON objects from the UI message stream
              const data = JSON.parse(jsonStr);

              // Removed debug logging for cleaner console output

              switch (data.type) {
                case "text":
                  // Simple text chunk
                  if (data.text) {
                    yield { type: "text", text: data.text };
                  }
                  break;
                case "text-start":
                  break;
                case "text-delta":
                  if (data.delta) {
                    yield { type: "text", text: data.delta };
                  }
                  break;
                case "text-end":
                  break;
                case "reasoning":
                  // Simple reasoning chunk
                  if (data.reasoning || data.text) {
                    yield { type: "reasoning", reasoning: data.reasoning || data.text };
                  }
                  break;
                case "reasoning-start":
                  break;
                case "reasoning-delta":
                  if (data.delta) {
                    yield { type: "reasoning", reasoning: data.delta };
                  }
                  break;
                case "reasoning-end":
                  break;
                case "error":
                  yield { type: "error", error: data.error || "Unknown error" };
                  break;
                case "finish":
                case "finish-step":
                  yield { type: "finish", finishReason: data.finishReason };
                  break;
                case "tool-call":
                  yield {
                    type: "tool-call",
                    toolCall: {
                      id: data.toolCallId,
                      name: data.toolName,
                      args: data.args,
                    },
                  };
                  break;
                case "tool-input-start":
                  // Provider-executed tool starting (like web search)
                  if (data.toolName === "web_search_preview") {
                    yield {
                      type: "tool-call",
                      toolCall: {
                        id: data.toolCallId,
                        name: data.toolName,
                        args: {},
                      },
                    };
                  }
                  break;
                case "tool-input-available":
                  // Handle tool input
                  yield {
                    type: "tool-call",
                    toolCall: {
                      id: data.toolCallId,
                      name: data.toolName,
                      args: data.input,
                    },
                  };
                  break;
                case "tool-output-available": {
                  // Handle tool output/result
                  // Determine the tool type based on output structure
                  let toolType = "unknown";
                  if (data.output && typeof data.output === "object") {
                    if ("success" in data.output && ("toolId" in data.output || "toolName" in data.output)) {
                      toolType = "tool-creation";
                    } else if (data.output.type === "web_search_tool_result") {
                      toolType = "web-search";
                    } else if (data.toolName === "web_search" || data.toolName === "web_search_preview") {
                      // OpenAI's web search tool
                      toolType = "web-search";
                    }
                  }

                  yield {
                    type: "tool-result",
                    toolResult: {
                      id: data.toolCallId,
                      name: data.toolName || "unknown",
                      type: toolType,
                      result: data.output,
                    },
                  };
                  break;
                }
                case "tool-result": {
                  // For createMCPTool, the toolName might be the created tool's name
                  // Check if this is a tool creation result by examining the result structure
                  const isToolCreation =
                    data.result &&
                    typeof data.result === "object" &&
                    "success" in data.result &&
                    ("toolId" in data.result || "toolName" in data.result);

                  yield {
                    type: "tool-result",
                    toolResult: {
                      id: data.toolCallId,
                      name: isToolCreation ? "createMCPTool" : data.toolName,
                      result: data.result,
                    },
                  };
                  break;
                }
              }
            } catch {
              // Try legacy format if JSON parsing fails
              if (line.startsWith("0:")) {
                yield { type: "text", text: line.slice(2) };
              } else if (line.startsWith("1:")) {
                yield { type: "reasoning", reasoning: line.slice(2) };
              } else {
                // Failed to parse stream chunk, skip it
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    },
  };
}
