import axios from "axios";
import * as crypto from "crypto";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { CacheItemType, clearCacheByPartialKey } from "../services/cache.service.js";
import { createEndUserIfNotExists, getEndUserByEmailAndServerId } from "../services/enduser.service.js";
import { generateEndUserToken, verifyAdminToken } from "../services/jwt.service.js";
import {
  callbackUrl,
  decodeData,
  encodeData,
  ENDUSER_SCOPE,
  exchangeCodeForToken,
  getAuthorizeUrl,
  getHostUrl,
  persistToken,
  StateData,
  TOOL_SCOPE,
} from "../services/oauth.service.js";
import { enduserSharedSecret, SIGNATURE_EXPIRATION_MSEC, signData } from "../services/ownid.secret.service.js";
import { OAuthError } from "../types/error.types.js";
import { isAppRequest, isWithServerIdRequest, TypeGuardError } from "../utils/req-guards.js";
import { EndUserShortSession } from "./ownid.controller.js";

const CONSOLE_URL = process.env.CONSOLE_URL || "http://localhost:4200";
const CONSOLE_AUTH_PATH = "/login";
const CONSOLE_SUCCESS_PATH = "/oauth/success";
const CONSOLE_FAILURE_PATH = "/oauth/callback";

const STUDIO_REDIRECT_ORIGINS = ["agentpass.ai", "agentpass.studio"];
const ALLOWED_REDIRECT_ORIGINS = ["https://claude.ai", "http://localhost", "http://127.0.0.1", "cursor://"];

/**
 > OAuth 2.0 Authorization Code Flow Implementation
 * Discovery: `getOAuthServerInfo`
 * [Optional] dynamic client registration: `dynamicClientRegister`
 * Initiate authorization: `authorize` -> Only applicable to `enduser` flow. Redirects to console app with state describing the request (client_id, redirect_uri, etc.)
 * Console app redirects back to: `handleCallback` which then redirects back to the original redirect uri with the code.
 * * NOTE: in case of "tool" auth, the request isn't redirected from console, but from external provider. The code is exchanged for a token and stored in the database and auth is considered completed.
 * Exchange code for token: `exchangeToken` doesn't actually exchange, as it was done in previous step, so its a no-op.
 */

interface EndUserTokenResponse {
  access_token: string;
  original_redirect_uri: string | null;
  token_type: "Bearer";
}

const isRedirectUriAllowed = (req: Request, uris: string[]) =>
  uris.every(
    (uri: string) =>
      [...ALLOWED_REDIRECT_ORIGINS, getHostUrl(req, true), getHostUrl(req, false)].some((allowed) =>
        uri.toLowerCase().startsWith(allowed.toLowerCase()),
      ) || STUDIO_REDIRECT_ORIGINS.some((url) => new URL(uri).hostname.endsWith(url)),
  );

export const getOAuthServerInfo = async (req: Request, res: Response) => {
  const baseUrl = getHostUrl(req, true);
  const issuer = new URL(baseUrl).origin;

  res.json({
    issuer,
    authorization_endpoint: `${issuer}/api/oauth/authorize`,
    token_endpoint: `${issuer}/api/oauth/token`,
    registration_endpoint: `${issuer}/api/oauth/register`,
    scopes_supported: ["profile", "email", "openid"],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["client_secret_post"],
    code_challenge_methods_supported: ["S256"],
  });
};

