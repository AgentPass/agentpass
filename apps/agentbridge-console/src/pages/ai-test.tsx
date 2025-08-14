import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Bot, MessageSquare, Zap } from "lucide-react";
import React, { useState } from "react";
import { z } from "zod";
import { useAIConfig, useAIGeneration, useChat, useCompletion } from "../hooks/useAI";

// Schema for tool suggestions
const toolSuggestionSchema = z.object({
  suggestions: z.array(
    z.object({
      type: z.enum(["improvement", "warning", "tip"]),
      message: z.string(),
      priority: z.enum(["low", "medium", "high"]),
    }),
  ),
  overallScore: z.number().min(0).max(10),
  recommendedActions: z.array(z.string()),
});

type ToolSuggestion = z.infer<typeof toolSuggestionSchema>;

export default function AITestPage() {
  // AI Config
  const { config: aiConfig, isLoading: configLoading } = useAIConfig();

  // Chat hook
  const chat = useChat();

  // Completion hook
  const completion = useCompletion();
  const [completionPrompt, setCompletionPrompt] = useState("");

  // Generation hook
  const generation = useAIGeneration(toolSuggestionSchema as unknown as Record<string, unknown>);
  const [toolDescription, setToolDescription] = useState("");

  const handleCompletionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await completion.complete(completionPrompt);
  };

  const handleGenerationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await generation.generate(
      `Analyze this API tool and provide suggestions: "${toolDescription}". 
       Consider security, usability, performance, and best practices.`,
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <PageHeader title="AI Integration Test" description="Test the AI infrastructure with different capabilities" />

      {/* AI Config Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Configuration
          </CardTitle>
          <CardDescription>Current AI provider configuration and status</CardDescription>
        </CardHeader>
        <CardContent>
          {configLoading ? (
            <p className="text-muted-foreground">Loading configuration...</p>
          ) : aiConfig ? (
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium">Available Providers: </span>
                <div className="flex gap-2 mt-1">
                  {aiConfig.providers.map((p) => (
                    <Badge key={p.id} variant="secondary">
                      {p.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium">Default Provider: </span>
                <Badge variant="outline">{aiConfig.defaultProvider || "None"}</Badge>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to load AI configuration</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat Interface
          </TabsTrigger>
          <TabsTrigger value="completion" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Text Completion
          </TabsTrigger>
          <TabsTrigger value="generation" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Structured Generation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chat with AI</CardTitle>
              <CardDescription>Test real-time streaming chat functionality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Messages */}
              <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-muted/50">
                {chat.messages.length === 0 ? (
                  <p className="text-muted-foreground">Start a conversation...</p>
                ) : (
                  chat.messages.map((msg) => (
                    <div key={msg.id} className={`mb-4 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                      <div
                        className={`inline-block px-4 py-2 rounded-lg max-w-[80%] ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-card-foreground border"
                        }`}
                      >
                        <p className="text-xs font-semibold mb-1 opacity-70">{msg.role === "user" ? "You" : "AI"}</p>
                        <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {chat.isLoading && (
                  <div className="text-left">
                    <div className="inline-block px-4 py-2 rounded-lg bg-card text-card-foreground border">
                      <p className="text-xs font-semibold mb-1 opacity-70">AI</p>
                      <p className="text-sm animate-pulse">Thinking...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <form onSubmit={chat.handleSubmit} className="flex gap-2">
                <Input
                  value={chat.input}
                  onChange={chat.handleInputChange}
                  placeholder="Type your message..."
                  disabled={chat.isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={chat.isLoading || !chat.input.trim()}>
                  Send
                </Button>
              </form>

              {chat.error && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Error: {chat.error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Text Completion</CardTitle>
              <CardDescription>Generate text completions for single prompts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleCompletionSubmit} className="space-y-4">
                <Textarea
                  value={completionPrompt}
                  onChange={(e) => setCompletionPrompt(e.target.value)}
                  placeholder="Enter your prompt here..."
                  rows={4}
                  disabled={completion.isLoading}
                />
                <Button type="submit" disabled={completion.isLoading || !completionPrompt.trim()} className="w-full">
                  {completion.isLoading ? "Generating..." : "Generate Completion"}
                </Button>
              </form>

              {completion.completion && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">AI Response</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm">{completion.completion}</p>
                  </CardContent>
                </Card>
              )}

              {completion.error && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Error: {completion.error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tool Analysis (Structured Generation)</CardTitle>
              <CardDescription>Generate structured JSON responses with predefined schemas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleGenerationSubmit} className="space-y-4">
                <Textarea
                  value={toolDescription}
                  onChange={(e) => setToolDescription(e.target.value)}
                  placeholder="Describe your API tool or paste its configuration..."
                  rows={4}
                  disabled={generation.isLoading}
                />
                <Button type="submit" disabled={generation.isLoading || !toolDescription.trim()} className="w-full">
                  {generation.isLoading ? "Analyzing..." : "Analyze Tool"}
                </Button>
              </form>

              {generation.data != null &&
                (() => {
                  const data = generation.data as ToolSuggestion;
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          Analysis Results
                          <Badge variant="outline" className="text-lg">
                            {data.overallScore}/10
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Suggestions:</h4>
                          <div className="space-y-2">
                            {data.suggestions.map((suggestion: ToolSuggestion["suggestions"][0], i: number) => (
                              <div key={i} className="border rounded-lg p-3">
                                <div className="flex justify-between items-start mb-2">
                                  <p className="text-sm font-medium">{suggestion.message}</p>
                                  <Badge
                                    variant={
                                      suggestion.priority === "high"
                                        ? "destructive"
                                        : suggestion.priority === "medium"
                                          ? "default"
                                          : "secondary"
                                    }
                                  >
                                    {suggestion.priority}
                                  </Badge>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {suggestion.type}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Recommended Actions:</h4>
                          <ol className="list-decimal list-inside space-y-1 text-sm">
                            {data.recommendedActions.map((action: string, i: number) => (
                              <li key={i}>{action}</li>
                            ))}
                          </ol>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}

              {generation.error && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Error: {generation.error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
