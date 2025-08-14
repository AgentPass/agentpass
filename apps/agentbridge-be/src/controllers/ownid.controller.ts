import { OwnIdConfig } from "@agentbridge/api";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { createAdminSession, getAdminOwnIdData, setAdminOwnIdData } from "../services/admins.service.js";
import { createEndUserSession, getEndUserOwnIdData, setEndUserOwnIdData } from "../services/enduser.service.js";
import { encodeData } from "../services/oauth.service.js";
import { enduserSharedSecret, signData } from "../services/ownid.secret.service.js";
import { isAppRequest, TypeGuardError } from "../utils/req-guards.js";

export type EndUserShortSession = {
  email: string;
  signature: string;
  timestamp: number;
};

export const config = (req: Request, res: Response) => {
  const serverId = req.query.server_id as string | null;
  const config: OwnIdConfig = serverId
    ? {
        appId: process.env.OWNID_ENDUSER_APP_ID as string,
        env: process.env.OWNID_ENDUSER_ENV as OwnIdConfig.env,
      }
    : {
        appId: process.env.OWNID_ADMIN_APP_ID as string,
        env: process.env.OWNID_ADMIN_ENV as OwnIdConfig.env,
      };
  res.status(StatusCodes.OK).json(config);
};

const getServerId = (req: Request) => {
  return req.headers["x-ownid-scope"] as string | null;
};

export const setData = async (req: Request, res: Response) => {
  if (!isAppRequest(req)) {
    throw new TypeGuardError();
  }
  const email = req.body.loginId.toLowerCase() as string;
  const ownIdData = req.body.ownIdData as string;
  const serverId = getServerId(req);

  req.logger.debug("Setting ownid data", {
    email: email,
    ownIdData: ownIdData,
    serverId,
  });

  const result = serverId
    ? await setEndUserOwnIdData(req.db, serverId, email, ownIdData)
    : await setAdminOwnIdData(req.db, email, ownIdData);
  if (result.status === "NOT_FOUND") {
    return res.status(StatusCodes.NOT_FOUND).json({ error: result.error });
  }
  return res.sendStatus(StatusCodes.NO_CONTENT);
};

export const getData = async (req: Request, res: Response) => {
  if (!isAppRequest(req)) {
    throw new TypeGuardError();
  }
  const email = req.body.loginId.toLowerCase() as string;
  const serverId = getServerId(req);

  req.logger.debug("Getting ownid data", {
    email,
    serverId,
  });

  const result = serverId
    ? await getEndUserOwnIdData(req.db, serverId, email)
    : await getAdminOwnIdData(req.db, req.logger, email);

  switch (result.status) {
    case "NOT_FOUND":
      return res.status(StatusCodes.NOT_FOUND).json({ error: result.error });
    case "LOCKED":
      return res.status(StatusCodes.LOCKED).json({ error: result.error });
    case "OK":
      return res.status(StatusCodes.OK).json(result.data);
    case "NO_CONTENT":
      return res.status(StatusCodes.NO_CONTENT).send();
    default:
      throw new Error(`Unexpected status: ${result.status}`);
  }
};

const createEndUserSessionSignature = async (email: string) => {
  const sharedSecret = await enduserSharedSecret();
  const timestamp = Date.now();
  const data: EndUserShortSession = {
    timestamp: timestamp,
    email,
    signature: signData(sharedSecret, `${email}.${timestamp}`),
  };
  return encodeData(data);
};

export const createSession = async (req: Request, res: Response) => {
  if (!isAppRequest(req)) {
    throw new TypeGuardError();
  }
  const email = req.body.loginId.toLowerCase() as string;
  const serverId = getServerId(req);

  req.logger.debug("Creating session", {
    email,
    serverId,
  });

  const result = serverId
    ? await createEndUserSession(req.db, serverId, email, () => createEndUserSessionSignature(email))
    : await createAdminSession(req.db, req.logger, email);

  if (result.status === "NOT_FOUND") {
    return res.status(StatusCodes.NOT_FOUND).json({ error: result.error });
  }

  return res.json(result.data);
};
