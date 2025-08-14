import { api } from "@/api";
import { JwtProvider, ValidateJwksUrlResponse } from "@/api/services/server-auth";
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
import { ServerAuthType } from "@agentbridge/api";
import { AlertCircle, Check, CheckCircle, Edit, Plus, Shield, ShieldCheck } from "lucide-react";
import { useState } from "react";

type Props = {
  serverId: string;
  currentAuthType: ServerAuthType;
  currentJwtProviderId?: string;
  jwtProviders: JwtProvider[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSelected: (authType: ServerAuthType, jwtProviderId?: string) => void;
  onJwtProviderCreated: (provider: JwtProvider) => void;
  onJwtProviderUpdated: (provider: JwtProvider) => void;
  onJwtProviderDeleted: (providerId: string) => void;
  loading?: boolean;
  onDialogOpen?: () => void;
};

export const ServerAuthSelectDialog = ({
  serverId,
  currentAuthType,
  currentJwtProviderId,
  jwtProviders,
  isOpen,
  setIsOpen,
  onSelected,
  onJwtProviderCreated,
  onJwtProviderUpdated,
  onJwtProviderDeleted,
  loading,
  onDialogOpen,
}: Props) => {
  // Provider management state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<JwtProvider | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [newProviderName, setNewProviderName] = useState("");
  const [newProviderUrl, setNewProviderUrl] = useState("");

  // Verification state
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<ValidateJwksUrlResponse | null>(null);

  const handleSelect = (authType: ServerAuthType, jwtProviderId?: string) => {
    onSelected(authType, jwtProviderId);
    setIsOpen(false);
    resetForm();
  };

  const handleVerifyJwksUrl = async () => {
    if (!newProviderUrl.trim()) return;

    setVerifying(true);
    setVerificationResult(null);
    try {
      const result = await api.serverAuth.validateJwksUrl(newProviderUrl.trim());
      setVerificationResult(result);
    } catch (error) {
      setVerificationResult({
        valid: false,
        error: error instanceof Error ? error.message : "Failed to verify JWKS URL",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleCreateJwtProvider = async () => {
    if (!newProviderName.trim() || !newProviderUrl.trim()) return;

    setCreating(true);
    try {
      // First, ensure server is switched to JWT auth mode
      if (currentAuthType !== ServerAuthType.JWT) {
        await api.serverAuth.updateServerAuthConfig(serverId, {
          authType: ServerAuthType.JWT,
        });
      }

      // Then create the JWT provider
      const provider = await api.serverAuth.createJwtProvider(serverId, {
        name: newProviderName.trim(),
        jwksUrl: newProviderUrl.trim(),
        enabled: true,
      });
      onJwtProviderCreated(provider);

      // Finally select the newly created provider
      handleSelect(ServerAuthType.JWT, provider.id);
    } catch {
      // Error handling can be enhanced here if needed
    } finally {
      setCreating(false);
    }
  };

  const handleEditProvider = (provider: JwtProvider) => {
    setEditingProvider(provider);
    setNewProviderName(provider.name);
    setNewProviderUrl(provider.jwksUrl);
    setShowCreateForm(false);
    setVerificationResult(null);
  };

  const handleUpdateJwtProvider = async () => {
    if (!editingProvider || !newProviderName.trim() || !newProviderUrl.trim()) return;

    setUpdating(true);
    try {
      const updatedProvider = await api.serverAuth.updateJwtProvider(serverId, editingProvider.id, {
        name: newProviderName.trim(),
        jwksUrl: newProviderUrl.trim(),
      });
      onJwtProviderUpdated(updatedProvider);
      resetForm();
    } catch {
      // Error handling can be added here if needed
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteJwtProvider = async (providerId: string) => {
    setDeleting(providerId);
    try {
      await api.serverAuth.deleteJwtProvider(serverId, providerId);
      onJwtProviderDeleted(providerId);

      // If we're deleting the currently selected provider, switch to Basic auth
      if (currentJwtProviderId === providerId) {
        handleSelect(ServerAuthType.BASE);
        return; // handleSelect will close the dialog
      }
    } catch {
      // Error handling can be added here if needed
    } finally {
      setDeleting(null);
    }
  };

  const resetForm = () => {
    setShowCreateForm(false);
    setEditingProvider(null);
    setNewProviderName("");
    setNewProviderUrl("");
    setVerificationResult(null);
  };

  const isCurrentProvider = (authType: ServerAuthType, jwtProviderId?: string) => {
    if (authType === ServerAuthType.BASE) {
      return currentAuthType === ServerAuthType.BASE;
    }
    if (authType === ServerAuthType.JWT && jwtProviderId) {
      return currentAuthType === ServerAuthType.JWT && currentJwtProviderId === jwtProviderId;
    }
    return false;
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            onDialogOpen?.();
            setIsOpen(true);
          }}
        >
          Change Authentication
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Server Authentication</DialogTitle>
          <DialogDescription>Choose an authentication provider for this MCP server.</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {loading && (
            <div className="text-center py-4">
              <div className="text-sm text-muted-foreground">Loading JWT providers...</div>
            </div>
          )}

          {/* Basic Authentication - Always available */}
          <div
            className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
              isCurrentProvider(ServerAuthType.BASE) ? "border-blue-500" : ""
            }`}
            onClick={() => handleSelect(ServerAuthType.BASE)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="font-medium">Basic Authentication</div>
                  <div className="text-sm text-muted-foreground">Simple token-based validation</div>
                </div>
              </div>
              {isCurrentProvider(ServerAuthType.BASE) && <Check className="h-5 w-5 text-blue-500" />}
            </div>
          </div>

          {/* JWT Providers */}
          {jwtProviders.map((provider) => (
            <div
              key={provider.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                isCurrentProvider(ServerAuthType.JWT, provider.id) ? "border-blue-500" : ""
              }`}
              onClick={() => handleSelect(ServerAuthType.JWT, provider.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">{provider.name}</div>
                    <div className="text-sm text-muted-foreground">JWKS: {provider.jwksUrl}</div>
                    <div className="text-xs text-muted-foreground">Cryptographic JWT signature verification</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isCurrentProvider(ServerAuthType.JWT, provider.id) && <Check className="h-5 w-5 text-blue-500" />}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditProvider(provider);
                    }}
                    disabled={updating || deleting === provider.id}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Add Provider Button - Only show if no JWT providers exist */}
          {jwtProviders.length === 0 && !showCreateForm && !editingProvider && (
            <div
              className="border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => setShowCreateForm(true)}
            >
              <div className="flex items-center gap-3">
                <Plus className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Add JWT Provider</div>
                  <div className="text-sm text-muted-foreground">Add JWT authentication provider</div>
                </div>
              </div>
            </div>
          )}

          {/* Create Provider Form */}
          {showCreateForm && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Plus className="h-4 w-4" />
                  <span className="font-medium">Create JWKS Provider</span>
                </div>

                <div>
                  <Label htmlFor="provider-name">Provider Name</Label>
                  <Input
                    id="provider-name"
                    value={newProviderName}
                    onChange={(e) => setNewProviderName(e.target.value)}
                    placeholder="e.g. Auth0, Keycloak, Custom JWT"
                  />
                </div>

                <div>
                  <Label htmlFor="jwks-url">JWKS URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="jwks-url"
                      value={newProviderUrl}
                      onChange={(e) => setNewProviderUrl(e.target.value)}
                      placeholder="https://your-auth-provider.com/.well-known/jwks.json"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleVerifyJwksUrl}
                      disabled={verifying || !newProviderUrl.trim()}
                    >
                      {verifying ? "Verifying..." : "Verify URL"}
                    </Button>
                  </div>

                  {/* Verification Results Block */}
                  {verificationResult && (
                    <div
                      className={`mt-2 p-3 rounded-md border ${
                        verificationResult.valid
                          ? "bg-green-50 border-green-200 text-green-800"
                          : "bg-red-50 border-red-200 text-red-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {verificationResult.valid ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">
                          {verificationResult.valid ? "URL is valid" : "URL is invalid"}
                        </span>
                        {verificationResult.valid && verificationResult.keyCount && (
                          <span className="text-sm">• Found {verificationResult.keyCount} key(s)</span>
                        )}
                        {verificationResult.error && <span className="text-sm">• {verificationResult.error}</span>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateJwtProvider}
                    disabled={creating || !newProviderName.trim() || !newProviderUrl.trim()}
                  >
                    {creating ? "Creating..." : "Create & Select"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Provider Form - Only shown when editing */}
          {editingProvider && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Edit className="h-4 w-4" />
                  <span className="font-medium">Edit {editingProvider.name}</span>
                </div>

                <div>
                  <Label htmlFor="provider-name">Provider Name</Label>
                  <Input
                    id="provider-name"
                    value={newProviderName}
                    onChange={(e) => setNewProviderName(e.target.value)}
                    placeholder="e.g. Auth0, Keycloak, Custom JWT"
                  />
                </div>

                <div>
                  <Label htmlFor="jwks-url">JWKS URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="jwks-url"
                      value={newProviderUrl}
                      onChange={(e) => setNewProviderUrl(e.target.value)}
                      placeholder="https://your-auth-provider.com/.well-known/jwks.json"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleVerifyJwksUrl}
                      disabled={verifying || !newProviderUrl.trim()}
                    >
                      {verifying ? "Verifying..." : "Verify URL"}
                    </Button>
                  </div>

                  {/* Verification Results Block */}
                  {verificationResult && (
                    <div
                      className={`mt-2 p-3 rounded-md border ${
                        verificationResult.valid
                          ? "bg-green-50 border-green-200 text-green-800"
                          : "bg-red-50 border-red-200 text-red-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {verificationResult.valid ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">
                          {verificationResult.valid ? "URL is valid" : "URL is invalid"}
                        </span>
                        {verificationResult.valid && verificationResult.keyCount && (
                          <span className="text-sm">• Found {verificationResult.keyCount} key(s)</span>
                        )}
                        {verificationResult.error && <span className="text-sm">• {verificationResult.error}</span>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="destructive"
                    onClick={() => editingProvider && handleDeleteJwtProvider(editingProvider.id)}
                    disabled={updating || deleting === editingProvider?.id}
                  >
                    {deleting === editingProvider?.id ? "Deleting..." : "Delete Provider"}
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleUpdateJwtProvider}
                      disabled={updating || !newProviderName.trim() || !newProviderUrl.trim()}
                    >
                      {updating ? "Updating..." : "Update Provider"}
                    </Button>
                    <Button variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsOpen(false);
              resetForm();
            }}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
