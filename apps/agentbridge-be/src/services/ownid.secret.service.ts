import * as crypto from "crypto";
import { getAppSecrets } from "./secrets.service.js";

export const SIGNATURE_EXPIRATION_MSEC = 60 * 1000; // 1 minute

export const adminSharedSecret = async () =>
  process.env.OWNID_ADMIN_SHARED_SECRET || (await getAppSecrets()).ownidAdminSharedSecret;
export const enduserSharedSecret = async () =>
  process.env.OWNID_ENDUSER_SHARED_SECRET || (await getAppSecrets()).ownidEnduserSharedSecret;
export const anthropicApiKey = async () => process.env.ANTHROPIC_API_KEY || (await getAppSecrets()).anthropicApiKey;
export const openaiApiKey = async () => process.env.OPENAI_API_KEY || (await getAppSecrets()).openaiApiKey;

export const signData = (sharedSecret: string, data: string) => {
  const hmac = crypto.createHmac("sha256", Buffer.from(sharedSecret, "base64"));
  hmac.update(data);
  return hmac.digest("base64");
};
