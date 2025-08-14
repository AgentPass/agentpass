import { api } from "@/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToolRunResult } from "@agentbridge/api";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Copy,
  Key,
  Play,
  Shield,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { generateObject } from "../../../api/services/ai.service";
import { ToolNodeData } from "../types";

interface ToolDebugModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolData: ToolNodeData;
}

interface SimpleParameter {
  name: string;
  label: string;
  description?: string;
  value: string;
  type?: string;
  required?: boolean;
  enum?: string[];
  default?: string;
}

// Schema for AI mock data generation (flexible to handle both parameters and body)
const mockDataSchema = z.object({
  parameters: z.record(z.any()).optional(),
  body: z.record(z.any()).optional(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
});

type MockDataResponse = z.infer<typeof mockDataSchema>;

// Helper function to extract type information from schema
const getFieldTypeHint = (schema: Record<string, unknown> | undefined): string => {
  if (!schema) return "string";

  const type = schema.type as string;
  const format = schema.format as string;

  if (type === "integer") {
    return format === "int64" ? "integer (int64)" : "integer";
  }
  if (type === "number") {
    return format ? `number (${format})` : "number";
  }
  if (type === "boolean") {
    return "boolean";
  }
  if (type === "array") {
    return "array";
  }
  if (type === "object") {
    return "object";
  }
  if (type === "string") {
    if (format === "date-time") return "string (date-time)";
    if (format === "date") return "string (date)";
    if (format === "email") return "string (email)";
    if (format === "uri") return "string (uri)";
    return "string";
  }

  return "string";
};

export const ToolDebugModal: React.FC<ToolDebugModalProps> = ({ open, onOpenChange, toolData }) => {
  const [parameters, setParameters] = useState<SimpleParameter[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ToolRunResult | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [mockDataResult, setMockDataResult] = useState<MockDataResponse | null>(null);
  const [mockDataLoading, setMockDataLoading] = useState(false);
  const [mockDataError, setMockDataError] = useState<string | null>(null);
  const [isResultExpanded, setIsResultExpanded] = useState(false);

  const { tool, serverId } = toolData;
  const providerId = tool.oAuthProviderId || tool.apiKeyProviderId;

  // Initialize parameters from tool configuration
  useEffect(() => {
    if (!open || !tool) return;

    const params: SimpleParameter[] = [];

    // Add parameters from tool configuration
    if (tool.parameters) {
      Object.entries(tool.parameters).forEach(([name, param]) => {
        if (typeof param === "object") {
          // Handle body parameter with nested schema
          if (param.in === "body" && param.schema?.properties) {
            // Extract properties from body schema
            Object.entries(param.schema.properties).forEach(
              ([propName, propSchema]: [string, Record<string, unknown>]) => {
                const schema = param.schema as Record<string, unknown>;
                const required = schema?.required as string[] | undefined;
                const isRequired = required?.includes(propName) || false;
                const description = (propSchema as Record<string, unknown>).description as string | undefined;
                const enumValues = (propSchema as Record<string, unknown>).enum as string[] | undefined;
                const defaultValue = (propSchema as Record<string, unknown>).default as string | undefined;

                params.push({
                  name: `body.${propName}`,
                  label: propName,
                  description: description || `Body field: ${propName}`,
                  type: getFieldTypeHint(propSchema),
                  required: isRequired,
                  value: defaultValue || "",
                  enum: enumValues,
                  default: defaultValue,
                });
              },
            );
          } else if ((param.in as string) === "formData") {
            // Handle formData parameters (from form-encoded bodies - not in ParameterLocation enum)
            const schema = param.schema as Record<string, unknown> | undefined;
            const enumValues = schema?.enum as string[] | undefined;
            const defaultValue = schema?.default as string | undefined;

            params.push({
              name,
              label: name,
              description: param.description || undefined,
              type: getFieldTypeHint(param.schema),
              required: param.required || false,
              value: defaultValue || "",
              enum: enumValues,
              default: defaultValue,
            });
          } else {
            // Regular parameter (path, query, header, etc.)
            const schema = param.schema as Record<string, unknown> | undefined;
            const enumValues = schema?.enum as string[] | undefined;
            const defaultValue = schema?.default as string | undefined;

            params.push({
              name,
              label: name,
              description: param.description || undefined,
              type: getFieldTypeHint(param.schema),
              required: param.required || false,
              value: defaultValue || "",
              enum: enumValues,
              default: defaultValue,
            });
          }
        } else {
          // Fallback for non-object parameters
          params.push({
            name,
            label: name,
            description: undefined,
            type: "string",
            required: false,
            value: "",
          });
        }
      });
    }

    setParameters(params);
    setIsAuthorized(tool.adminAuthorized || false);
  }, [open, tool]);

  const handleParameterChange = useCallback((index: number, value: string) => {
    setParameters((prev) => prev.map((param, i) => (i === index ? { ...param, value } : param)));
  }, []);

  // Generate dynamic schema based on actual parameters
  const generateDynamicSchema = useCallback(() => {
    const parameterProperties: Record<string, Record<string, unknown>> = {};
    const bodyProperties: Record<string, Record<string, unknown>> = {};
    const requiredParams: string[] = [];
    const requiredBodyParams: string[] = [];

    parameters.forEach((param) => {
      // Map parameter types to JSON schema types
      let paramType = "string"; // default
      if (param.type?.includes("integer") || param.type?.includes("int")) {
        paramType = "integer";
      } else if (param.type?.includes("number")) {
        paramType = "number";
      } else if (param.type?.includes("boolean")) {
        paramType = "boolean";
      } else if (param.type?.includes("array")) {
        paramType = "array";
      } else if (param.type?.includes("object")) {
        paramType = "object";
      }

      // Handle body parameters separately to avoid dots in property names
      if (param.name.startsWith("body.")) {
        const bodyFieldName = param.name.replace("body.", "");
        if (paramType === "array") {
          bodyProperties[bodyFieldName] = {
            type: "array",
            items: { type: "string" },
          };
        } else if (paramType === "object") {
          bodyProperties[bodyFieldName] = {
            type: "object",
            properties: {},
            additionalProperties: {
              type: "string",
            },
            description: "Object parameter - AI will generate appropriate structure",
          };
        } else {
          bodyProperties[bodyFieldName] = { type: paramType };
        }
        if (param.required) {
          requiredBodyParams.push(bodyFieldName);
        }
      } else {
        // Regular parameters (path, query, etc.)
        if (paramType === "array") {
          parameterProperties[param.name] = {
            type: "array",
            items: { type: "string" },
          };
        } else if (paramType === "object") {
          parameterProperties[param.name] = {
            type: "object",
            properties: {},
            additionalProperties: {
              type: "string",
            },
            description: "Object parameter - AI will generate appropriate structure",
          };
        } else {
          parameterProperties[param.name] = { type: paramType };
        }
        if (param.required) {
          requiredParams.push(param.name);
        }
      }
    });

    // Create the schema structure
    const schemaProperties: Record<string, Record<string, unknown>> = {
      reasoning: {
        type: "string",
        description: "Brief explanation of the generated data choices",
      },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description: "Confidence score for the quality of generated data",
      },
    };

    // Add regular parameters if any
    if (Object.keys(parameterProperties).length > 0) {
      schemaProperties.parameters = {
        type: "object",
        properties: parameterProperties,
        required: requiredParams,
        additionalProperties: false,
      };
    }

    // Add body parameters if any
    if (Object.keys(bodyProperties).length > 0) {
      schemaProperties.body = {
        type: "object",
        properties: bodyProperties,
        required: requiredBodyParams,
        additionalProperties: false,
      };
    }

    return {
      type: "object",
      properties: schemaProperties,
      required: ["reasoning", "confidence"].concat(
        Object.keys(parameterProperties).length > 0 ? ["parameters"] : [],
        Object.keys(bodyProperties).length > 0 ? ["body"] : [],
      ),
      additionalProperties: false,
    };
  }, [parameters]);

  // Generate smart prompt for AI mock data generation
  const generateMockDataPrompt = useCallback(() => {
    const toolContext = {
      name: tool.name,
      description: tool.description || "No description provided",
      method: tool.method.toUpperCase(),
      url: tool.url,
      serverName: toolData.serverName || "Unknown server",
    };

    const parameterDetails = parameters
      .map((param) => {
        const baseInfo = `${param.name} (${param.type || "string"})${param.required ? " [REQUIRED]" : " [OPTIONAL]"}`;
        const description = param.description ? `: ${param.description}` : "";
        return `  - ${baseInfo}${description}`;
      })
      .join("\n");

    const hasAuthFields = parameters.some(
      (p) =>
        p.name.toLowerCase().includes("auth") ||
        p.name.toLowerCase().includes("token") ||
        p.name.toLowerCase().includes("key") ||
        p.name.toLowerCase().includes("secret") ||
        p.name.toLowerCase().includes("bearer") ||
        p.description?.toLowerCase().includes("auth") ||
        p.description?.toLowerCase().includes("token") ||
        p.description?.toLowerCase().includes("key"),
    );

    return `You are an AI assistant helping developers test API tools by generating realistic mock data.

Tool Information:
- Name: ${toolContext.name}
- Description: ${toolContext.description}
- Method: ${toolContext.method} ${toolContext.url}
- Server: ${toolContext.serverName}

Parameters to populate:
${parameterDetails}

Task: Generate realistic, contextually appropriate mock data for each parameter. Consider:
1. The tool's purpose and domain (e.g., user management, e-commerce, analytics)
2. Realistic data types and formats
3. Meaningful relationships between parameters
4. Industry standards and common patterns

For example:
- Email fields should use realistic email addresses
- Names should be common first/last names
- IDs should follow typical patterns (UUIDs, incremental numbers)
- Dates should be reasonable and properly formatted
- Objects/arrays should contain meaningful nested data

Special Instructions for Authentication Fields:
- For API keys, tokens, or auth headers: Generate realistic-looking but fake values (e.g., "sk-test-1234567890abcdef" for API keys, "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." for tokens)
- These are for testing purposes only and will not work with real APIs

Important: ${hasAuthFields ? "This tool contains authentication/authorization fields. In your reasoning, include a warning that mock authentication data will likely result in 401/403 errors when testing, and real credentials should be configured through the authorization system." : "Consider if any fields might be related to authentication or authorization."}

Provide:
1. Generated parameter values as a key-value object
2. Brief reasoning for your choices${hasAuthFields ? " (include authentication warning)" : ""}
3. Confidence score (0-1) for the quality of generated data

Return the response in the exact JSON format specified.`;
  }, [tool, parameters, toolData.serverName]);

  // Handle AI mock data generation with retry logic
  const handleGenerateMockData = useCallback(async () => {
    if (parameters.length === 0) {
      return;
    }

    setMockDataLoading(true);
    setMockDataError(null);
    setMockDataResult(null);

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        attempt++;

        const prompt = generateMockDataPrompt();
        const dynamicSchema = generateDynamicSchema();

        const result = await generateObject({
          prompt,
          schema: dynamicSchema,
        });

        if (result) {
          // Extract the actual AI data from the API response
          const aiData = result.object || result;

          // Validate the AI response using Zod schema
          try {
            const validatedResult = mockDataSchema.parse(aiData);
            setMockDataResult(validatedResult);

            // Update parameter values with generated data
            setParameters((prev) =>
              prev.map((param) => {
                let generatedValue: unknown = undefined;

                // Check if it's a body parameter
                if (param.name.startsWith("body.")) {
                  const bodyFieldName = param.name.replace("body.", "");
                  generatedValue = validatedResult.body?.[bodyFieldName];
                } else {
                  // Regular parameter
                  generatedValue = validatedResult.parameters?.[param.name];
                }

                if (generatedValue !== undefined) {
                  // Convert the generated value to a string for the input field
                  let stringValue: string;
                  if (typeof generatedValue === "object") {
                    stringValue = JSON.stringify(generatedValue, null, 2);
                  } else {
                    stringValue = String(generatedValue);
                  }

                  return { ...param, value: stringValue };
                }
                return param;
              }),
            );

            // Success! Break out of retry loop
            break;
          } catch {
            throw new Error("AI generated invalid response format");
          }
        } else {
          throw new Error("No result received from AI");
        }
      } catch (error) {
        // Check if we should retry
        if (attempt < maxRetries) {
          // Exponential backoff: wait longer between retries
          const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // All retries exhausted
        setMockDataError(error instanceof Error ? error.message : "Unknown error");
        break;
      }
    }

    setMockDataLoading(false);
  }, [parameters, generateMockDataPrompt, generateDynamicSchema]);

  const handleAuthorize = useCallback(async () => {
    if (!providerId) return;

    setAuthLoading(true);
    try {
      await api.authProviders.authorize(serverId, providerId, tool.id);
      setIsAuthorized(true);
    } catch {
      // Handle authorization error silently
    } finally {
      setAuthLoading(false);
    }
  }, [providerId, serverId, tool.id]);

  const handleExecute = useCallback(async () => {
    setIsExecuting(true);
    setResult(null);

    try {
      // Build parameters object from form inputs
      const toolParams: Record<string, unknown> = {};
      const bodyParams: Record<string, unknown> = {};

      parameters.forEach((param) => {
        // Convert param.value to string if it's not already
        const valueStr = String(param.value || "");
        if (valueStr.trim()) {
          // Try to parse as JSON, number, or boolean, otherwise use as string
          let parsedValue: unknown = valueStr;

          // Try to parse as number
          if (!isNaN(Number(valueStr)) && valueStr.trim() !== "") {
            parsedValue = Number(valueStr);
          }
          // Try to parse as boolean
          else if (valueStr.toLowerCase() === "true") {
            parsedValue = true;
          } else if (valueStr.toLowerCase() === "false") {
            parsedValue = false;
          }
          // Try to parse as JSON
          else if (valueStr.startsWith("{") || valueStr.startsWith("[")) {
            try {
              parsedValue = JSON.parse(valueStr);
            } catch {
              // Keep as string if JSON parsing fails
            }
          }

          // Handle body parameters separately
          if (param.name.startsWith("body.")) {
            const bodyFieldName = param.name.replace("body.", "");
            bodyParams[bodyFieldName] = parsedValue;
          } else {
            toolParams[param.name] = parsedValue;
          }
        }
      });

      // Add body parameters to toolParams if we have any
      if (Object.keys(bodyParams).length > 0) {
        toolParams.body = bodyParams;
      }

      const result = await api.tools.runTool(serverId, tool.id, {
        parameters: toolParams,
      });

      setResult(result);
    } catch (error) {
      setResult({
        isError: true,
        runtimeMs: 0,
        content: "Tool execution failed: " + (error instanceof Error ? error.message : "Unknown error"),
      });
    } finally {
      setIsExecuting(false);
    }
  }, [parameters, serverId, tool.id]);

  const copyResponse = useCallback(() => {
    if (result?.content) {
      navigator.clipboard.writeText(result.content);
    }
  }, [result]);

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET":
        return "bg-green-100 text-green-800";
      case "POST":
        return "bg-blue-100 text-blue-800";
      case "PUT":
        return "bg-yellow-100 text-yellow-800";
      case "PATCH":
        return "bg-orange-100 text-orange-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Debug Tool: {tool.name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-6 overflow-hidden relative">
          {/* AI Loading Overlay */}
          {mockDataLoading && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
              <div className="bg-card border rounded-lg p-8 shadow-lg max-w-sm">
                <div className="text-center space-y-4">
                  {/* Animated AI Icon */}
                  <div className="relative mx-auto w-16 h-16">
                    <div className="absolute inset-0 w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  </div>

                  {/* Dynamic text */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">AI is generating mock data</h3>
                    <p className="text-sm text-muted-foreground">Analyzing parameters...</p>
                  </div>

                  {/* Progress-like animation */}
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full animate-pulse"></div>
                  </div>

                  <p className="text-xs text-muted-foreground">This may take a moment for complex schemas</p>
                </div>
              </div>
            </div>
          )}

          {/* Left Panel - Input */}
          <div className="w-1/2 space-y-4 overflow-y-auto">
            {/* Tool Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded ${getMethodColor(tool.method)}`}>
                  {tool.method.toUpperCase()}
                </span>
                <span className="text-sm font-mono text-muted-foreground">{tool.url}</span>
              </div>
              {tool.description && <p className="text-sm text-muted-foreground">{tool.description}</p>}
            </div>

            {/* Authentication */}
            {providerId && (
              <div className="space-y-2 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isAuthorized ? "bg-green-500" : "bg-yellow-500"}`} />
                  <span className="text-sm">{isAuthorized ? "Authorized" : "Authorization required"}</span>
                </div>
                <Button onClick={handleAuthorize} variant="outline" size="sm" disabled={authLoading} className="w-full">
                  {authLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Authorizing...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      {isAuthorized ? "Re-Authorize" : "Authorize"}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Parameters */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Parameters</h3>
                {parameters.length > 0 && (
                  <Button
                    onClick={handleGenerateMockData}
                    disabled={mockDataLoading}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    {mockDataLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 mr-1" />
                        Suggest Mock Data
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* AI Mock Data Error */}
              {mockDataError && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">Failed to generate mock data: {mockDataError}</AlertDescription>
                </Alert>
              )}

              {/* AI Mock Data Success Info */}
              {mockDataResult && (
                <div className="mb-4 border rounded-lg bg-card">
                  <button
                    onClick={() => setIsResultExpanded(!isResultExpanded)}
                    className="w-full p-3 flex items-center justify-between text-left hover:bg-muted/50 transition-colors rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">AI generated mock data</span>
                      {/* Show auth warning indicator if reasoning contains auth-related warnings */}
                      {(mockDataResult.reasoning.toLowerCase().includes("auth") ||
                        mockDataResult.reasoning.toLowerCase().includes("401") ||
                        mockDataResult.reasoning.toLowerCase().includes("403") ||
                        mockDataResult.reasoning.toLowerCase().includes("credential")) && (
                        <div className="relative group">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-black text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            Contains authentication warning
                          </div>
                        </div>
                      )}
                    </div>
                    {isResultExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {isResultExpanded && (
                    <div className="px-3 pb-3 pt-0">
                      <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
                        <strong>AI Reasoning:</strong> {mockDataResult.reasoning}
                      </div>
                      {/* Show auth warning if detected */}
                      {(mockDataResult.reasoning.toLowerCase().includes("auth") ||
                        mockDataResult.reasoning.toLowerCase().includes("401") ||
                        mockDataResult.reasoning.toLowerCase().includes("403") ||
                        mockDataResult.reasoning.toLowerCase().includes("credential")) && (
                        <div className="mt-2 text-xs text-muted-foreground bg-muted border border-border rounded p-2">
                          <strong>Authentication Notice:</strong> This tool contains authentication fields. Mock
                          credentials will likely fail. Use the authorization system to configure real credentials for
                          successful testing.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {parameters.length === 0 ? (
                <p className="text-sm text-muted-foreground">No parameters required</p>
              ) : (
                parameters.map((param, index) => (
                  <div key={param.name} className="space-y-1">
                    <Label htmlFor={`param-${index}`} className="text-sm flex items-center gap-2">
                      {param.label}
                      {param.required && <span className="text-red-500">*</span>}
                      {param.type && (
                        <span className="px-1.5 py-0.5 bg-muted text-xs rounded font-mono text-muted-foreground">
                          {param.type}
                        </span>
                      )}
                      {param.enum && (
                        <span className="px-1.5 py-0.5 bg-muted text-xs rounded text-muted-foreground">enum</span>
                      )}
                    </Label>
                    {param.enum ? (
                      <Select value={param.value} onValueChange={(value) => handleParameterChange(index, value)}>
                        <SelectTrigger id={`param-${index}`} className="text-sm">
                          <SelectValue placeholder={`Select ${param.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {param.enum.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={`param-${index}`}
                        value={param.value}
                        onChange={(e) => handleParameterChange(index, e.target.value)}
                        placeholder={`Enter ${param.label}${param.type ? ` (${param.type})` : ""}`}
                        className="text-sm"
                      />
                    )}
                    {param.description && <p className="text-xs text-muted-foreground">{param.description}</p>}
                    {param.enum && param.default && (
                      <p className="text-xs text-muted-foreground">
                        Default: <span className="font-mono">{param.default}</span>
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Execute Button */}
            <Button
              onClick={handleExecute}
              disabled={isExecuting || (!!providerId && !isAuthorized)}
              className="w-full"
              size="lg"
            >
              {isExecuting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Execute Tool
                </>
              )}
            </Button>
          </div>

          {/* Right Panel - Output */}
          <div className="w-1/2 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Response</h3>
              {result && (
                <Button onClick={copyResponse} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              )}
            </div>

            {!result ? (
              <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">No response yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center gap-2">
                  {result.isError ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  <span className={`text-sm font-medium ${result.isError ? "text-red-600" : "text-green-600"}`}>
                    {result.isError ? "Error" : "Success"}
                  </span>
                  <span className="text-xs text-muted-foreground">({result.runtimeMs}ms)</span>
                </div>

                {/* Response Content */}
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-2">Response</h4>
                  <pre className="text-xs font-mono whitespace-pre-wrap break-all text-foreground">
                    {result.content}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
