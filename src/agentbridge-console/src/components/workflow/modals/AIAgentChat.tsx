import { parseDataStream, streamAgentChat } from "@/api/services/ai.service";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OAuthProvider, Tool, Folder as ToolFolder } from "@agentbridge/api";
import { CheckCircle, ChevronDown, ExternalLink, Loader2, Send, XCircle } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

// Service-specific templates removed - using tool-based approach

// Types
interface AIAgentChatProps {
  serverId: string;
  existingTools?: Tool[];
  folders?: ToolFolder[];
  authProviders?: {
    oauth: OAuthProvider[];
  };
  onToolsCreated: (tools: Tool[], authProvider?: OAuthProvider) => void;
  onClose: () => void;
}

interface AgentState {
  hasShownDesign: boolean;
  lastDesignMessage?: string;
  conversationContext: string[];
  context?: {
    apiService?: string;
  };
  toolCreation?: {
    status: "creating" | "success" | "error";
    message: string;
    toolId?: string;
    toolName?: string;
  };
}

interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolStatus?: {
    status: "creating" | "success" | "error";
    message: string;
    toolId?: string;
    toolName?: string;
  };
  sources?: WebSearchSource[];
  webSearchActive?: boolean;
  analysisDetails?: string;
  isThinking?: boolean;
}

interface WebSearchSource {
  title: string;
  url: string;
  snippet?: string;
}

// Thinking indicator component
const ThinkingIndicator: React.FC = () => (
  <div className="flex items-center gap-2 text-muted-foreground">
    <div className="flex gap-1">
      <span className="animate-bounce" style={{ animationDelay: "0ms" }}>
        •
      </span>
      <span className="animate-bounce" style={{ animationDelay: "150ms" }}>
        •
      </span>
      <span className="animate-bounce" style={{ animationDelay: "300ms" }}>
        •
      </span>
    </div>
    <span className="text-sm">Thinking</span>
  </div>
);

