import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ServerAnalyticsPage from "./server";
import ToolAnalyticsPage from "./tools";

export default function AnalyticsLayout() {
  const { serverId } = useParams<{ serverId: string }>();
  const navigate = useNavigate();
  const { "*": subPath } = useParams<{ "*": string }>();

  const [activeTab, setActiveTab] = useState<string>("server");

  useEffect(() => {
    if (subPath) {
      if (subPath.includes("analytics")) {
        setActiveTab("analytics");
      } else if (subPath.includes("tools")) {
        setActiveTab("tools");
      } else if (subPath.includes("server")) {
        setActiveTab("server");
      }
    }
  }, [subPath]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/servers/${serverId}/analytics/${value}`);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="server" className="gap-2">
              <BarChart className="h-4 w-4" />
              Server
            </TabsTrigger>
            <TabsTrigger value="tools" className="gap-2">
              <Wrench className="h-4 w-4" />
              Tools
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="server">
          <ServerAnalyticsPage />
        </TabsContent>
        <TabsContent value="tools">
          <ToolAnalyticsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
