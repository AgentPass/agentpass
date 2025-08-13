import { api } from "@/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { log } from "@/utils/log";
import { AlertCircle, FileJson, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

interface ImportServerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ServerExportData {
  version: string;
  exportedAt: string;
  server: {
    name: string;
    description?: string;
    baseUrl: string;
    enabled: boolean;
    authType: string;
  };
  folders: Array<{ name: string; parentFolderName?: string }>;
  tools: Array<{ name: string; description: string; method: string; url: string }>;
  authProviders: {
    oauth: Array<{ name: string }>;
    apiKey: Array<{ name: string }>;
  };
}

export function ImportServerModal({ isOpen, onClose }: ImportServerModalProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<ServerExportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      setError("Please select a JSON file");
      return;
    }

    setSelectedFile(file);
    setError(null);

    try {
      const text = await file.text();
      const json = JSON.parse(text) as ServerExportData;

      // Basic validation
      if (!json.version || !json.server || !json.server.name) {
        throw new Error("Invalid server export file format");
      }

      setFileContent(json);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to parse JSON";
      setError(`Failed to read file: ${errorMessage}`);
      setFileContent(null);
    }
  };

  const handleImport = async () => {
    if (!fileContent) return;

    setImporting(true);
    setError(null);

    try {
      const result = await api.servers.importServer(fileContent);
      log.success(result.message || "Server imported successfully");
      onClose();
      navigate(`/servers/${result.id}/general`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import server");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setFileContent(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Import MCP Server</DialogTitle>
          <DialogDescription>Import a previously exported MCP server configuration from a JSON file.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="file-upload">Server Configuration File</Label>
            <div className="flex gap-2">
              <Input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button variant="outline" className="w-full justify-start" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                {selectedFile ? selectedFile.name : "Choose file..."}
              </Button>
            </div>
          </div>

          {fileContent && (
            <div className="space-y-3">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <FileJson className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{fileContent.server.name}</span>
                </div>
                {fileContent.server.description && (
                  <p className="text-sm text-muted-foreground">{fileContent.server.description}</p>
                )}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Tools: </span>
                    <span className="font-medium">{fileContent.tools.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Folders: </span>
                    <span className="font-medium">{fileContent.folders.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">OAuth Providers: </span>
                    <span className="font-medium">{fileContent.authProviders.oauth.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">API Keys: </span>
                    <span className="font-medium">{fileContent.authProviders.apiKey.length}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Exported: {new Date(fileContent.exportedAt).toLocaleString()}
                </div>
              </div>

              {(fileContent.authProviders.oauth.length > 0 || fileContent.authProviders.apiKey.length > 0) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This server includes authentication providers. You'll need to configure credentials after import.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!fileContent || importing}>
            {importing ? "Importing..." : "Import Server"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