// Minimal tool status indicator component
const ToolStatusIndicator: React.FC<{
  status: "creating" | "success" | "error";
  toolName?: string;
  message?: string;
  toolId?: string;
}> = ({ status, toolName, message, toolId }) => {
  const getStatusIcon = () => {
    switch (status) {
      case "creating":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "creating":
        return `Creating ${toolName || "tool"}...`;
      case "success":
        return `${toolName || "Tool"} created successfully and is now available in your workflow canvas.`;
      case "error":
        return `Failed to create ${toolName || "tool"}`;
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/50">
      {getStatusIcon()}
      <span className="text-sm">{getStatusText()}</span>
      {message && status === "error" && <span className="text-xs text-muted-foreground ml-2">({message})</span>}
    </div>
  );
};

// Unified web search component that maintains collapsed state
const WebSearchCard: React.FC<{
  active: boolean;
  sources?: WebSearchSource[];
}> = ({ active, sources }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const getSummary = () => {
    if (active) return "Searching the web...";
    if (sources && sources.length > 0) return `Found ${sources.length} source${sources.length !== 1 ? "s" : ""}`;
    return "Web search completed";
  };

  return (
    <div className="border border-border rounded-lg bg-card/50 dark:bg-card/30 my-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors rounded-lg"
      >
        <div className="flex-shrink-0">
          {active ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 text-left">
          <div className="font-medium text-foreground">Web search</div>
          <div className="text-sm text-muted-foreground mt-1">{getSummary()}</div>
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 text-muted-foreground ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="space-y-2">
            {active ? (
              <div className="text-sm text-muted-foreground">
                <div>Querying search engines</div>
                <div>Processing results</div>
                <div>Analyzing content</div>
              </div>
            ) : sources && sources.length > 0 ? (
              <div className="space-y-2">
                {sources.map((source, index) => (
                  <SourceItem key={index} source={source} />
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No additional details available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SourceItem: React.FC<{ source: WebSearchSource }> = ({ source }) => (
  <div className="p-2 rounded border border-border/50 bg-muted/30">
    <div className="flex items-start gap-2">
      <ExternalLink className="h-3 w-3 mt-1 flex-shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-sm leading-tight block hover:underline"
        >
          {source.title}
        </a>
        <div className="text-xs text-muted-foreground mt-1 truncate">{source.url}</div>
        {source.snippet && <div className="text-xs text-muted-foreground mt-2 leading-relaxed">{source.snippet}</div>}
      </div>
    </div>
  </div>
);

// Tool status wrapper component to handle type safety
const ToolStatusWrapper: React.FC<{
  toolStatus?: ConversationMessage["toolStatus"];
}> = ({ toolStatus }) => {
  if (!toolStatus) return null;
  return (
    <ToolStatusIndicator
      status={toolStatus.status}
      toolName={toolStatus.toolName}
      message={toolStatus.message}
      toolId={toolStatus.toolId}
    />
  );
};

// Custom component for rendering message content with markdown support
const MessageContent: React.FC<{
  content: string;
  role: "user" | "assistant";
  toolStatus?: ConversationMessage["toolStatus"];
  sources?: ConversationMessage["sources"];
  webSearchActive?: boolean;
  analysisDetails?: string;
  isThinking?: boolean;
}> = ({ content, role, toolStatus, sources, webSearchActive, analysisDetails, isThinking }) => {
  const [detailsExpanded, setDetailsExpanded] = React.useState(false);
  // Debug logging removed for production

  if (role === "user") {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  // Show thinking indicator if AI is thinking and no content yet
  if (isThinking && !content && !webSearchActive && !toolStatus) {
    return <ThinkingIndicator />;
  }

  // Split content into sections by thinking lines
  const sections: { type: "thinking" | "content"; text: string }[] = [];
  const lines = content.split("\n");
  let currentSection: string[] = [];
  let isInThinking = false;

  lines.forEach((line) => {
    if (line.startsWith("[THINKING]")) {
      // Save previous section if any
      if (currentSection.length > 0) {
        sections.push({
          type: isInThinking ? "thinking" : "content",
          text: currentSection.join("\n"),
        });
        currentSection = [];
      }
      // Add thinking line without prefix
      isInThinking = true;
      currentSection.push(line.replace("[THINKING] ", ""));
    } else {
      // If we were in thinking mode and hit a non-thinking line, save the thinking section
      if (isInThinking && currentSection.length > 0) {
        sections.push({
          type: "thinking",
          text: currentSection.join("\n"),
        });
        currentSection = [];
        isInThinking = false;
      }
      currentSection.push(line);
    }
  });

  // Save final section
  if (currentSection.length > 0) {
    sections.push({
      type: isInThinking ? "thinking" : "content",
      text: currentSection.join("\n"),
    });
  }

  // Check if we have web search context
  const hasWebSearch = webSearchActive || (sources && sources.length > 0);

  // Render web search and tool status separately
  if (hasWebSearch || toolStatus) {
    return (
      <div className="space-y-3">
        {/* Main content (only show if not actively searching) */}
        {!webSearchActive && sections.length > 0 && (
          <div>
            {sections.map((section, index) => (
              <div key={index}>
                {section.type === "thinking" ? (
                  <div className="pl-4 py-1 my-2 border-l-2 border-muted-foreground/30 bg-muted/30 text-xs text-muted-foreground font-mono">
                    {section.text}
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        code({ className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
                          const isInline = !match;
                          return !isInline ? (
                            <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-2">
                              <code className={`text-sm font-mono ${className || ""}`} {...props}>
                                {String(children).replace(/\n$/, "")}
                              </code>
                            </pre>
                          ) : (
                            <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono" {...props}>
                              {children}
                            </code>
                          );
                        },
                        a({ href, children }) {
                          return (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {children}
                            </a>
                          );
                        },
                        pre({ children }) {
                          return <div className="my-2">{children}</div>;
                        },
                        p({ children }) {
                          return <p className="mb-2">{children}</p>;
                        },
                        ul({ children }) {
                          return <ul className="list-disc pl-4 mb-2">{children}</ul>;
                        },
                        ol({ children }) {
                          return <ol className="list-decimal pl-4 mb-2">{children}</ol>;
                        },
                        li({ children }) {
                          return <li className="mb-1">{children}</li>;
                        },
                        blockquote({ children }) {
                          return (
                            <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic my-2">
                              {children}
                            </blockquote>
                          );
                        },
                        h1({ children }) {
                          return <h1 className="text-xl font-bold mb-2">{children}</h1>;
                        },
                        h2({ children }) {
                          return <h2 className="text-lg font-bold mb-2">{children}</h2>;
                        },
                        h3({ children }) {
                          return <h3 className="text-base font-bold mb-2">{children}</h3>;
                        },
                        table({ children }) {
                          return <table className="border-collapse border border-muted my-2">{children}</table>;
                        },
                        th({ children }) {
                          return (
                            <th className="border border-muted px-2 py-1 bg-muted/50 font-semibold text-left">
                              {children}
                            </th>
                          );
                        },
                        td({ children }) {
                          return <td className="border border-muted px-2 py-1">{children}</td>;
                        },
                      }}
                    >
                      {section.text}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Web search card - always collapsed */}
        {hasWebSearch && <WebSearchCard active={!!webSearchActive} sources={sources} />}

        {/* Tool status indicator - minimal and separate */}
        <ToolStatusWrapper toolStatus={toolStatus} />
      </div>
    );
  }

  return (
    <>
      {sections.map((section, index) => (
        <div key={index}>
          {section.type === "thinking" ? (
            <div className="pl-4 py-1 my-2 border-l-2 border-muted-foreground/30 bg-muted/30 text-xs text-muted-foreground font-mono">
              {section.text}
            </div>
          ) : (
            (() => {
              const isToolDetails =
                /(^|\n)(Endpoint Details:|Tool Details?:)/i.test(section.text) ||
                /\bURL:\s|\bMethod:\s|\bParameters?:\s|\bAuthentication:\s/i.test(section.text);

              if (isToolDetails && sources && sources.length > 0) {
                return (
                  <div className="border border-border rounded-lg bg-card/50 dark:bg-card/30 my-3">
                    <button
                      onClick={() => setDetailsExpanded(!detailsExpanded)}
                      className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors rounded-lg"
                    >
                      <Loader2 className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 text-left">
                        <div className="font-medium text-foreground">Tool details</div>
                        <div className="text-sm text-muted-foreground mt-1">Derived from web search</div>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 text-muted-foreground ${
                          detailsExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {detailsExpanded && (
                      <div className="px-4 pb-4">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown
                            components={{
                              code({ className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || "");
                                const isInline = !match;
                                return !isInline ? (
                                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-2">
                                    <code className={`text-sm font-mono ${className || ""}`} {...props}>
                                      {String(children).replace(/\n$/, "")}
                                    </code>
                                  </pre>
                                ) : (
                                  <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono" {...props}>
                                    {children}
                                  </code>
                                );
                              },
                              a({ href, children }) {
                                return (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    {children}
                                  </a>
                                );
                              },
                              pre({ children }) {
                                return <div className="my-2">{children}</div>;
                              },
                              p({ children }) {
                                return <p className="mb-2">{children}</p>;
                              },
                              ul({ children }) {
                                return <ul className="list-disc pl-4 mb-2">{children}</ul>;
                              },
                              ol({ children }) {
                                return <ol className="list-decimal pl-4 mb-2">{children}</ol>;
                              },
                              li({ children }) {
                                return <li className="mb-1">{children}</li>;
                              },
                              blockquote({ children }) {
                                return (
                                  <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic my-2">
                                    {children}
                                  </blockquote>
                                );
                              },
                              h1({ children }) {
                                return <h1 className="text-xl font-bold mb-2">{children}</h1>;
                              },
                              h2({ children }) {
                                return <h2 className="text-lg font-bold mb-2">{children}</h2>;
                              },
                              h3({ children }) {
                                return <h3 className="text-base font-bold mb-2">{children}</h3>;
                              },
                              table({ children }) {
                                return <table className="border-collapse border border-muted my-2">{children}</table>;
                              },
                              th({ children }) {
                                return (
                                  <th className="border border-muted px-2 py-1 bg-muted/50 font-semibold text-left">
                                    {children}
                                  </th>
                                );
                              },
                              td({ children }) {
                                return <td className="border border-muted px-2 py-1">{children}</td>;
                              },
                            }}
                          >
                            {section.text}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // Default rendering for all other assistant content
              return (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      code({ className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        const isInline = !match;
                        return !isInline ? (
                          <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-2">
                            <code className={`text-sm font-mono ${className || ""}`} {...props}>
                              {String(children).replace(/\n$/, "")}
                            </code>
                          </pre>
                        ) : (
                          <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono" {...props}>
                            {children}
                          </code>
                        );
                      },
                      a({ href, children }) {
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {children}
                          </a>
                        );
                      },
                      pre({ children }) {
                        return <div className="my-2">{children}</div>;
                      },
                      p({ children }) {
                        return <p className="mb-2">{children}</p>;
                      },
                      ul({ children }) {
                        return <ul className="list-disc pl-4 mb-2">{children}</ul>;
                      },
                      ol({ children }) {
                        return <ol className="list-decimal pl-4 mb-2">{children}</ol>;
                      },
                      li({ children }) {
                        return <li className="mb-1">{children}</li>;
                      },
                      blockquote({ children }) {
                        return (
                          <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic my-2">
                            {children}
                          </blockquote>
                        );
                      },
                      h1({ children }) {
                        return <h1 className="text-xl font-bold mb-2">{children}</h1>;
                      },
                      h2({ children }) {
                        return <h2 className="text-lg font-bold mb-2">{children}</h2>;
                      },
                      h3({ children }) {
                        return <h3 className="text-base font-bold mb-2">{children}</h3>;
                      },
                      table({ children }) {
                        return <table className="border-collapse border border-muted my-2">{children}</table>;
                      },
                      th({ children }) {
                        return (
                          <th className="border border-muted px-2 py-1 bg-muted/50 font-semibold text-left">
                            {children}
                          </th>
                        );
                      },
                      td({ children }) {
                        return <td className="border border-muted px-2 py-1">{children}</td>;
                      },
                    }}
                  >
                    {section.text}
                  </ReactMarkdown>
                </div>
              );
            })()
          )}
        </div>
      ))}

      {/* Web search card if present */}
      {sources && sources.length > 0 && <WebSearchCard active={false} sources={sources} />}

      {/* Tool status indicator if present */}
      <ToolStatusWrapper toolStatus={toolStatus} />
    </>
  );
};

export const AIAgentChat: React.FC<AIAgentChatProps> = ({
  serverId,
  existingTools = [],
  folders = [],
  authProviders,
  onToolsCreated,
  onClose,
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ConversationMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        'I\'ll help you create MCP tools for your MCP server! 🚀\n\nJust tell me what you want to do. For example:\n• "Create a GitHub PR tool"\n• "I need to get weather data"\n• "Set up Slack messaging"\n\nWhat API integration would you like to create?',
      timestamp: new Date(),
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>({
    hasShownDesign: false,
    conversationContext: [],
  });
  const [webSearchActive, setWebSearchActive] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const processUserMessage = async (userInput: string) => {
    setIsProcessing(true);

    try {
      // Add user message
      const userMessage: ConversationMessage = {
        id: Date.now().toString(),
        role: "user",
        content: userInput,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Update conversation context
      const updatedContext = [...agentState.conversationContext, userInput];
      setAgentState((prev) => ({
        ...prev,
        conversationContext: updatedContext.slice(-10), // Keep last 10 messages for context
      }));

      // Build conversation history INCLUDING the current user message
      const allMessages = [...messages, userMessage];
      const conversationHistory = allMessages
        .slice(-10) // Include last 10 messages (5 exchanges)
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n\n");

      // Create a new assistant message with thinking indicator
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: ConversationMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isThinking: true, // Start with thinking state
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Use the backend agent-chat endpoint that includes the system prompt
      const stream = await streamAgentChat({
        prompt: userInput,
        conversationHistory,
        hasShownDesign: agentState.hasShownDesign,
        serverId, // Pass the server ID so backend can create tools
        config: {
          maxTokens: 2000,
        },
      });

      let fullContent = "";
      let bufferedContent = "";
      let isBuffering = false;
      let analysisBuffer = ""; // capture long deltas after web search
      let preludeBuffer = ""; // text received before deciding rendering mode (e.g., before tool-call)
      let hasDecidedRendering = false; // becomes true once we know if a web-search will happen or we decide to render normally

      const updateMessageContent = (newContent: string) => {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, content: newContent, isThinking: false } : msg)),
        );
      };

      // Process the stream - use parseDataStream for structured UI messages
      for await (const chunk of parseDataStream(stream)) {
        // Processing chunk: type={chunk.type}

        if (chunk.type === "text") {
          const delta = chunk.text || "";
          // Until we know whether a web-search tool will be used, buffer prelude text to avoid flicker
          if (!hasDecidedRendering) {
            preludeBuffer += delta;
          } else if (isBuffering) {
            // During web search, keep buffering to show later inside the card
            bufferedContent += delta;
            analysisBuffer += delta;
          } else {
            // Normal streaming after decision
            fullContent += delta;
            updateMessageContent(fullContent);
          }
        } else if (chunk.type === "error") {
          // Handle stream errors gracefully - show as assistant message
          // Stream error occurred
          const errorContent = `I encountered an error while processing: ${chunk.error || "Unknown error"}\n\nLet's try again.`;
          updateMessageContent(errorContent);
          // Don't throw - let the user see the error and continue
          break;
        } else if (chunk.type === "reasoning") {
          // For now, we can optionally show reasoning in the UI
          // This could be useful for debugging or transparency
          // Reasoning is available in chunk.reasoning if needed
        } else if (chunk.type === "finish") {
          // Stream finished successfully
          // Finish reason is available in chunk.finishReason if needed
        } else if (chunk.type === "tool-call") {
          // Handle tool calls from the AI
          if (chunk.toolCall && chunk.toolCall.name === "createMCPTool") {
            // We can render normally; flush any preludeBuffer now
            if (!hasDecidedRendering && preludeBuffer) {
              fullContent += preludeBuffer;
              preludeBuffer = "";
              updateMessageContent(fullContent);
            }
            hasDecidedRendering = true;
            // AI is calling tool
            // Only show tool creation status if web search is not active
            if (!webSearchActive) {
              // Try to extract tool name from arguments if available
              let toolName: string | undefined;
              if (chunk.toolCall.args) {
                try {
                  const args =
                    typeof chunk.toolCall.args === "string" ? JSON.parse(chunk.toolCall.args) : chunk.toolCall.args;
                  const argsObj = args as Record<string, unknown>;
                  toolName =
                    (argsObj.toolName as string) ||
                    (argsObj.name as string) ||
                    ((argsObj.tool as Record<string, unknown>)?.name as string);
                } catch {
                  // Failed to parse arguments, continue without tool name
                }
              }

              const currentContent = fullContent;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: currentContent,
                        toolStatus: {
                          status: "creating",
                          message: toolName
                            ? `Setting up MCP tool: ${toolName}...`
                            : "Setting up your MCP tool configuration...",
                          toolName,
                        },
                        isThinking: false, // Clear thinking state
                      }
                    : msg,
                ),
              );
            }
          } else if (
            chunk.toolCall &&
            (chunk.toolCall.name === "web_search" || chunk.toolCall.name === "web_search_preview")
          ) {
            // AI is searching the web
            setWebSearchActive(true);
            isBuffering = true; // Start buffering text during web search
            hasDecidedRendering = true; // Decide to keep everything within the web-search card

            // Move any prelude text into buffers so it will render inside the web-search card later
            if (preludeBuffer) {
              bufferedContent += preludeBuffer;
              analysisBuffer += preludeBuffer;
              preludeBuffer = "";
            }

            // Update the message to show web search is active and clear thinking state
            const currentContent = fullContent;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: currentContent,
                      webSearchActive: true, // Add web search flag to the message itself
                      isThinking: false, // Clear thinking state
                    }
                  : msg,
              ),
            );
          } else if (chunk.toolCall) {
            // Unknown tool call: {chunk.toolCall.name}
          }
        } else if (chunk.type === "tool-result") {
          // Handle tool results - show success or error
          // Received tool result

          // Use the type field for cleaner detection
          if (
            chunk.toolResult &&
            (chunk.toolResult.type === "web-search" ||
              chunk.toolResult.name === "web_search" ||
              chunk.toolResult.name === "web_search_preview" ||
              (chunk.toolResult.result as { type?: string })?.type === "web_search_tool_result")
          ) {
            // Web search completed
            setWebSearchActive(false);
            isBuffering = false; // Stop buffering

            // Now append all the buffered content at once
            if (bufferedContent || preludeBuffer) {
              fullContent += preludeBuffer + bufferedContent;
              preludeBuffer = "";
              bufferedContent = ""; // Clear the buffer
            }

            // Extract sources from web search result
            const result = chunk.toolResult.result as Record<string, unknown>;
            // Web search result processed
            const sources: WebSearchSource[] = [];

            // Handle different possible structures from OpenAI web search
            if (result) {
              // Check for sources array
              if (result.sources && Array.isArray(result.sources)) {
                sources.push(
                  ...result.sources.map((source: unknown) => {
                    const sourceObj = source as Record<string, unknown>;
                    return {
                      title: (sourceObj.title || sourceObj.name || "Web Result") as string,
                      url: (sourceObj.url || sourceObj.link || "#") as string,
                      snippet: (sourceObj.snippet || sourceObj.description || sourceObj.content || "") as string,
                    };
                  }),
                );
              }
              // Check for results array (alternative format)
              else if (result.results && Array.isArray(result.results)) {
                sources.push(
                  ...result.results.map((source: unknown) => {
                    const sourceObj = source as Record<string, unknown>;
                    return {
                      title: (sourceObj.title || sourceObj.name || "Web Result") as string,
                      url: (sourceObj.url || sourceObj.link || "#") as string,
                      snippet: (sourceObj.snippet || sourceObj.description || sourceObj.content || "") as string,
                    };
                  }),
                );
              }
              // Check if the result itself is an array
              else if (Array.isArray(result)) {
                sources.push(
                  ...result.map((source: unknown) => {
                    const sourceObj = source as Record<string, unknown>;
                    return {
                      title: (sourceObj.title || sourceObj.name || "Web Result") as string,
                      url: (sourceObj.url || sourceObj.link || "#") as string,
                      snippet: (sourceObj.snippet || sourceObj.description || sourceObj.content || "") as string,
                    };
                  }),
                );
              }
              // Check for a single source object
              else if (result.url || result.link) {
                sources.push({
                  title: (result.title || result.name || "Web Result") as string,
                  url: (result.url || result.link || "#") as string,
                  snippet: (result.snippet || result.description || result.content || "") as string,
                });
              }
            }

            // Extracted sources from web search

            // Update the message with the full content and sources
            const currentContent = fullContent;
            const capturedAnalysis = analysisBuffer.trim() || undefined;
            setMessages((prev) => {
              const updated = prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: currentContent, // Now includes the buffered content
                      sources: sources.length > 0 ? sources : undefined,
                      webSearchActive: false, // Clear the web search flag
                      analysisDetails: capturedAnalysis,
                    }
                  : msg,
              );
              // Messages updated with sources
              return updated;
            });
            // Reset analysis buffer after attaching
            analysisBuffer = "";
          } else if (
            chunk.toolResult &&
            (chunk.toolResult.type === "tool-creation" || chunk.toolResult.name === "createMCPTool")
          ) {
            const result = chunk.toolResult.result as Record<string, unknown>;

            // Tool creation result processed

            // Only show tool creation results if this was an actual tool creation attempt
            if (result && result.success) {
              // Tool creation successful

              // Update message with success status
              const currentContent = fullContent;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: currentContent,
                        toolStatus: {
                          status: "success",
                          message: result.message as string,
                          toolId: result.toolId as string,
                          toolName: result.toolName as string,
                        },
                      }
                    : msg,
                ),
              );

              // Only refresh UI if we have a valid tool ID
              if (result.toolId && result.toolName) {
                // Triggering UI refresh with new tool
                onToolsCreated([{ id: result.toolId, name: result.toolName } as Tool], undefined);
              } else {
                // Success reported but missing required fields
              }

              // Reset agent state after successful creation
              setAgentState((prev) => ({
                ...prev,
                hasShownDesign: false,
                lastDesignMessage: undefined,
              }));
            } else if (result && !result.success) {
              // Update message with error status
              const currentContent = fullContent;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: currentContent,
                        toolStatus: {
                          status: "error",
                          message: (result.message as string) || "Tool creation failed",
                        },
                      }
                    : msg,
                ),
              );
            }
          }
        }
      }

      // After stream ends, if we never made a rendering decision (no tools) flush any prelude text
      if (!hasDecidedRendering && preludeBuffer) {
        fullContent += preludeBuffer;
        preludeBuffer = "";
        updateMessageContent(fullContent);
      }

      // Extract web search sources from the content if present
      const extractedSources: WebSearchSource[] = [];

      // Pattern to match markdown links: [text](url)
      const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
      const matches = fullContent.matchAll(linkPattern);

      for (const match of matches) {
        const [, title, url] = match;
        // Filter out relative links and only keep web URLs
        if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
          extractedSources.push({
            title: title || "Web Source",
            url: url,
            snippet: "", // We don't have snippets in this format
          });
        }
      }

      // If we found web sources, update the message to include them
      if (extractedSources.length > 0) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, sources: extractedSources } : msg)),
        );
      }

      // Update agent state if the response contains a tool specification
      const hasToolSpec =
        fullContent.includes("```json") && (fullContent.includes('"tool"') || fullContent.includes('"auth"'));

      if (hasToolSpec) {
        setAgentState((prev) => ({
          ...prev,
          hasShownDesign: true,
          lastDesignMessage: fullContent,
        }));
      }
    } catch (error) {
      // Failed to process message
      const errorMessage: ConversationMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `I apologize, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. Let's try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      setWebSearchActive(false); // Clean up web search state

      // Refocus input after assistant responds
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing || !input.trim()) return;

    const userInput = input.trim();
    setInput("");
    await processUserMessage(userInput);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message, index) => {
            // Last message check for debugging

            return (
              <div key={message.id}>
                <div
                  className={`flex items-start space-x-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] ${
                      message.role === "user" ? "bg-primary text-primary-foreground rounded-lg p-4" : ""
                    }`}
                  >
                    <div className={`text-sm leading-relaxed ${message.role === "assistant" ? "text-foreground" : ""}`}>
                      <MessageContent
                        content={message.content}
                        role={message.role}
                        toolStatus={message.toolStatus}
                        sources={message.sources}
                        webSearchActive={message.webSearchActive}
                        analysisDetails={message.analysisDetails}
                        isThinking={message.isThinking}
                      />
                    </div>
                  </div>

                  {message.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">You</span>
                    </div>
                  )}
                </div>
                {message.role === "assistant" && <div className="mt-4 border-b border-border/30" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-6 border-t border-border bg-muted/10">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="relative flex items-center bg-background border border-border rounded-lg">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className="flex-1 min-h-[40px] max-h-[150px] resize-none text-sm py-2 pl-4 pr-12 bg-transparent border-0 focus:ring-0 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as React.FormEvent);
                  }
                }}
              />
              <Button
                type="submit"
                disabled={isProcessing || !input.trim()}
                size="sm"
                className="absolute right-1.5 h-8 w-8 p-0 rounded-md"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </form>
          <div className="mt-2 text-xs text-muted-foreground">Press Enter to send, Shift+Enter for new line</div>
        </div>
      </div>
    </div>
  );
};
