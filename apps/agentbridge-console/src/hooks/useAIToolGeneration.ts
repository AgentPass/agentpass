import {
  generateTools,
  ToolGenerationRequest,
  ToolGenerationResponse,
} from "@/api/services/ai-tool-generation.service";
import { CreateToolRequest, Tool } from "@agentbridge/api";
import { useCallback, useState } from "react";

export interface UseAIToolGenerationOptions {
  onSuccess?: (tools: CreateToolRequest[]) => void;
  onError?: (error: Error) => void;
}

export function useAIToolGeneration(options?: UseAIToolGenerationOptions) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<CreateToolRequest[] | null>(null);

  const generateToolsFromPrompt = useCallback(
    async (
      prompt: string,
      serverId: string,
      context?: {
        existingTools?: Tool[];
        folders?: { id: string; name: string }[];
      },
    ): Promise<CreateToolRequest[]> => {
      if (!prompt.trim()) {
        throw new Error("Prompt cannot be empty");
      }

      setIsGenerating(true);
      setError(null);

      try {
        const request: ToolGenerationRequest = {
          prompt: prompt.trim(),
          serverId,
          context,
        };

        const response: ToolGenerationResponse = await generateTools(request);

        setLastGenerated(response.tools);
        options?.onSuccess?.(response.tools);

        return response.tools;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error occurred");
        setError(error.message);
        options?.onError?.(error);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    [options],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearLastGenerated = useCallback(() => {
    setLastGenerated(null);
  }, []);

  return {
    generateToolsFromPrompt,
    isGenerating,
    error,
    lastGenerated,
    clearError,
    clearLastGenerated,
  };
}
