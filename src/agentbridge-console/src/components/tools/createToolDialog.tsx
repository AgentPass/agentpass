import { ScopesList } from "@/components/auth-providers/scopes-list.tsx";
import { ToolAuthSelectDialog } from "@/components/tools/toolAuthSelectDialog.tsx";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { generateRequestOverrides } from "@/utils/generateRequestOverrides";
import { isSnakeCase } from "@/utils/string";
import { HttpMethod, OAuthProvider, RequestParamConfig, Tool } from "@agentbridge/api";
import snakeCase from "lodash/snakeCase.js";
import { PlusCircle } from "lucide-react";
import { useState } from "react";

const Required = () => <span className="text-destructive ml-1">*</span>;

interface CreateToolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: { id: string; name: string }[];
  providers: OAuthProvider[];
  onCreate: (tool: Partial<Tool>) => Promise<void>;
}

export function CreateToolDialog({ open, onOpenChange, folders, providers, onCreate }: CreateToolDialogProps) {
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editFolderId, setEditFolderId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editMethod, setEditMethod] = useState<HttpMethod>(HttpMethod.GET);
  const [editProviderId, setEditProviderId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);

  const resetForm = () => {
    setEditName("");
    setEditDescription("");
    setEditFolderId(null);
    setEditUrl("");
    setEditMethod(HttpMethod.GET);
    setEditProviderId(null);
  };

  const handleCreate = async () => {
    if (!editName.trim() || !editUrl.trim()) return;
    setIsSaving(true);

    // Since this dialog creates tools with empty parameters,
    // we'll generate empty overrides structure (for consistency)
    const parameters = {};
    const requestParameterOverrides = generateRequestOverrides(parameters) as Record<string, RequestParamConfig> | null;

    await onCreate({
      name: snakeCase(editName),
      description: editDescription,
      folderId: editFolderId ?? undefined,
      method: editMethod,
      url: editUrl,
      oAuthProviderId: editProviderId ?? undefined,
      parameters,
      requestParameterOverrides,
    });
    setIsSaving(false);
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Create a New Tool</DialogTitle>
          <DialogDescription>Add a new tool to your server. Fill out the basic information here.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="new-tool-name">
              Name <Required />
            </Label>
            <Input id="new-tool-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            {editName && !isSnakeCase(editName) && (
              <p className="text-sm text-yellow-600 dark:text-yellow-500">
                Name will be converted to: {snakeCase(editName)}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-tool-description">Description</Label>
            <Textarea
              id="new-tool-description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-tool-url">
              API URL <Required />
            </Label>
            <Input
              id="new-tool-url"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              placeholder="https://api.example.com/endpoint"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="new-tool-method">
                Method <Required />
              </Label>
              <Select value={editMethod} onValueChange={(value) => setEditMethod(value as HttpMethod)}>
                <SelectTrigger id="new-tool-method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(HttpMethod).map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-tool-folder">Folder</Label>
              <Select
                value={editFolderId || "none"}
                onValueChange={(value) => setEditFolderId(value === "none" ? null : value)}
              >
                <SelectTrigger id="new-tool-folder">
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No folder</SelectItem>
                  {folders?.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {providers.length > 0 && (
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-medium">Authentication</h3>
              {editProviderId ? (
                <>
                  <p className="text-sm text-muted-foreground">This endpoint uses OAuth authentication:</p>
                  <div className="bg-muted p-3 rounded-md">
                    {providers.find((p) => p.id === editProviderId) ? (
                      <>
                        <div className="text-sm font-medium pb-2">
                          {providers.find((p) => p.id === editProviderId)!.name}
                        </div>
                        <ScopesList scopes={providers.find((p) => p.id === editProviderId)!.scopes} />
                      </>
                    ) : (
                      <div className="text-sm">Provider data not available</div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditProviderId(null);
                    }}
                  >
                    Remove Authentication
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">No authentication configured.</p>
                  <ToolAuthSelectDialog
                    isOpen={providerDialogOpen}
                    setIsOpen={setProviderDialogOpen}
                    providers={providers}
                    onSelected={(providerId: string) => {
                      setEditProviderId(providerId);
                    }}
                  />
                </>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!editName.trim() || !editUrl.trim() || !editMethod || isSaving}>
            {isSaving ? (
              <span className="flex items-center">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></span>
                Creating...
              </span>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Tool
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
