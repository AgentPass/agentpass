import { ToolsAPIService } from "@/api/services/tools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { validateOpenApiContent } from "@/pages/servers/openapiValidator";
import { OAuthProvider, Tool, Folder as ToolFolder } from "@agentbridge/api";
import { ArrowLeft, FileDown, FileUp, Globe, Plus, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import yaml from "yaml";
import { AIAgentChat } from "./AIAgentChat";

interface EnhancedToolCreationSidePanelProps {
  isOpen: boolean;
  serverId: string;
  existingTools?: Tool[];
  folders?: ToolFolder[];
  authProviders?: {
    oauth: OAuthProvider[];
  };
  onClose: () => void;
  onCreateManually: () => void;
  onImportOpenAPI: () => void;
  onToolsGenerated: (tools: Tool[], authProvider?: OAuthProvider) => void;
}

type PanelMode = "selection" | "ai-chat" | "openapi-import";

export const EnhancedToolCreationSidePanel = ({
  isOpen,
  serverId,
  existingTools = [],
  folders = [],
  authProviders,
  onClose,
  onCreateManually,
  onImportOpenAPI,
  onToolsGenerated,
}: EnhancedToolCreationSidePanelProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [mode, setMode] = useState<PanelMode>("selection");

  // OpenAPI import state
  const [importMethod, setImportMethod] = useState<"upload" | "paste" | "url">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [apiSpec, setApiSpec] = useState("");
  const [url, setUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setMode("selection"); // Reset to selection mode when opening
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setMode("selection");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleBackToSelection = () => {
    setMode("selection");
  };

  const handleAIGenerate = () => {
    setMode("ai-chat");
  };

  const handleOpenAPIImport = () => {
    setMode("openapi-import");
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    setFile(droppedFile);
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleImportSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      let content: string;

      if (importMethod === "upload" && file) {
        content = await file.text();
      } else if (importMethod === "paste") {
        content = apiSpec;
      } else if (importMethod === "url") {
        // For now, just show error - URL import would need mirror service
        throw new Error("URL import not supported yet");
      } else {
        throw new Error("Please select a file or paste content");
      }

      // Validate OpenAPI content
      let parsedContent;
      try {
        parsedContent = yaml.parse(content);
      } catch {
        parsedContent = JSON.parse(content);
      }

      await validateOpenApiContent(parsedContent);

      // Import tools
      const result = await ToolsAPIService.importFromOpenApi({
        serverId,
        openApiContent: content,
      });

      // Call success handler
      onToolsGenerated(result.tools || []);

      // Reset state
      setFile(null);
      setApiSpec("");
      setUrl("");
      setMode("selection");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to import tools");
    } finally {
      setLoading(false);
    }
  };

  const handleAIToolsGenerated = (tools: Tool[], authProvider?: OAuthProvider) => {
    onToolsGenerated(tools, authProvider);
    // Stay in AI chat mode so user can continue the conversation
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Side Panel */}
      <div
        className={`fixed right-0 top-0 h-full ${mode === "ai-chat" ? "w-1/2" : "w-96"} bg-background shadow-2xl z-50 transform transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {mode === "selection" && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Add New Tool</h2>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground mb-6">Choose how you'd like to create your new tool</p>

              {/* Option 1: Create Manually */}
              <div
                onClick={onCreateManually}
                className="group relative p-4 border border-border rounded-lg hover:border-primary/50 hover:shadow-sm cursor-pointer transition-all duration-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground group-hover:text-primary">Create manually</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Build your tool from scratch with full control over configuration
                    </p>
                  </div>
                </div>
              </div>

              {/* Option 2: Import from OpenAPI */}
              <div
                onClick={handleOpenAPIImport}
                className="group relative p-4 border border-border rounded-lg hover:border-green-500/50 hover:shadow-sm cursor-pointer transition-all duration-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                    <FileDown className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground group-hover:text-green-700">
                      Import from OpenAPI
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Import API specifications from OpenAPI/Swagger documentation
                    </p>
                  </div>
                </div>
              </div>

              {/* Option 3: Generate with AI */}
              <div
                onClick={handleAIGenerate}
                className="group relative p-4 border border-border rounded-lg hover:border-purple-500/50 hover:shadow-sm cursor-pointer transition-all duration-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground group-hover:text-purple-700">
                      Generate with AI
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Describe your needs and let AI generate the tool configuration
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground text-center">
                Need help? Check our documentation for detailed guides
              </p>
            </div>
          </>
        )}

        {mode === "ai-chat" && (
          <>
            {/* AI Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={handleBackToSelection} className="h-8 w-8 p-0 mr-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-foreground">MCP Tools Generator Assistant</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* AI Chat Content */}
            <div className="flex-1" style={{ height: "calc(100vh - 73px)" }}>
              <AIAgentChat
                serverId={serverId}
                existingTools={existingTools}
                folders={folders}
                authProviders={authProviders}
                onToolsCreated={handleAIToolsGenerated}
                onClose={handleBackToSelection}
              />
            </div>
          </>
        )}

        {mode === "openapi-import" && (
          <>
            {/* OpenAPI Import Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={handleBackToSelection} className="h-8 w-8 p-0 mr-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <FileDown className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-foreground">Import from OpenAPI</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* OpenAPI Import Content */}
            <div className="p-6 space-y-6">
              <p className="text-sm text-muted-foreground">Import tools from an OpenAPI/Swagger specification</p>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Tabs
                value={importMethod}
                onValueChange={(value: string) => setImportMethod(value as "upload" | "paste" | "url")}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <FileUp className="h-4 w-4" />
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="paste">Paste</TabsTrigger>
                  <TabsTrigger value="url" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    URL
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-4">
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-green-400"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <FileUp className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 mb-2">
                      Drag and drop your OpenAPI file here, or{" "}
                      <label
                        htmlFor="file-upload"
                        className="text-green-600 hover:text-green-700 cursor-pointer font-medium"
                      >
                        browse
                      </label>
                    </p>
                    <p className="text-xs text-gray-500">Supports JSON and YAML formats</p>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".json,.yaml,.yml"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  {file && <p className="text-sm text-gray-600">Selected file: {file.name}</p>}
                </TabsContent>

                <TabsContent value="paste" className="space-y-4">
                  <div>
                    <Label htmlFor="api-spec">OpenAPI Specification</Label>
                    <Textarea
                      id="api-spec"
                      placeholder="Paste your OpenAPI specification here (JSON or YAML)..."
                      value={apiSpec}
                      onChange={(e) => setApiSpec(e.target.value)}
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="url" className="space-y-4">
                  <div>
                    <Label htmlFor="api-url">OpenAPI Specification URL</Label>
                    <Input
                      id="api-url"
                      type="url"
                      placeholder="https://api.example.com/openapi.json"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground mt-1">URL import is currently not supported</p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleBackToSelection} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleImportSubmit}
                  disabled={loading || (!file && !apiSpec.trim())}
                  className="flex-1"
                >
                  {loading ? "Importing..." : "Import Tools"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};
