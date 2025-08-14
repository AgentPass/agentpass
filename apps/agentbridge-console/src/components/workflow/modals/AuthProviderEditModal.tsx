import { api } from "@/api";
import { ScopeChipsInput } from "@/components/auth-providers/scope-chips-input";
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
import { useClipboard } from "@/hooks/use-clipboard";
import { BACKEND_CALLBACK_ROUTE } from "@/pages/login.tsx";
import { log } from "@/utils/log";
import { OAuthProvider } from "@agentbridge/api";
import { Copy } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

const availableContentTypes = ["application/json", "application/x-www-form-urlencoded"];

interface ProviderFormData {
  name: string;
  clientId: string;
  clientSecret?: string;
  authorizationUrl: string;
  tokenUrl: string;
  refreshUrl?: string;
  scopes: string[];
  contentType?: string;
}

const Required = () => <span className="text-destructive ml-1">*</span>;

const CLIENT_SECRET_PLACEHOLDER = "••••••••";

const REDIRECT_URI = `${window.location.origin}${BACKEND_CALLBACK_ROUTE}`;

interface AuthProviderEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
  onProviderUpdated: (provider: OAuthProvider) => void;
}

export const AuthProviderEditModal: React.FC<AuthProviderEditModalProps> = ({
  isOpen,
  onClose,
  providerId,
  onProviderUpdated,
}) => {
  const [provider, setProvider] = useState<OAuthProvider | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { copyToClipboard } = useClipboard();

  // Form state
  const [formData, setFormData] = useState<ProviderFormData>({
    name: "",
    clientId: "",
    clientSecret: "",
    authorizationUrl: "",
    tokenUrl: "",
    refreshUrl: "",
    scopes: [],
    contentType: "application/x-www-form-urlencoded", // Default Content-Type
  });

  const loadProvider = useCallback(async () => {
    try {
      setLoading(true);
      const providerData = await api.authProviders.getProvider(providerId);
      setProvider(providerData);

      // Populate form with defensive checks
      if (providerData) {
        setFormData({
          name: providerData.name || "",
          clientId: providerData.clientId || "",
          clientSecret: providerData.clientId ? CLIENT_SECRET_PLACEHOLDER : "",
          authorizationUrl: providerData.authorizationUrl || "",
          tokenUrl: providerData.tokenUrl || "",
          refreshUrl: providerData.refreshUrl || "",
          scopes: Array.isArray(providerData.scopes) ? providerData.scopes : [],
          contentType: providerData.contentType || "application/x-www-form-urlencoded",
        });
      }
    } catch (error) {
      log.error("Failed to load provider:", error);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  // Load provider data when modal opens
  useEffect(() => {
    if (isOpen && providerId) {
      loadProvider();
    }
  }, [isOpen, providerId, loadProvider]);

  const handleSaveProvider = async () => {
    if (
      !formData.name.trim() ||
      !formData.clientId.trim() ||
      !formData.authorizationUrl.trim() ||
      !formData.tokenUrl.trim()
    ) {
      return;
    }

    try {
      setSaving(true);

      const updateData = {
        ...formData,
        name: formData.name.trim(),
        clientId: formData.clientId.trim(),
        authorizationUrl: formData.authorizationUrl.trim(),
        tokenUrl: formData.tokenUrl.trim(),
        refreshUrl: formData.refreshUrl?.trim() || undefined,
        // Only include client secret if it was changed
        ...(formData.clientSecret !== CLIENT_SECRET_PLACEHOLDER && {
          clientSecret: formData.clientSecret?.trim(),
        }),
      };

      const updatedProvider = await api.authProviders.updateProvider(providerId, updateData);

      // Notify parent component
      onProviderUpdated(updatedProvider);

      // Close modal
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error("Failed to update provider:", message);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{provider?.name ? `Edit ${provider.name}` : "Edit OAuth Provider"}</DialogTitle>
          <DialogDescription>Configure your OAuth provider credentials and settings.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Provider Name
                  <Required />
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. My OAuth Provider"
                  disabled={saving}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="clientId">
                  Client ID
                  <Required />
                </Label>
                <Input
                  id="clientId"
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  placeholder="Your OAuth client ID"
                  disabled={saving}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="clientSecret">Client Secret</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  value={formData.clientSecret}
                  onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                  placeholder="Your OAuth client secret"
                  disabled={saving}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="authorizationUrl">
                  Authorization URL
                  <Required />
                </Label>
                <Input
                  id="authorizationUrl"
                  value={formData.authorizationUrl}
                  onChange={(e) => setFormData({ ...formData, authorizationUrl: e.target.value })}
                  placeholder="https://example.com/oauth/authorize"
                  disabled={saving}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tokenUrl">
                  Token URL
                  <Required />
                </Label>
                <Input
                  id="tokenUrl"
                  value={formData.tokenUrl}
                  onChange={(e) => setFormData({ ...formData, tokenUrl: e.target.value })}
                  placeholder="https://example.com/oauth/token"
                  disabled={saving}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="refreshUrl">Refresh URL</Label>
                <Input
                  id="refreshUrl"
                  value={formData.refreshUrl}
                  onChange={(e) => setFormData({ ...formData, refreshUrl: e.target.value })}
                  placeholder="https://example.com/oauth/refresh"
                  disabled={saving}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contentType">Content Type</Label>
                <Select
                  value={formData.contentType || "unset"}
                  onValueChange={(value) => setFormData({ ...formData, contentType: value === "unset" ? "" : value })}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">Unset</SelectItem>
                    {availableContentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="scopes">OAuth Scopes</Label>
                <ScopeChipsInput
                  scopes={formData.scopes || []} // Correct prop name
                  onChange={(scopes) => setFormData({ ...formData, scopes: scopes || [] })}
                  placeholder="Add OAuth scopes..."
                />
              </div>

              <div className="border rounded-md p-4 bg-secondary/10 space-y-2">
                <p className="text-sm text-muted-foreground mb-3">
                  Please make sure to configure this redirect URI in your OAuth provider settings:
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    id="redirect-uri"
                    value={REDIRECT_URI}
                    readOnly
                    className="bg-muted font-mono text-xs flex-1"
                    title="Configure this redirect URI in your OAuth provider settings"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9"
                    onClick={() => copyToClipboard(REDIRECT_URI)}
                    title="Copy redirect URI to clipboard"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveProvider}
            disabled={
              loading ||
              saving ||
              !formData.name.trim() ||
              !formData.clientId.trim() ||
              !formData.authorizationUrl.trim() ||
              !formData.tokenUrl.trim()
            }
          >
            {saving ? "Saving..." : "Save Provider"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
