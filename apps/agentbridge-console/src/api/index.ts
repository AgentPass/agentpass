import { ConfigAPIService } from "@/api/services/config.ts";
import { AdminsAPIService } from "./services/admins.ts";
import { AnalyticsAPIService } from "./services/analytics.ts";
import { AuthProvidersAPIService } from "./services/auth-providers.ts";
import { MirrorAPIService } from "./services/mirror";
import { ServerAuthAPIService } from "./services/server-auth";
import { ServersAPIService } from "./services/servers";
import { ToolsAPIService } from "./services/tools";
import { UsersAPIService } from "./services/users";

export const api = {
  authProviders: AuthProvidersAPIService,
  analytics: AnalyticsAPIService,
  mirror: MirrorAPIService,
  servers: ServersAPIService,
  serverAuth: ServerAuthAPIService,
  tools: ToolsAPIService,
  users: UsersAPIService,
  admins: AdminsAPIService,
  config: ConfigAPIService,
} as const;
