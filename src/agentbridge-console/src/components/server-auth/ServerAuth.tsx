import { api } from "@/api";
import { JwtProvider, ServerAuthConfigResponse } from "@/api/services/server-auth";
import { ServerAuthSelectDialog } from "@/components/server-auth/ServerAuthSelectDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServerAuthType } from "@agentbridge/api";
import { useEffect, useState } from "react";

type Props = {
  serverId: string;
  authType?: ServerAuthType;
  authConfig?: {
    id: string;
    jwtProvider?: {
      id: string;
      name: string;
      jwksUrl: string;
      enabled: boolean;
    };
  };
};

export const ServerAuth = ({ serverId, authType, authConfig }: Props) => {
  const [config, setConfig] = useState<ServerAuthConfigResponse | null>(null);
  const [jwtProviders, setJwtProviders] = useState<JwtProvider[]>([]);
  const [selectDialogOpen, setSelectDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize config from props
  useEffect(() => {
    if (authType !== undefined) {
      setConfig({
        serverId,
        authType,
        authConfig,
      });
    }
  }, [serverId, authType, authConfig]);

  const loadJwtProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      const providersData = await api.serverAuth.getJwtProviders(serverId);
      setJwtProviders(providersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load JWT providers");
      // Error is already captured in state for UI display
    } finally {
      setLoading(false);
    }
  };

  const handleDialogOpen = () => {
    setSelectDialogOpen(true);
    // Only load JWT providers when dialog opens
    if (jwtProviders.length === 0) {
      loadJwtProviders();
    }
  };

  const handleAuthTypeSelected = async (authType: ServerAuthType, jwtProviderId?: string) => {
    setUpdating(true);
    try {
      const updatedConfig = await api.serverAuth.updateServerAuthConfig(serverId, {
        authType,
        jwtProviderId,
      });
      setConfig(updatedConfig);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update server auth configuration");
      // Error is already logged in state
    } finally {
      setUpdating(false);
    }
  };

  const handleJwtProviderCreated = (provider: JwtProvider) => {
    setJwtProviders((prev) => [...prev, provider]);
  };

  const handleJwtProviderUpdated = (updatedProvider: JwtProvider) => {
    setJwtProviders((prev) => prev.map((p) => (p.id === updatedProvider.id ? updatedProvider : p)));
    // If this is the currently selected provider, update the config display
    if (config?.authConfig?.jwtProvider?.id === updatedProvider.id) {
      setConfig((prev) =>
        prev
          ? {
              ...prev,
              authConfig: {
                ...prev.authConfig!,
                jwtProvider: updatedProvider,
              },
            }
          : null,
      );
    }
  };

  const handleJwtProviderDeleted = (providerId: string) => {
    setJwtProviders((prev) => prev.filter((p) => p.id !== providerId));
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Server Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600 mb-3">{error}</div>
          <Button size="sm" variant="outline" onClick={loadJwtProviders}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Server Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">No authentication configuration available.</div>
        </CardContent>
      </Card>
    );
  }

  const currentAuthType = config?.authType || ServerAuthType.BASE;
  // Handle both possible data structures for backward compatibility
  const currentJwtProvider =
    config?.authConfig?.jwtProvider ||
    (config as ServerAuthConfigResponse & { jwtProvider?: JwtProvider })?.jwtProvider;
  const currentJwtProviderId = currentJwtProvider?.id;

  const getAuthTypeLabel = (authType: ServerAuthType) => {
    if (authType === ServerAuthType.JWT && currentJwtProvider) {
      return currentJwtProvider.name;
    }
    switch (authType) {
      case ServerAuthType.BASE:
        return "Basic Authentication";
      case ServerAuthType.JWT:
        return "JWT Authentication";
      default:
        return "Unknown";
    }
  };

  const getAuthTypeDescription = (authType: ServerAuthType) => {
    switch (authType) {
      case ServerAuthType.BASE:
        return "Simple token-based authentication";
      case ServerAuthType.JWT:
        return currentJwtProvider ? `JWT: ${currentJwtProvider.jwksUrl}` : "Cryptographic JWT signature verification";
      default:
        return "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Server Authentication</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-3 rounded-md">
          <div className="text-sm font-medium mb-1">{getAuthTypeLabel(currentAuthType)}</div>
          <div className="text-sm text-muted-foreground">{getAuthTypeDescription(currentAuthType)}</div>
        </div>

        <ServerAuthSelectDialog
          serverId={serverId}
          currentAuthType={currentAuthType}
          currentJwtProviderId={currentJwtProviderId}
          jwtProviders={jwtProviders}
          isOpen={selectDialogOpen}
          setIsOpen={setSelectDialogOpen}
          onSelected={handleAuthTypeSelected}
          onJwtProviderCreated={handleJwtProviderCreated}
          onJwtProviderUpdated={handleJwtProviderUpdated}
          onJwtProviderDeleted={handleJwtProviderDeleted}
          loading={loading}
          onDialogOpen={handleDialogOpen}
        />
      </CardContent>
    </Card>
  );
};
