import { ScopesList } from "@/components/auth-providers/scopes-list.tsx";
import { ToolAuthSelectDialog } from "@/components/tools/toolAuthSelectDialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { OAuthProvider, Tool } from "@agentbridge/api";
import { useState } from "react";

type Props = {
  tool: Tool;
  providers: OAuthProvider[];
};
export const ToolAuth = ({ tool, providers }: Props) => {
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(tool.oAuthProviderId || null);
  return (
    providers.length > 0 && (
      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-medium">Authentication</h3>
        {selectedProviderId ? (
          <>
            <p className="text-sm text-muted-foreground">This endpoint uses OAuth authentication:</p>
            <div className="bg-muted p-3 rounded-md">
              {providers.find((p) => p.id === selectedProviderId) ? (
                <>
                  <div className="text-sm font-medium pb-2">
                    {providers.find((p) => p.id === selectedProviderId)!.name}
                  </div>
                  <ScopesList scopes={providers.find((p) => p.id === selectedProviderId)!.scopes} />
                </>
              ) : (
                <div className="text-sm">Provider data not available</div>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                tool.oAuthProviderId = null;
                setSelectedProviderId(null);
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
                setSelectedProviderId(providerId);
                tool.oAuthProviderId = providerId;
              }}
            />
          </>
        )}
      </div>
    )
  );
};
