import { AIChatMessage, AICompletionResponse, AIConfig, AIServiceConfig } from "@agentbridge/api";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  generateCompletion,
  generateObject,
  getAIConfig,
  parseTextStream,
  streamChat,
} from "../api/services/ai.service";

// Hook for chat conversations with streaming
export function useChat(config?: AIServiceConfig) {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      if (!input.trim() || isLoading) return;

      const userMessage: AIChatMessage = {
        id: Date.now().toString(),
        role: AIChatMessage.role.USER,
        content: input.trim(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);
      setError(null);

      const assistantMessage: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        role: AIChatMessage.role.ASSISTANT,
        content: "",
      };

      setMessages((prev) => [...prev, assistantMessage]);

      try {
        const stream = await streamChat({
          messages: [...messages, userMessage],
          config,
        });

        let fullContent = "";
        const updateMessage = (content: string) => {
          setMessages((prev) => prev.map((msg) => (msg.id === assistantMessage.id ? { ...msg, content } : msg)));
        };

        for await (const chunk of parseTextStream(stream)) {
          // Vercel AI SDK v5 toTextStreamResponse sends raw text chunks
          fullContent += chunk;
          updateMessage(fullContent);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        // Remove the empty assistant message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessage.id));
      } finally {
        setIsLoading(false);
      }
    },
    [input, messages, isLoading, config],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    clearMessages,
    stop,
  };
}

// Hook for simple text completions
export function useCompletion(config?: AIServiceConfig) {
  const [completion, setCompletion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete = useCallback(
    async (prompt: string): Promise<AICompletionResponse | null> => {
      setIsLoading(true);
      setError(null);
      setCompletion("");

      try {
        const response = await generateCompletion({ prompt, config });
        setCompletion(response.text);
        return response;
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [config],
  );

  return {
    completion,
    complete,
    isLoading,
    error,
    setCompletion,
  };
}

// Hook for structured object generation
export function useAIGeneration<T = unknown>(schema: Record<string, unknown>, config?: AIServiceConfig) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (prompt: string): Promise<T | null> => {
      setIsLoading(true);
      setError(null);
      setData(null);

      try {
        const response = await generateObject({
          prompt,
          schema: schema as Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
          config,
        });
        setData(response.object as T);
        return response.object as T;
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [schema, config],
  );

  return {
    data,
    generate,
    isLoading,
    error,
  };
}

// Hook to get AI configuration
export function useAIConfig() {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchConfig = async () => {
      try {
        const aiConfig = await getAIConfig();
        if (mounted) {
          setConfig(aiConfig);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load AI config");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchConfig();

    return () => {
      mounted = false;
    };
  }, []);

  return { config, isLoading, error };
}
