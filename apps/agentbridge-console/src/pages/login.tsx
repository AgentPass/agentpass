import { api } from "@/api";
import { ApiClientOptions, ServerIdBackendUrl } from "@/api/api-options.ts";
import { CliCommunicationService } from "@/api/services/cli.ts";
import { Logo } from "@/components/Logo.tsx";
import { CardFooter } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context.tsx";
import { fetchData } from "@/hooks/fetch-data.ts";
import { NotFoundError } from "@/pages/oauth-callback.tsx";
import { trackEvent } from "@/utils/analytics";
import { OwnIdConfig } from "@agentbridge/api";
import { AnalyticsEvents } from "@agentbridge/utils";
import { useCallback, useRef, useState } from "react";
import { createSearchParams, useNavigate } from "react-router-dom";
import useAsyncEffect from "use-async-effect";

const STUDIO_URLS = ["https://studio.dev.agentpass.ai", "https://studio.agentpass.ai", "https://agentpass.studio"];

const FRONTEND_CALLBACK_ROUTE = "/oauth/callback";

export const BACKEND_CALLBACK_ROUTE = "/api/oauth/callback";

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ownidConfig, setOwnidConfig] = useState<OwnIdConfig>();
  const { user, startAuth } = useAuth();
  const loginAttemptTracked = useRef(false);
  const urlParams = new URLSearchParams(window.location.search);
  const scope = urlParams.get("scope");
  const state = urlParams.get("state");
  const serverId = urlParams.get("server_id");
  const serverName = urlParams.get("server_name");
  const isCli = !!urlParams.get("cli");
  const redirectUri = urlParams.get("redirect_uri");
  const isStudio = redirectUri && STUDIO_URLS.some((url) => redirectUri.startsWith(url));
  const easterEggSuccess = urlParams.get("easter_egg") === "success";
  const emailParam = urlParams.get("email");

  useAsyncEffect(async () => {
    await fetchData([api.config.ownIdConfig(serverId)], [setOwnidConfig], setLoading);
  }, [serverId]);

  const authComplete = useCallback(
    ({ token }: { token: string }) => {
      setLoading(true);
      if (isStudio) {
        const url = new URL(redirectUri);
        url.searchParams.set("token", token || "");
        url.searchParams.set("state", state || "");
        window.location.replace(url.toString());
      } else if (isCli) {
        CliCommunicationService.auth(token, state);
      } else if (serverId) {
        const backendUrl = serverId ? ServerIdBackendUrl(serverId) : ApiClientOptions.baseUrl;
        const url = new URL(`${backendUrl}${BACKEND_CALLBACK_ROUTE}`);
        url.searchParams.set("scope", scope || "");
        url.searchParams.set("state", state || "");
        url.searchParams.set("code", token);
        window.location.href = url.toString();
      } else {
        navigate({
          pathname: FRONTEND_CALLBACK_ROUTE,
          search: createSearchParams({
            token,
          }).toString(),
        });
      }
    },
    [isCli, isStudio, navigate, redirectUri, scope, serverId, state],
  );

  const onAccountNotFound = useCallback(
    (email: string) => {
      trackEvent(AnalyticsEvents.ADMIN_LOGIN_FAILED, {
        email,
        error_type: "account_not_found",
        reason: "User email not registered",
      });

      navigate({
        pathname: FRONTEND_CALLBACK_ROUTE,
        search: createSearchParams({
          error: NotFoundError,
          email,
        }).toString(),
      });
    },
    [navigate],
  );

  useAsyncEffect(async () => {
    if (!ownidConfig) {
      return;
    }

    if (user && !serverId && !isCli && !isStudio) {
      navigate("/", { replace: true });
    } else if ((!user || serverId || isCli || isStudio) && !loginAttemptTracked.current) {
      loginAttemptTracked.current = true;
      trackEvent(AnalyticsEvents.ADMIN_LOGIN_ATTEMPTED, {
        email: emailParam || undefined,
        source: urlParams.get("source") || "direct",
      });

      const loginStartTime = Date.now();
      const startAuthPromise = startAuth(
        serverId,
        ownidConfig,
        (res) => {
          const timeToLogin = Date.now() - loginStartTime;
          trackEvent(AnalyticsEvents.ADMIN_LOGIN_SUCCESS, {
            method: "ownid",
            time_to_login_ms: timeToLogin,
          });

          // eslint-disable-next-line promise/catch-or-return
          startAuthPromise.then(() => authComplete(res));
        },
        onAccountNotFound,
        emailParam ? emailParam : undefined,
      );
    }
  }, [user, navigate, ownidConfig, serverId]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 bg-[#112448] text-white px-4 md:px-10 py-4 md:py-0">
        {easterEggSuccess && !loading && (
          <div className="flex flex-col items-center gap-4 p-6 bg-blue-900/20 border border-blue-500/30 rounded-lg mb-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-blue-400">
                <span role="img" aria-label="rocket">
                  🚀
                </span>{" "}
                Account Activated!
              </h2>
              <p className="text-sm text-gray-400">Please sign in with {emailParam || "your email"} to continue.</p>
            </div>
          </div>
        )}
        {(!serverId || !serverName) && <Logo className="mb-6" />}
        {serverId && serverName ? (
          <>
            <div>Login to MCP Server</div>
            <p className="text-center pt-1 md:pt-4 text-xl md:text-4xl max-w-md">{serverName}</p>
          </>
        ) : (
          <p className="text-center text-sm md:text-lg max-w-md">
            Connect AI Agents to APIs using fully-hosted MCP servers with built-in authentication, authorization and
            analytics
          </p>
        )}
        <CardFooter className="flex flex-col gap-2 pt-3 md:pt-6">
          <div className="border-t border-border w-full m-2 md:m-4" />
          <div className="flex justify-center text-xs text-muted-foreground gap-2">
            <a href="https://www.ownid.com/legal/privacy-policy" className="underline">
              Privacy Policy
            </a>
            <span>•</span>
            <a href="https://www.ownid.com/legal/terms-of-service" className="underline">
              Terms of Service
            </a>
          </div>
        </CardFooter>
      </div>
      <div className="flex items-center justify-center w-full md:w-1/2 bg-[#11172a] p-4 md:p-0">
        {loading && (
          <div className="flex items-center gap-2 pt-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
            <span>Redirecting...</span>
          </div>
        )}
      </div>
    </div>
  );
}
