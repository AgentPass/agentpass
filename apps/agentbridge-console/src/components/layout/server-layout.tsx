import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { ServerInstallTooltip } from "@/components/ui/server-install-tooltip.tsx";
import { fetchData } from "@/hooks/fetch-data.ts";
import { McpServer } from "@agentbridge/api";
import { Terminal } from "lucide-react";
import { useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import useAsyncEffect from "use-async-effect";

export interface ServerContextType {
  server: McpServer;
}

export default function ServerLayout() {
  const { serverId } = useParams<{ serverId: string }>();
  const [server, setServer] = useState<McpServer | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useAsyncEffect(async () => {
    if (!serverId) return;

    const serverData = await api.servers.getServer(serverId);
    if (!serverData) {
      navigate("/servers");
      return;
    }

    await fetchData([Promise.resolve(serverData)], [setServer], setLoading);
  }, [serverId, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!server) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <h1 className="text-2xl font-semibold">{server.name}</h1>
          <p className="text-sm text-muted-foreground whitespace-nowrap overflow-hidden block text-ellipsis max-w-[60vw]">
            {server.description}
          </p>
        </div>

        <ServerInstallTooltip serverId={server.id}>
          <Button variant="outline" size="sm" title="Server installation">
            <Terminal className="mr-2 h-4 w-4" />
            Install
          </Button>
        </ServerInstallTooltip>
      </div>

      <div className="pb-10">
        <Outlet context={{ server }} />
      </div>
    </div>
  );
}
