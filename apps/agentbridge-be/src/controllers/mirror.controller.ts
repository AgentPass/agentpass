import axios from "axios";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { URL } from "url";
import { isAppRequest, TypeGuardError } from "../utils/req-guards.js";
export async function mirrorRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!isAppRequest(req)) {
    throw new TypeGuardError();
  }
  try {
    const url = req.query.url as string;
    if (!url) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid URL provided", url });
      return;
    }
    try {
      new URL(url);
    } catch {
      res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid URL provided", url });
      return;
    }

    const response = await axios.get(url, {
      headers: {
        Accept: "application/yaml,application/json",
      },
    });

    // Set the same content type as the original response
    res.set("Content-Type", response.headers["content-type"] || "application/yaml");
    res.status(200).send(response.data);
  } catch (error) {
    req.logger.debug(error);
    next(error);
  }
}
