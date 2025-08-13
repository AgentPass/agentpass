import { api } from "@/api";
import { ServerIdBackendUrl } from "@/api/api-options.ts";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useClipboard } from "@/hooks/use-clipboard";
import { openCursorDeeplink } from "@/utils/cursor-deeplink";
import { log } from "@/utils/log";
import { McpServer } from "@agentbridge/api";
import { Copy, ExternalLink } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";

interface ServerTooltipProps {
  serverId: string;
  children: ReactNode;
}

const DESKTOP_TARGETS = ["Claude", "Cursor", "VSCode", "Claude Web"] as const;
type DesktopTarget = (typeof DESKTOP_TARGETS)[number];

const desktopCommandTemplate = 'npx -y -p @ownid/mcp-remote@latest install {Target} "{ServerName}" {ServerUrl}';

export function ServerInstallTooltip({ serverId, children }: ServerTooltipProps) {
  const [server, setServer] = useState<McpServer | null>(null);
  const [open, setOpen] = useState(false);
  const [desktopTarget, setDesktopTarget] = useState<DesktopTarget>("Claude");
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

    loadServer();
  }, [serverId]);

  const handleCopy = (text: string) => {
    copyToClipboard(text);
  };

  if (!server) {
    return children;
  }
  const serverUrl = `${ServerIdBackendUrl(serverId)}/api/mcp`;

  const desktopCommand = desktopCommandTemplate
    .replace("{Target}", desktopTarget)
    .replace("{ServerName}", server.name)
    .replace("{ServerUrl}", serverUrl);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300} open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild onClick={() => setOpen(true)}>
          {children}
        </TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          className="bg-primary text-primary-foreground border-none w-[620px] p-3"
        >
          <div className="p-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                <span className="text-xs font-medium">CLI</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Installation - MCP Client</p>
              </div>
            </div>

            <div className="mt-3">
              <div className="mb-2">
                <p className="text-[11px] my-2">Select your desktop agent:</p>
                <div className="flex space-x-2">
                  {DESKTOP_TARGETS.map((target) => (
                    <Button
                      key={target}
                      size="sm"
                      variant="ghost"
                      className={`text-[11px] h-7 px-2 border ${
                        desktopTarget === target
                          ? "bg-blue-500 text-white font-medium hover:bg-blue-600 border-blue-400"
                          : "border-transparent hover:bg-gray-700/20"
                      }`}
                      onClick={() => setDesktopTarget(target)}
                    >
                      {target}
                    </Button>
                  ))}
                </div>
              </div>
              {desktopTarget === "Claude Web" ? (
                <div className="mt-3 space-y-2">
                  <ol className="list-decimal list-inside text-xs space-y-1">
                    <li>
                      Navigate to{" "}
                      <a
                        href="https://claude.ai/settings/integrations"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center underline text-white hover:text-blue-200 font-medium"
                      >
                        Settings &gt; Integrations
                      </a>
                    </li>
                    <li>
                      Toggle to <b>Organization integrations</b> at the top of the page
                    </li>
                    <li>
                      Locate the <b>Integrations</b> section
                    </li>
                    <li>
                      Click <b>Add custom integration</b> at the bottom of the section
                    </li>
                    <li>
                      Add your integration's remote MCP server URL:
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          value={serverUrl}
                          readOnly
                          className="w-full text-xs font-mono bg-primary-foreground/10 rounded px-2 py-1 border border-primary-foreground/20"
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 bg-primary-foreground/10 hover:bg-primary-foreground/20"
                          onClick={() => handleCopy(serverUrl)}
                        >
                          <Copy className="h-3 w-3 opacity-70" />
                        </Button>
                      </div>
                    </li>
                  </ol>
                </div>
              ) : (
                <>
                  <p className="text-[11px] my-2">Run the following command to install for {desktopTarget}</p>
                  <div className="bg-primary-foreground/10 p-2 rounded">
                    <div className="flex items-center justify-between gap-2">
                      <pre className="text-[11px] font-mono whitespace-pre-wrap flex-1">
                        <code>{desktopCommand}</code>
                      </pre>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 bg-primary-foreground/10 hover:bg-primary-foreground/20 [&>svg]:hover:opacity-100 [&>svg]:transition-opacity"
                        onClick={() => handleCopy(desktopCommand)}
                      >
                        <Copy className="h-3 w-3 opacity-70" />
                      </Button>
                    </div>
                  </div>
                  {desktopTarget === "Cursor" && (
                    <div className="mt-3">
                      <p className="text-[11px] mb-2">Or open directly in Cursor:</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-[11px] h-8 bg-primary-foreground/10 hover:bg-primary-foreground/20 border-primary-foreground/20"
                        onClick={() => openCursorDeeplink(server.name, serverUrl)}
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        Open in Cursor
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
