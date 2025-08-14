import * as crypto from "crypto";
const encoder = new TextEncoder();

export function hashForLogging(str: string): Promise<string> {
  const data = encoder.encode(str);
  return crypto.subtle.digest("SHA-256", data).then((hashBuffer) => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const base64 = Buffer.from(hashArray).toString("base64");
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  });
}
