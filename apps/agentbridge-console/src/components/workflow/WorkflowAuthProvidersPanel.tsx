import { api } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OAuthProvider } from "@agentbridge/api";
import { ChevronLeft, ChevronRight, Key, Lock, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AuthProviderItem, DraggableAuthProviderItem } from "./DraggableAuthProviderItem";

interface WorkflowAuthProvidersPanelProps {
  serverId: string;
  onProviderDrop: (provider: AuthProviderItem, position: { x: number; y: number }) => void;
  onDragStart?: (provider: AuthProviderItem | null) => void;
  onClose?: () => void;
}

export const WorkflowAuthProvidersPanel: React.FC<WorkflowAuthProvidersPanelProps> = ({
  serverId,
  onProviderDrop,
  onDragStart,
  onClose,
}) => {
  const [oauthProviders, setOauthProviders] = useState<OAuthProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  // Fetch auth providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        const oauth = await api.authProviders.getProviders();
        setOauthProviders(oauth);
      } catch {
        // Handle error silently
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [serverId]);

  // Convert providers to AuthProviderItem format
  const authProviderItems: AuthProviderItem[] = [
    ...oauthProviders.map((provider) => ({
      id: provider.id,
      name: provider.name,
      type: "oauth" as const,
      provider,
    })),
    // For demo purposes, add some mock API Key providers
    { id: "apikey-1", name: "Default API Key", type: "apikey" as const },
    { id: "apikey-2", name: "Production API Key", type: "apikey" as const },
  ];

  const handleProviderClick = useCallback((providerId: string) => {
    setSelectedProvider((prev) => (prev === providerId ? null : providerId));
  }, []);

  if (isCollapsed) {
    return (
      <div className="absolute left-0 top-24 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="rounded-r-lg rounded-l-none shadow-md bg-white hover:bg-gray-50"
        >
          <ChevronRight className="h-4 w-4 mr-1" />
          <Lock className="h-4 w-4 mr-1" />
          Auth
        </Button>
      </div>
    );
  }

  return (
    <div className="absolute left-0 top-24 w-80 h-[calc(100vh-8rem)] bg-white border-r shadow-lg z-10 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Lock className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Auth Providers</h3>
          <Badge variant="secondary" className="text-xs">
            {authProviderItems.length}
          </Badge>
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(true)} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Search/Filter (optional future enhancement) */}
      <div className="p-4 border-b">
        <p className="text-sm text-muted-foreground">
          Drag providers to the workflow canvas to create authentication nodes
        </p>
      </div>

      {/* Providers List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : authProviderItems.length === 0 ? (
            <div className="text-center py-8">
              <Lock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No authentication providers configured</p>
              <Button variant="outline" size="sm" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Provider
              </Button>
            </div>
          ) : (
            <>
              {/* OAuth Providers */}
              {oauthProviders.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <Lock className="h-4 w-4 text-purple-600" />
                    <h4 className="text-sm font-medium text-gray-700">OAuth Providers</h4>
                    <Badge variant="outline" className="text-xs text-purple-700">
                      {oauthProviders.length}
                    </Badge>
                  </div>
                  {oauthProviders.map((provider) => (
                    <DraggableAuthProviderItem
                      key={provider.id}
                      provider={{
                        id: provider.id,
                        name: provider.name,
                        type: "oauth",
                        provider,
                      }}
                      onDrop={onProviderDrop}
                      onDragStart={onDragStart}
                      onDragEnd={() => onDragStart?.(null)}
                      selected={selectedProvider === provider.id}
                      onClick={() => handleProviderClick(provider.id)}
                      compact
                    />
                  ))}
                </div>
              )}

              {/* API Key Providers */}
              {authProviderItems.filter((p) => p.type === "apikey").length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <Key className="h-4 w-4 text-green-600" />
                    <h4 className="text-sm font-medium text-gray-700">API Key Providers</h4>
                    <Badge variant="outline" className="text-xs text-green-700">
                      {authProviderItems.filter((p) => p.type === "apikey").length}
                    </Badge>
                  </div>
                  {authProviderItems
                    .filter((p) => p.type === "apikey")
                    .map((provider) => (
                      <DraggableAuthProviderItem
                        key={provider.id}
                        provider={provider}
                        onDrop={onProviderDrop}
                        onDragStart={onDragStart}
                        onDragEnd={() => onDragStart?.(null)}
                        selected={selectedProvider === provider.id}
                        onClick={() => handleProviderClick(provider.id)}
                        compact
                      />
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer with instructions */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-start space-x-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
          <p className="text-xs text-muted-foreground">
            Drag providers to create auth nodes, then connect tools to authenticate them
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkflowAuthProvidersPanel;
