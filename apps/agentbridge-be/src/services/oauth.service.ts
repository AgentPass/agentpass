import { OAuthProvider, ProviderToken } from "@prisma/client";
import axios from "axios";
import { Request } from "express";
import { StatusCodes } from "http-status-codes";
import omit from "lodash/omit.js";
import qs from "qs";
import { Logger } from "winston";
import { OAuthError } from "../types/error.types.js";
import { isLocalRun } from "../utils/config.js";
import { Database } from "../utils/connection.js";

export const ENDUSER_SCOPE = "enduser";
export const TOOL_SCOPE = "tool";

export interface StateData {
  redirectUri: string | null;
  clientState: string;
  clientId: string | null;
  serverId: string | null;
  scope: string | null;
  providerId: string | null;
  originAddress: string | null;
  userId: string | null;
}

export const encodeData = <T>(data: T) => Buffer.from(JSON.stringify(data)).toString("base64");
export const decodeData = <T>(encoded: string): T => JSON.parse(Buffer.from(encoded, "base64").toString());

const oauthAuthHeader = (provider: OAuthProvider) =>
  "Basic " + Buffer.from(`${provider.clientId}:${provider.clientSecret}`).toString("base64");

export const getHostUrl = (req: Request, useServerHost: boolean): string => {
  if (useServerHost) {
    const protocol = isLocalRun ? req.get("X-Forwarded-Proto") || req.protocol : "https";
    const host = `${protocol}://${req.get("host")}`;
    return host.endsWith("/") ? host.slice(0, -1) : host;
  }
  // we assume when deployed, the host is always the same as the console URL
  return process.env.CONSOLE_URL as string;
};

export const callbackUrl = (req: Request) => `${getHostUrl(req, isLocalRun)}/api/oauth/callback`;

interface TokenExchangeResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number | null;
  scope?: string;
}

export const exchangeCodeForToken = async (
  logger: Logger,
  provider: OAuthProvider,
  code: string,
  callbackUrl: string,
): Promise<TokenExchangeResult> => {
  logger.debug(`Exchanging auth code for token with provider: ${provider.name} (${provider.id})`);
  logger.debug(`Using callback URL: ${callbackUrl}`);

  const tokenRequestData: Record<string, string> = {
    redirect_uri: callbackUrl,
    code,
    grant_type: "authorization_code",
  };

  const refreshUrl = provider.refreshUrl || provider.tokenUrl;
  logger.debug(`Making token request to: ${refreshUrl}`);
  const contentType = provider.contentType || "application/json";
  try {
    const tokenResponse = await axios.post(
      provider.refreshUrl || provider.tokenUrl,
      contentType.includes("form") ? qs.stringify(tokenRequestData) : tokenRequestData,
      {
        headers: {
          "Content-Type": contentType,
          Authorization: oauthAuthHeader(provider),
        },
      },
    );

    logger.debug(
      `Token exchange successful, received access_token: ${tokenResponse.data.access_token ? "✓" : "✗"}, refresh_token: ${tokenResponse.data.refresh_token ? "✓" : "✗"}`,
    );

    return {
      accessToken: tokenResponse.data.access_token,
      refreshToken: tokenResponse.data.refresh_token,
      expiresIn: tokenResponse.data.expires_in || 3600,
      scope: tokenResponse.data.scope,
    };
  } catch (error) {
    const errorMessage =
      axios.isAxiosError(error) && error.response
        ? `${error.response.statusText}: ${error.response.data}`
        : "Failed to grant token";
    logger.warn(
      `Token exchange failed`,
      axios.isAxiosError(error) && error.response ? omit(error, ["request", "response"]) : error,
      {
        refreshUrl,
        contentType,
        ...(axios.isAxiosError(error) && error.response
          ? {
              status: error.response.status,
              data: error.response.data,
            }
          : {}),
      },
    );
    throw new OAuthError(errorMessage, StatusCodes.BAD_REQUEST, "token_grant_failed");
  }
};

export const refreshAndPersistAccessToken = async (
  db: Database,
  logger: Logger,
  userId: string,
  provider: OAuthProvider,
  refreshToken: string,
  originAddress: string | null,
): Promise<ProviderToken> => {
  try {
    const tokenRequestData: Record<string, string> = {
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    };

    const contentType = provider.contentType || "application/json";
    const tokenResponse = await axios.post(
      provider.refreshUrl || provider.tokenUrl,
      contentType.includes("form") ? qs.stringify(tokenRequestData) : tokenRequestData,
      {
        headers: {
          "Content-Type": contentType,
          Authorization: oauthAuthHeader(provider),
        },
      },
    );

    const tokenData = {
      accessToken: tokenResponse.data.access_token,
      expiresIn: tokenResponse.data.expires_in || 3600,
      scope: tokenResponse.data.scope,
      refreshToken: tokenResponse.data.refresh_token || refreshToken,
    } as TokenExchangeResult;

    return await persistToken(db, logger, userId, provider.id, tokenData, originAddress);
  } catch (error) {
    logger.warn(`Token refresh failed`, error, {
      ...(axios.isAxiosError(error) && error.response
        ? {
            status: error.response.status,
            data: error.response.data,
          }
        : {}),
    });
    throw new OAuthError(`Failed to refresh token`, StatusCodes.BAD_REQUEST, "token_refresh_failed");
  }
};

export const persistToken = async (
  db: Database,
  logger: Logger,
  userId: string,
  providerId: string | null,
  token: TokenExchangeResult,
  originAddress: string | null,
  jti: string | null = null,
) => {
  logger.debug(`Persisting token for user ${userId} and provider ${providerId}`);

  if (providerId) {
    await db.providerToken.deleteMany({
      where: {
        providerId,
        userId,
      },
    });
  }

  return await db.providerToken.create({
    data: {
      id: jti || undefined,
      providerId,
      userId,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      scopes: token.scope?.split(" "),
      issuedAt: new Date(),
      expiresAt: token.expiresIn === null ? null : new Date(Date.now() + token.expiresIn * 1000),
      originAddress,
    },
  });
};

export const getAuthorizeUrl = (
  req: Request,
  provider: OAuthProvider,
  clientState: string,
  serverId: string,
  userId: string | null,
  origScope: string,
  originAddress: string | null,
  origRedirectUri: string | null = null,
  origClientId: string | null = null,
  responseType = "code",
): string => {
  const stateData: StateData = {
    redirectUri: origRedirectUri,
    clientState,
    clientId: origClientId,
    serverId,
    scope: origScope,
    providerId: provider.id,
    originAddress,
    userId,
  };
  const stateParam = encodeData(stateData);

  const authUrl = new URL(provider.authorizationUrl);
  authUrl.searchParams.append("client_id", provider.clientId);
  authUrl.searchParams.append("redirect_uri", callbackUrl(req));
  authUrl.searchParams.append("response_type", responseType);
  authUrl.searchParams.append("scope", provider.scopes.join(" "));
  authUrl.searchParams.append("state", stateParam);
  authUrl.searchParams.append("prompt", "consent");

  return authUrl.toString();
};

export const getUserUseableTokens = async (db: Database, userId: string, providerId: string) => {
  return await db.providerToken.findMany({
    where: {
      userId,
      providerId,
      OR: [
        {
          expiresAt: null,
        },
        {
          expiresAt: { gte: new Date() },
        },
        {
          NOT: {
            refreshToken: null,
          },
        },
      ],
    },
    orderBy: {
      expiresAt: "desc",
    },
  });
};

export const markTokenAsUsed = async (db: Database, tokenId: string) =>
  await db.providerToken.update({
    where: {
      id: tokenId,
    },
    data: {
      lastUsedAt: new Date(),
    },
  });
