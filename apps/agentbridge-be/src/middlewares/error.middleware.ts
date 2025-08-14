import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { isAppRequest } from "../utils/req-guards.js";

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (isAppRequest(req)) {
    req.logger.error("Error", err);
  }
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    error: err.message,
  });
};
