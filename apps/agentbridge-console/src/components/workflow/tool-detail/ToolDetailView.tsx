import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Lock, Server, Settings, Shield, Wrench } from "lucide-react";
import { useState } from "react";
import { ToolNodeData } from "../types";

interface ToolDetailViewProps {
  toolData: ToolNodeData;
  onBack: () => void;
  onSave: (updatedData: Partial<ToolNodeData>) => void;
}

export const ToolDetailView = ({ toolData, onBack, onSave }: ToolDetailViewProps) => {
  const [activeTab, setActiveTab] = useState("general");
  const [isEnabled, setIsEnabled] = useState(toolData.enabled ?? false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleToggleEnabled = () => {
    setIsEnabled(!isEnabled);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave({
      enabled: isEnabled,
      status: isEnabled ? "active" : "inactive",
      tool: {
        ...toolData.tool,
        enabled: isEnabled,
      },
    });
    setHasChanges(false);
  };

  const handleCancel = () => {
    setIsEnabled(toolData.enabled ?? false);
    setHasChanges(false);
  };

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col">
      {/* Header with breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workflow
          </Button>
          <div className="text-sm text-gray-400">•</div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{toolData.tool.name}</h1>
            <p className="text-sm text-gray-600">Tool Configuration</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 flex space-x-6 overflow-hidden">
        {/* Left Panel - Tool Information */}
        <div className="w-80 flex-shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wrench className="h-5 w-5 text-blue-600" />
                <span>Tool Information</span>
              </CardTitle>
              <CardDescription>Basic information about this tool</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <p className="text-sm text-gray-900 mt-1">{toolData.tool.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="text-sm text-gray-600 mt-1">{toolData.tool.description || "No description provided"}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  <Badge variant={isEnabled ? "default" : "secondary"}>{isEnabled ? "Enabled" : "Disabled"}</Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Server</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Server className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">MCP Server</span>
                </div>
              </div>

              {(toolData.tool.oAuthProviderId || toolData.tool.apiKeyProviderId) && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Authentication</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Lock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-gray-900">Required</span>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="pt-4 border-t border-gray-200">
                <Button
                  onClick={handleToggleEnabled}
                  variant={isEnabled ? "destructive" : "default"}
                  className="w-full"
                >
                  {isEnabled ? "Disable Tool" : "Enable Tool"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Configuration */}
        <div className="flex-1 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Configure tool settings and authentication</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="auth">Authentication</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                <div className="flex-1 mt-4">
                  <TabsContent value="general" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Tool Name</label>
                        <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded">{toolData.tool.name}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <p className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                          {toolData.tool.description || "No description provided"}
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">Tool ID</label>
                        <p className="text-sm text-gray-500 mt-1 p-2 bg-gray-50 rounded font-mono">
                          {toolData.tool.id}
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="auth" className="space-y-4">
                    <div className="space-y-4">
                      {toolData.tool.oAuthProviderId && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">OAuth Provider</label>
                          <div className="flex items-center space-x-2 mt-1 p-2 bg-green-50 rounded">
                            <Shield className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-800">OAuth configured</span>
                          </div>
                        </div>
                      )}

                      {toolData.tool.apiKeyProviderId && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">API Key Provider</label>
                          <div className="flex items-center space-x-2 mt-1 p-2 bg-blue-50 rounded">
                            <Shield className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-blue-800">API Key configured</span>
                          </div>
                        </div>
                      )}

                      {!toolData.tool.oAuthProviderId && !toolData.tool.apiKeyProviderId && (
                        <div className="p-4 bg-gray-50 rounded-lg text-center">
                          <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">No authentication required</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Tool Status</label>
                        <div className="mt-2">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={handleToggleEnabled}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Enable this tool</span>
                          </label>
                        </div>
                      </div>

                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Settings className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800">Settings</span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">Additional tool settings will be available here</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4">
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Advanced Configuration</h4>
                        <p className="text-sm text-gray-600">
                          Advanced tool configuration options will be available here
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>

              {/* Action Buttons */}
              {hasChanges && (
                <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-200">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>Save Changes</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
