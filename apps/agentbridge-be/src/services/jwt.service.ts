import { Admin, AdminRole, EndUser } from "@prisma/client";
import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import { AdminVerificationPayload } from "../types/admin.types.js";
import { getAppSecrets } from "./secrets.service.js";

const JWT_SECRET: Promise<Secret> = (async () => (await getAppSecrets()).jwtSecret)();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2d";
const VERIFICATION_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "14d";

export interface AdminClaims extends JwtPayload {
  id: string;
  email: string;
  tenantId: string;
  name: string | null;
  admin: true;
  picture: string | null;
  role: AdminRole;
}

export interface EndUserClaims extends JwtPayload {
  id: string;
  email: string;
  tenantId: string;
  endUser: true;
}

export const generateAdminToken = async (admin: Admin): Promise<string> => {
  const payload: AdminClaims = {
    id: admin.id,
    email: admin.email,
    tenantId: admin.tenantId,
    picture: admin.picture,
    name: admin.name,
    admin: true,
    role: admin.role,
  };

  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
    subject: admin.email,
  };

  return jwt.sign(payload, await JWT_SECRET, options);
};

export const generateEndUserToken = async (user: EndUser, jti: string): Promise<string> => {
  const payload: EndUserClaims = {
    id: user.id,
    email: user.email,
    tenantId: user.tenantId,
    endUser: true,
    jti,
  };

  const options: SignOptions = {
    subject: user.email,
  };

  return jwt.sign(payload, await JWT_SECRET, options);
};

export const verifyAdminToken = async (token: string): Promise<AdminClaims | null> => {
  try {
    const decoded = jwt.verify(token, await JWT_SECRET) as AdminClaims;
    if (!decoded.admin) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
};

export const verifyEndUserToken = async (token: string): Promise<EndUserClaims | null> => {
  try {
    const decoded = jwt.verify(token, await JWT_SECRET, { ignoreExpiration: true }) as EndUserClaims;
    if (!decoded.endUser) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
};

export async function generateAdminVerificationToken(id: string): Promise<string> {
  const payload: AdminVerificationPayload = {
    id,
    action: "verify",
  };

  const options: SignOptions = {
    expiresIn: VERIFICATION_TOKEN_EXPIRES_IN as SignOptions["expiresIn"],
    audience: id,
  };

  return jwt.sign(payload, await JWT_SECRET, options);
}

export async function verifyAdminVerificationToken(token: string): Promise<{ id: string } | null> {
  try {
    const decoded = jwt.verify(token, await JWT_SECRET) as AdminVerificationPayload;
    if (decoded.action !== "verify") {
      return null;
    }
    return { id: decoded.id };
  } catch {
    return null;
  }
}
