import { CreateToolRequest, Tool } from "@agentbridge/api";
import { streamAgentChat } from "./ai.service";

export interface ToolGenerationRequest {
  prompt: string;
  serverId: string;
  context?: {
    existingTools?: Tool[];
    folders?: { id: string; name: string }[];
  };
}

export interface ToolGenerationResponse {
  tools: CreateToolRequest[];
  authProvider?: unknown;
  reasoning?: string;
}

/**
 * Generate tools using AI agent chat
 */
export async function generateTools(request: ToolGenerationRequest): Promise<ToolGenerationResponse> {
  try {
    // Build context-aware prompt
    let contextPrompt = request.prompt;

    if (request.context?.existingTools?.length) {
      contextPrompt += `\n\nExisting tools: ${request.context.existingTools.map((t) => t.name).join(", ")}`;
    }

    if (request.context?.folders?.length) {
      contextPrompt += `\n\nAvailable folders: ${request.context.folders.map((f) => f.name).join(", ")}`;
    }

    // Stream the agent chat response
    const stream = await streamAgentChat({
      prompt: contextPrompt,
      serverId: request.serverId,
    });

    // Parse the stream to extract tool creation results
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;

        // Try to parse tool creation results from the stream
        // This is a simplified implementation - in practice, you'd want to
        // parse the structured tool data from the AI response
      }
    } finally {
      reader.releaseLock();
    }

    // For now, return empty array as this is a placeholder implementation
    // In a real implementation, you would parse the AI response to extract
    // structured tool data
    return {
      tools: [],
      reasoning: fullResponse,
    };
  } catch (error) {
    throw new Error(`Failed to generate tools: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
