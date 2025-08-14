import { api } from "@/api";
import { ServerIdBackendUrl } from "@/api/api-options.ts";
import ClaudeIcon from "@/assets/claude-icon.svg";
import CursorIcon from "@/assets/cursor-icon.svg";
import VSCodeIcon from "@/assets/vscode-icon.svg";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useClipboard } from "@/hooks/use-clipboard";
import { openCursorDeeplink } from "@/utils/cursor-deeplink";
import { log } from "@/utils/log";
import { McpServer } from "@agentbridge/api";
import { Copy, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { LLMPlatform } from "../nodes/LLMNode";

interface LLMInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: LLMPlatform;
  serverId: string;
  serverName: string;
}

const PLATFORM_DETAILS: Record<LLMPlatform, { color: string; icon: string | React.ComponentType }> = {
  Claude: { color: "#6B5B95", icon: ClaudeIcon },
  "Claude Web": { color: "#6B5B95", icon: ClaudeIcon },
  Cursor: { color: "#10B981", icon: CursorIcon },
  VSCode: { color: "#007ACC", icon: VSCodeIcon },
};

export function LLMInstallModal({ isOpen, onClose, platform, serverId, serverName }: LLMInstallModalProps) {
  const [server, setServer] = useState<McpServer | null>(null);
  const { copyToClipboard } = useClipboard();

  useEffect(() => {
    async function loadServer() {
      try {
        const serverData = await api.servers.getServer(serverId);
        setServer(serverData || null);
      } catch (error) {
        log.error("Error loading server:", error);
      }
    }
    if (isOpen) {
      loadServer();
    }
  }, [serverId, isOpen]);

  if (!server) {
    return null;
  }

  const serverUrl = `${ServerIdBackendUrl(serverId)}/api/mcp`;
  const desktopCommandTemplate = 'npx -y -p @ownid/mcp-remote@latest install {Target} "{ServerName}" {ServerUrl}';
  const desktopCommand = desktopCommandTemplate
    .replace("{Target}", platform)
    .replace("{ServerName}", serverName)
    .replace("{ServerUrl}", serverUrl);

  const platformDetail = PLATFORM_DETAILS[platform];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-muted">
              {typeof platformDetail.icon === "string" ? (
                <img src={platformDetail.icon} alt={platform} className="w-8 h-8" />
              ) : (
                <platformDetail.icon />
              )}
            </div>
            <div>
              <div>
                Install {serverName} in {platform}
              </div>
              <DialogDescription className="mt-1">
                Follow the instructions below to connect your MCP server
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6">
          {platform === "Claude Web" ? (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-medium text-sm mb-3">Installation Steps:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>
                    Navigate to{" "}
                    <a
                      href="https://claude.ai/settings/integrations"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center underline text-primary hover:text-primary/80 font-medium"
                    >
                      Settings &gt; Integrations
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </li>
                  <li>
                    Toggle to <strong>Organization integrations</strong> at the top of the page
                  </li>
                  <li>
                    Locate the <strong>Integrations</strong> section
                  </li>
                  <li>
                    Click <strong>Add custom integration</strong> at the bottom of the section
                  </li>
                  <li>Add your integration's remote MCP server URL:</li>
                </ol>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <label className="text-sm font-medium mb-2 block">MCP Server URL</label>
                <div className="flex items-center gap-2">
                  <input
                    value={serverUrl}
                    readOnly
                    className="flex-1 font-mono text-sm bg-background rounded-md px-3 py-2 border border-input"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(serverUrl)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <label className="text-sm font-medium mb-2 block">Run this command in your terminal:</label>
                <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <code className="flex-1 whitespace-pre-wrap">{desktopCommand}</code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 hover:bg-white/10"
                      onClick={() => copyToClipboard(desktopCommand)}
                    >
                      <Copy className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                </div>
              </div>

              {platform === "Cursor" && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-3">Or open directly in Cursor:</p>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => openCursorDeeplink(serverName, serverUrl)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Cursor
                  </Button>
                </div>
              )}

              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Make sure you have Node.js installed and {platform} is closed before running
                  the installation command.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
