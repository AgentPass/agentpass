import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import { trackEvent } from "@/utils/analytics";
import { log } from "@/utils/log";
import { AnalyticsEvents } from "@agentbridge/utils";
import { ArrowLeft } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateServerPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    setLoading(true);
    try {
      const server = await api.servers.createServer({
        name,
        description,
        baseUrl: "/",
        enabled: true,
      });
      trackEvent(AnalyticsEvents.MCP_SERVER_CREATE_COMPLETED, {
        server_id: server.id,
        creation_method: "manual",
      });
      navigate(`/servers/${server.id}/workflows`);
    } catch (error) {
      const message = error instanceof Error ? error.message : error;
      log.error("Error creating server:", message);

      trackEvent(AnalyticsEvents.MCP_SERVER_CREATE_FAILED, {
        server_name: name,
        error: message,
        creation_method: "manual",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader title="Create MCP Server" description="Create a new server to connect AI agents with external APIs.">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </PageHeader>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Create Server</CardTitle>
          <CardDescription>Enter the details for your new MCP server.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="server-name">Server Name *</Label>
              <Input
                id="server-name"
                placeholder="My API Server"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="server-description">Description</Label>
              <Textarea
                id="server-description"
                placeholder="Describe what this server provides..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-6">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || loading}>
              {loading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Creating...
                </>
              ) : (
                <>Create Server</>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
