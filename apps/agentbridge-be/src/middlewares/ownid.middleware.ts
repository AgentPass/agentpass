import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  adminSharedSecret,
  enduserSharedSecret,
  SIGNATURE_EXPIRATION_MSEC,
  signData,
} from "../services/ownid.secret.service.js";

const ownidMiddleware = (req: Request, res: Response, next: NextFunction, sharedSecret: string) => {
  const body = JSON.stringify(req.body);
  const ownIdSignature = req.headers["ownid-signature"] as string;
  const ownIdTimestamp = req.headers["ownid-timestamp"] as string;
  if (!ownIdSignature || !ownIdTimestamp) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: "Missing OwnID signature or timestamp" });
    return;
  }
  const dataToSign = `${body}.${ownIdTimestamp}`;

  const currentTime = Date.now();

  const ownIdTimestampMs = parseInt(ownIdTimestamp);

  if (Math.abs(currentTime - ownIdTimestampMs) > SIGNATURE_EXPIRATION_MSEC) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: "Signature has expired" });
    return;
  }

  const actualSignature = signData(sharedSecret, dataToSign);
  if (actualSignature !== ownIdSignature) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid signature" });
    return;
  }

  next();
};

export const ownidAdminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const sharedSecret = await adminSharedSecret();
  return ownidMiddleware(req, res, next, sharedSecret);
};

export const ownidEndUserMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const sharedSecret = await enduserSharedSecret();
  return ownidMiddleware(req, res, next, sharedSecret);
};