export const authorize = async (req: Request, res: Response) => {
  if (!isWithServerIdRequest(req)) {
    throw new TypeGuardError();
  }

  try {
    const { serverId } = req;
    const { redirect_uri, state: clientState, response_type, client_id, provider_id, admin_auth } = req.query;
    req.logger.debug("OAuth authorization request received", {
      serverId,
      redirect_uri,
      clientState,
      response_type,
      client_id,
      provider_id,
      scope: req.query.scope,
    });
    const scope = req.query.scope === TOOL_SCOPE ? TOOL_SCOPE : ENDUSER_SCOPE;

    if (!serverId) {
      req.logger.warn("Server ID not provided in the request");
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Server ID is required" });
    }
    const server = await req.db.mcpServer.findUnique({
      where: {
        id: serverId,
      },
    });
    if (!server) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: `Server '${serverId}' not found` });
    }

    if (!redirect_uri) {
      req.logger.warn("Missing redirect_uri in authorization request");
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "redirect_uri is required" });
    }
    if (!isRedirectUriAllowed(req, [redirect_uri as string])) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "invalid_redirect_uri",
        error_description: "Redirect URI must be one of the allowed origins",
      });
    }

    let userId: string | null = null;
    if (admin_auth) {
      const adminClaims = await verifyAdminToken(admin_auth as string);
      if (!adminClaims) {
        req.logger.warn("Invalid admin token provided");
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Invalid admin token" });
      }
      userId = (await createEndUserIfNotExists(req.db, server.tenantId, adminClaims.email)).id;
    }

    if (provider_id) {
      const provider = await req.db.oAuthProvider.findFirstOrThrow({
        where: {
          id: provider_id as string,
        },
      });

      const authUrl = getAuthorizeUrl(
        req,
        provider,
        (clientState as string) || "",
        serverId!,
        userId,
        scope as string,
        req.ip || null,
        redirect_uri as string,
        client_id as string,
        response_type as string,
      );

      req.logger.debug("Redirecting to OAuth provider", {
        provider: provider.name,
        redirectUri: authUrl.toString(),
        originalRedirectUri: redirect_uri,
        clientId: client_id,
      });

      return res.redirect(authUrl.toString());
    }

    const stateData: StateData = {
      redirectUri: redirect_uri as string,
      clientState: (clientState as string) || "",
      clientId: client_id as string,
      serverId: serverId!,
      scope: scope as string,
      providerId: null,
      originAddress: req.ip || null,
      userId,
    };
    const stateParam = encodeData(stateData);

    const consoleUrl = new URL(`${CONSOLE_URL}${CONSOLE_AUTH_PATH}`);

    consoleUrl.searchParams.append("scope", ENDUSER_SCOPE);
    consoleUrl.searchParams.append("state", stateParam);
    consoleUrl.searchParams.append("redirect_uri", callbackUrl(req));
    consoleUrl.searchParams.append("server_id", serverId || "");
    consoleUrl.searchParams.append("server_name", server.name);

    req.logger.debug("Redirecting to console to choose provider", {
      redirectUri: consoleUrl.toString(),
      originalRedirectUri: redirect_uri,
      clientId: client_id,
    });

    return res.redirect(consoleUrl.toString());
  } catch (error) {
    req.logger.error("Error in OAuth authorize endpoint", error);
    const message = error instanceof OAuthError ? error.message : "Failed to process authorization request";
    return res.redirect(`${CONSOLE_URL}${CONSOLE_FAILURE_PATH}?error=${encodeURIComponent(message)}`);
  }
};

