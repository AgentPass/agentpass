import { api } from "@/api";
import { ScopeChipsInput } from "@/components/auth-providers/scope-chips-input";
import { ScopesList } from "@/components/auth-providers/scopes-list.tsx";
import { WarningRow } from "@/components/auth-providers/warning-row";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TimeAgo } from "@/components/ui/time-ago";
import { fetchData } from "@/hooks/fetch-data.ts";
import { useClipboard } from "@/hooks/use-clipboard";
import { BACKEND_CALLBACK_ROUTE } from "@/pages/login.tsx";
import { trackEvent } from "@/utils/analytics";
import { log } from "@/utils/log";
import { OAuthProvider as AuthProvider } from "@agentbridge/api";
import { AnalyticsEvents } from "@agentbridge/utils";
import isNil from "lodash/isNil";
import { Copy, Plus, Search } from "lucide-react";
import React, { useCallback, useState } from "react";
import useAsyncEffect from "use-async-effect";

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

export default function AuthProvidersPage() {
  const [authProviders, setAuthProviders] = useState<AuthProvider[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<AuthProvider | null>(null);
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
    contentType: "application/x-www-form-urlencoded", // Set default Content-Type
  });

  useAsyncEffect(async () => {
    await fetchData([api.authProviders.getProviders()], [setAuthProviders], setLoading);
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      clientId: "",
      clientSecret: "",
      authorizationUrl: "",
      refreshUrl: "",
      tokenUrl: "",
      scopes: [],
      contentType: "application/x-www-form-urlencoded", // Default Content-Type
    });
    setSelectedProvider(null);
  }, []);

  const handleOpenDialog = useCallback(
    (provider?: AuthProvider) => {
      if (provider) {
        setSelectedProvider(provider);
        setFormData({
          name: provider.name,
          clientId: provider.clientId,
          clientSecret: !provider.clientId ? "" : CLIENT_SECRET_PLACEHOLDER,
          authorizationUrl: provider.authorizationUrl,
          refreshUrl: provider.refreshUrl,
          tokenUrl: provider.tokenUrl,
          scopes: provider.scopes ?? [],
          contentType: provider.contentType || "application/x-www-form-urlencoded", // Use default if empty
        });
      } else {
        resetForm();
      }
      setDialogOpen(true);
    },
    [resetForm],
  );

  // Handle URL parameter for auto-opening edit dialog
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editProviderId = urlParams.get("edit");

    // Check for auto-open edit dialog from URL

    if (editProviderId && authProviders && authProviders.length > 0) {
      const providerToEdit = authProviders.find((p) => p.id === editProviderId);
      // Looking for provider to edit

      if (providerToEdit) {
        // Opening dialog for provider
        // Small delay to ensure the page is fully loaded
        setTimeout(() => {
          handleOpenDialog(providerToEdit);
        }, 100);
        // Clean up URL parameter
        window.history.replaceState({}, "", window.location.pathname);
      } else {
        // Provider not found with the specified ID
      }
    }
  }, [authProviders, handleOpenDialog]);

  const handleSaveProvider = async () => {
    if (
      !formData.name.trim() ||
      !formData.clientId.trim() ||
      !formData.authorizationUrl.trim() ||
      !formData.tokenUrl.trim()
    )
      return;

    try {
      const scopesList = formData.scopes || [];

      if (selectedProvider) {
        const updatedProvider = await api.authProviders.updateProvider(selectedProvider.id, {
          ...formData,
          clientSecret: formData.clientSecret === CLIENT_SECRET_PLACEHOLDER ? undefined : formData.clientSecret,
          scopes: scopesList,
        });
        setAuthProviders((providers) =>
          providers ? providers.map((p) => (p.id === updatedProvider.id ? updatedProvider : p)) : [updatedProvider],
        );
      } else {
        const newProvider = await api.authProviders.createProvider({
          ...formData,
          scopes: scopesList,
        });
        setAuthProviders((providers) => (providers ? [...providers, newProvider] : [newProvider]));

        trackEvent(AnalyticsEvents.OAUTH_PROVIDER_CREATED, {
          provider_id: newProvider.id,
          provider_name: newProvider.name,
        });
      }

      setDialogOpen(false);
      resetForm();
    } catch (error) {
      log.error("Error saving auth provider:", error);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    try {
      await api.authProviders.deleteProvider(providerId);
      setAuthProviders((providers) => (providers ? providers.filter((p) => p.id !== providerId) : []));
    } catch (error) {
      log.error("Error deleting auth provider:", error);
    }
  };

  const filteredProviders = authProviders
    ? authProviders.filter((provider) => provider.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Auth Providers" description="Manage global authentication providers and API configurations.">
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button title="Add a new authentication provider">
              <Plus className="mr-2 h-4 w-4" />
              Add Auth Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[650px]">
            <DialogHeader>
              <DialogTitle>{selectedProvider ? "Edit Auth Provider" : "Add Auth Provider"}</DialogTitle>
              <DialogDescription>
                Configure authentication for an external API or service. Fields marked with{" "}
                <span className="text-destructive">*</span> are required.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="provider-name">
                  Provider Name <Required />
                </Label>
                <Input
                  id="provider-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Spotify API"
                  autoFocus
                  title="Enter the name of the authentication provider"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client-id">
                    Client ID <Required />
                  </Label>
                  <Input
                    id="client-id"
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    placeholder="Client ID from provider"
                    title="Enter the client ID provided by the service"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-secret">Client Secret</Label>
                  <Input
                    id="client-secret"
                    type="password"
                    value={formData.clientSecret}
                    onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                    placeholder="Client secret from provider"
                    title="Enter the client secret provided by the service"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="auth-url">
                    Authorization URL <Required />
                  </Label>
                  <Input
                    id="auth-url"
                    value={formData.authorizationUrl}
                    onChange={(e) => setFormData({ ...formData, authorizationUrl: e.target.value })}
                    placeholder="https://provider.com/oauth/authorize"
                    title="Enter the OAuth 2.0 authorization endpoint URL"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="token-url">
                    Token URL <Required />
                  </Label>
                  <Input
                    id="token-url"
                    value={formData.tokenUrl}
                    onChange={(e) => setFormData({ ...formData, tokenUrl: e.target.value })}
                    placeholder="https://provider.com/oauth/token"
                    title="Enter the OAuth 2.0 token endpoint URL"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="refresh-url">Refresh URL</Label>
                  <Input
                    id="refresh-url"
                    value={formData.refreshUrl}
                    onChange={(e) => setFormData({ ...formData, refreshUrl: e.target.value })}
                    placeholder="https://provider.com/oauth/refresh"
                    title="Enter the OAuth 2.0 refresh token endpoint URL"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content-type">Content Type</Label>
                  <Select
                    value={formData.contentType}
                    onValueChange={(value) => setFormData({ ...formData, contentType: value === "none" ? "" : value })}
                  >
                    <SelectTrigger id="content-type">
                      <SelectValue placeholder="Select content type (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unset</SelectItem>
                      {availableContentTypes.map((contentType) => (
                        <SelectItem key={contentType} value={contentType}>
                          {contentType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scopes" className="mb-1 block">
                  Scopes
                </Label>
                <div className="h-[4.5rem]">
                  <ScopeChipsInput
                    scopes={formData.scopes}
                    onChange={(newScopes) => setFormData({ ...formData, scopes: newScopes })}
                    placeholder="Enter a scope (e.g. read:user)"
                  />
                </div>
              </div>
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

            <DialogFooter className="flex justify-between">
              <Button
                type="button"
                onClick={handleSaveProvider}
                disabled={
                  !formData.name.trim() ||
                  !formData.clientId.trim() ||
                  !formData.authorizationUrl.trim() ||
                  !formData.tokenUrl.trim()
                }
                title={selectedProvider ? "Save provider changes" : "Save new provider"}
              >
                {selectedProvider ? "Save Changes" : "Save Provider"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex items-center space-x-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search auth providers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            title="Search for authentication providers"
          />
        </div>
      </div>

      {loading || isNil(authProviders) ? (
        <div className="flex items-center justify-center p-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredProviders.length === 0 ? (
        <div className="border border-dashed rounded-lg p-10 text-center">
          <h3 className="text-lg font-medium mb-2">No auth providers configured</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Configure authentication providers to allow your tools to access external APIs and services.
          </p>
          <Button onClick={() => handleOpenDialog()} title="Add your first authentication provider">
            <Plus className="mr-2 h-4 w-4" />
            Add Auth Provider
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Client ID</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Content Type</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProviders.map((provider) => (
                <React.Fragment key={provider.id}>
                  <TableRow>
                    <TableCell className="font-medium">{provider.name}</TableCell>
                    <TableCell className="font-mono text-xs truncate max-w-[120px]" title={provider.clientId}>
                      {provider.clientId}
                    </TableCell>
                    <TableCell>
                      <ScopesList scopes={provider.scopes} />
                    </TableCell>
                    <TableCell>{provider.contentType || "Unset"}</TableCell>
                    <TableCell>
                      <TimeAgo date={provider.createdAt} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(provider)}
                          title={`Edit ${provider.name} configuration`}
                        >
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              title={`Delete ${provider.name} configuration`}
                            >
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete auth provider?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the auth provider configuration for {provider.name}. Any
                                tools using this provider will no longer be able to authenticate.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDeleteProvider(provider.id)}
                              >
                                Delete Provider
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                  {!provider.clientId && <WarningRow colSpan={6} providerId={provider.id} />}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
