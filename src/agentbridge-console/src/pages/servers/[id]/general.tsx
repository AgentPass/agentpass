import { api } from "@/api";
import { ServerAuth } from "@/components/server-auth/ServerAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TimeAgo } from "@/components/ui/time-ago";
import { log } from "@/utils/log";
import { McpServer } from "@agentbridge/api";
import { AlertCircle, Download, ExternalLink, Save, Trash } from "lucide-react";
import { useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";

interface ServerContextType {
  server: McpServer;
}

export default function ServerGeneralPage() {
  const { server } = useOutletContext<ServerContextType>();
  const [searchParams] = useSearchParams();
  const providerId = searchParams.get("provider");

  const [name, setName] = useState(server.name);
  const [description, setDescription] = useState(server.description);
  const [baseUrl, setBaseUrl] = useState(server.baseUrl);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEnabled, setIsEnabled] = useState(server.enabled);

  const isSaveable = !!name.trim() && !!baseUrl.trim();
  const hasChanges =
    name !== server.name ||
    description !== server.description ||
    baseUrl !== server.baseUrl ||
    isEnabled !== server.enabled;

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);

    try {
      await api.servers.updateServer(server.id, {
        name: name.trim(),
        description: description?.trim(),
        baseUrl: baseUrl.trim(),
        enabled: isEnabled,
      });

      log.success("Server settings saved successfully");
    } catch (error) {
      log.error("Error updating server:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      await api.servers.deleteServer(server.id);
      log.success("Server deleted successfully");
      window.location.href = "/servers";
    } catch (error) {
      log.error("Error deleting server:", error);
      setDeleting(false);
    }
  };

  const handleToggleServer = async () => {
    try {
      setIsEnabled(!isEnabled);
    } catch (error) {
      log.error("Error updating server status:", error);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await api.servers.exportServer(server.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mcp-server-${server.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      log.success("Server exported successfully");
    } catch (error) {
      log.error("Error exporting server:", error);
    }
  };

  return (
    <div className="space-y-6">
      {providerId && (
        <Alert variant="default" className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-black dark:text-white">OAuth Provider Created</AlertTitle>
          <AlertDescription className="mt-2 text-black dark:text-gray-200">
            An OAuth provider was automatically created for this server and needs to be configured.
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-black bg-white border-amber-300 hover:bg-amber-100 dark:text-white dark:bg-amber-900 dark:border-amber-700 dark:hover:bg-amber-800"
                asChild
              >
                <Link to={`/servers/${server.id}/auth-providers`}>
                  Configure Provider
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Server Information</CardTitle>
          <CardDescription>Manage your server's basic information and settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4 pb-4 mb-2 border-b border-border">
            <Switch id="server-enabled" checked={isEnabled} onCheckedChange={handleToggleServer} />
            <div>
              <Label htmlFor="server-enabled" className="font-medium text-sm">
                Server {isEnabled ? "Enabled" : "Disabled"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {isEnabled ? "The server is currently online" : "The server is currently offline"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="server-name">Server Name</Label>
            <Input
              id="server-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter server name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="server-description">Description</Label>
            <Textarea
              id="server-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this server provides..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="server-endpoint">Base URL</Label>
            <Input
              id="server-endpoint"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com/v1"
            />
            {baseUrl === "" && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Update Required</AlertTitle>
                <AlertDescription>
                  Please update the Base URL with your actual API endpoint. The current value is a placeholder.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-border pt-6">
          <div className="flex items-center text-sm text-muted-foreground">
            <span className="mr-1">Created:</span>
            <TimeAgo date={server.createdAt} />
            {server.updatedAt && (
              <>
                <span className="mx-2">•</span>
                <span className="mr-1">Last updated:</span>
                <TimeAgo date={server.updatedAt} />
              </>
            )}
          </div>

          <Button onClick={handleSave} disabled={!isSaveable || !hasChanges || saving}>
            {saving ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <ServerAuth
        serverId={server.id}
        authType={server.authType}
        authConfig={
          (
            server as McpServer & {
              authConfig?: {
                id: string;
                jwtProvider?: { id: string; name: string; jwksUrl: string; enabled: boolean };
              };
            }
          ).authConfig
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Server Actions</CardTitle>
          <CardDescription>Export server configuration or manage server lifecycle</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Export Server Configuration</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Download a JSON file containing the complete server configuration including tools, folders, and auth
                settings.
              </p>
            </div>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Server
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/20 bg-destructive/5">
            <div>
              <h3 className="font-medium text-destructive">Delete this server</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                This will permanently delete the server, all associated tools, and API configurations. This action
                cannot be undone.
              </p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Server
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    <div className="flex items-start space-x-3 mb-4">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="mb-2">
                          This action cannot be undone. This will permanently delete the server
                          <span className="font-medium"> {server.name} </span>
                          and all of its associated data.
                        </p>
                        <p>All tools, provider configurations, and access tokens will be removed.</p>
                      </div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete Server"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
