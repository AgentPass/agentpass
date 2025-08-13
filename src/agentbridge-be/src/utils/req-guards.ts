import { Request } from "express";
import { Logger } from "winston";
import { ServerAuthResult } from "../services/interfaces/auth-strategy.interface.js";
import { AdminClaims, EndUserClaims } from "../services/jwt.service.js";
import { Database } from "./connection.js";

interface AppContext {
  logger: Logger;
  db: Database;
}

export type AppRequest = Request &
  AppContext & {
    user?: EndUserClaims;
    admin?: AdminClaims;
    serverId?: string;
    serverAuth?: ServerAuthResult;
  };
export type EndUserRequest = AppRequest & { user: EndUserClaims };
export type AdminRequest = AppRequest & { admin: AdminClaims };
export type WithServerIdRequest = AppRequest & { serverId: string };

export const isAppRequest = (req: Request): req is AppRequest => "logger" in req && "db" in req;

export const isEndUserRequest = (req: Request): req is EndUserRequest => "user" in req;

export const isWithServerIdRequest = (req: Request): req is WithServerIdRequest => "serverId" in req;

export const isEndUserWithServerIdRequest = (req: Request): req is EndUserRequest & WithServerIdRequest =>
  "serverId" in req && "user" in req;

export const isAdminRequest = (req: Request): req is AdminRequest => "admin" in req;

export class TypeGuardError extends Error {
  constructor() {
    super("Type guard failed");
  }
}