export const handleCallback = async (req: Request, res: Response) => {
  if (!isAppRequest(req)) {
    throw new TypeGuardError();
  }

  try {
    const { code, state, error } = req.query;

    if (error) {
      req.logger.error("OAuth callback received with error", error);
      return res.status(StatusCodes.BAD_REQUEST).json({ error: error });
    }

    if (!code) {
      req.logger.error("OAuth callback received without code");
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "No code received from OAuth provider" });
    }

    if (!state) {
      req.logger.error("OAuth callback received without state");
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "No state received from OAuth provider" });
    }

    let stateData: StateData;
    try {
      stateData = decodeData(state as string);
    } catch (e) {
      req.logger.error("Failed to parse state parameter", e);
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid state parameter" });
    }

    const { redirectUri, clientState, clientId, serverId, scope, providerId } = stateData;

    if (stateData.scope === TOOL_SCOPE && providerId) {
      req.logger.debug("Exchanging code for token with provider for tool scope");
      const provider = await req.db.oAuthProvider.findFirstOrThrow({
        where: {
          id: providerId,
        },
      });
      const tokenData = await exchangeCodeForToken(req.logger, provider, code as string, callbackUrl(req));
      const userId = stateData.userId!;
      await persistToken(req.db, req.logger, userId, providerId, tokenData, stateData.originAddress);
      if (stateData.redirectUri) {
        const redirectUrl = new URL(stateData.redirectUri);
        redirectUrl.searchParams.append("state", stateData.clientState);
        return res.redirect(redirectUrl.toString());
      }
      return res.redirect(`${CONSOLE_URL}${CONSOLE_SUCCESS_PATH}`);
    }

    if (!redirectUri) {
      req.logger.error("State parameter missing redirectUri");
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid state parameter structure" });
    }

    const redirectUrl = new URL(redirectUri);
    redirectUrl.searchParams.append("postAuthRedirectUri", `${CONSOLE_URL}${CONSOLE_SUCCESS_PATH}`);

    if (scope === ENDUSER_SCOPE) {
      const shortSession = decodeData<EndUserShortSession>(code as string);
      const sharedSecret = await enduserSharedSecret();
      if (
        Math.abs(Date.now() - shortSession.timestamp) > SIGNATURE_EXPIRATION_MSEC ||
        signData(sharedSecret, `${shortSession.email}.${shortSession.timestamp}`) !== shortSession.signature
      ) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Invalid or expired short session signature" });
      }

      const jti = crypto.randomUUID();
      const user = await getEndUserByEmailAndServerId(req.db, shortSession.email, stateData.serverId!);
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: "User not found" });
      }
      const token = await generateEndUserToken(user, jti);

      await persistToken(
        req.db,
        req.logger,
        user.id,
        null,
        {
          accessToken: token,
          scope: ENDUSER_SCOPE,
          expiresIn: null,
        },
        stateData.originAddress,
        jti,
      );
      clearCacheByPartialKey(CacheItemType.ENDUSER_TOKEN, user.email);

      const responseData: EndUserTokenResponse = {
        access_token: token,
        original_redirect_uri: stateData.redirectUri,
        token_type: "Bearer",
      };
      const tokenAsCode = encodeData(responseData);
      redirectUrl.searchParams.append("code", tokenAsCode);
    } else {
      if (!serverId) {
        req.logger.error("State parameter missing serverId");
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid state parameter structure" });
      }

      req.logger.debug("OAuth callback received", {
        redirectUri,
        clientState,
        clientId,
        serverId,
        codeReceived: !!code,
      });

      redirectUrl.searchParams.append("code", code as string);
    }

    if (clientState) {
      redirectUrl.searchParams.append("state", clientState as string);
    }

    if (clientId) {
      redirectUrl.searchParams.append("client_id", clientId);
    }

    return res.redirect(redirectUrl.toString());
  } catch (error) {
    req.logger.error("Error in OAuth callback handling", error);
    const message = error instanceof OAuthError ? error.message : "Failed to process OAuth callback";
    return res.redirect(`${CONSOLE_URL}${CONSOLE_FAILURE_PATH}?error=${encodeURIComponent(message)}`);
  }
};

export const exchangeToken = async (req: Request, res: Response) => {
  if (!isAppRequest(req)) {
    throw new TypeGuardError();
  }
  try {
    const { code } = req.body;
    if (!code) {
      throw new OAuthError("Missing code", StatusCodes.BAD_REQUEST, "invalid_request");
    }

    const decodedResponse = decodeData(code as string);
    return res.json(decodedResponse);
  } catch (error) {
    req.logger.error("Error in token exchange", error);
    if (axios.isAxiosError(error) && error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to exchange token" });
  }
};

export const dynamicClientRegister = async (req: Request, res: Response) => {
  if (!isAppRequest(req)) {
    throw new TypeGuardError();
  }
  try {
    req.logger.debug("OAuth client registration request received", {
      body: req.body,
    });

    const {
      client_id,
      client_name = "Dynamically Registered Client",
      redirect_uris = [],
      grant_types = ["authorization_code"],
      response_types = ["code"],
      token_endpoint_auth_method = "none",
      software_id,
    } = req.body;

    if (!redirect_uris.length) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "invalid_redirect_uri",
        error_description: "At least one redirect_uri must be provided",
      });
    }
    if (!isRedirectUriAllowed(req, redirect_uris)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "invalid_redirect_uri",
        error_description: "Redirect URI must be one of the allowed origins",
      });
    }

    const registrationTime = Date.now();
    const clientId = client_id || crypto.randomBytes(16).toString("hex");

    const client = {
      client_id: clientId,
      client_secret: "", // No client secret for public clients
      client_name,
      redirect_uris: Array.isArray(redirect_uris) ? redirect_uris : [redirect_uris],
      grant_types: Array.isArray(grant_types) ? grant_types : [grant_types],
      response_types: Array.isArray(response_types) ? response_types : [response_types],
      token_endpoint_auth_method,
      registration_time: registrationTime,
    };
    const response = {
      ...client,
      client_id_issued_at: Math.floor(registrationTime / 1000),
    };

    req.logger.debug("New OAuth client registered", {
      clientId,
      clientName: client_name,
      softwareId: software_id,
    });

    return res.status(StatusCodes.CREATED).json(response);
  } catch (error) {
    req.logger.error("Error in registration endpoint", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to process registration request" });
  }
};
