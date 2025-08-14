import { NextFunction, Request, Response } from "express";
import prisma, { Database } from "../utils/connection.js";

export const dbMiddleware = async (
  req: Request & { db?: Database },
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  req.db = await prisma;
  next();
};
