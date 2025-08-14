import {
  decryptStringSync,
  encryptStringSync,
  findKeyForMessage,
  makeKeychainSync,
  parseCloakedString,
  parseKeySync,
} from "@47ng/cloak";
import { getAppSecrets } from "../src/services/secrets-service.js";

function encrypt(encryptionKey: string, value: string): string {
  const parsedKey = parseKeySync(encryptionKey);
  return encryptStringSync(value, parsedKey);
}

function decrypt(encryptionKey: string, value: string): string {
  const keychain = makeKeychainSync([encryptionKey]);

  if (!parseCloakedString(value)) {
    throw new Error("Invalid encrypted value format");
  }
  const key = findKeyForMessage(value, keychain);
  return decryptStringSync(value, key);
}

const [, , mode, input] = process.argv;

if (!mode || !input || !["encrypt", "decrypt"].includes(mode)) {
  console.error("Usage: ts-node crypto-cli.ts <encrypt|decrypt> <value>");
  process.exit(1);
}

(async () => {
  const secrets = await getAppSecrets();
  const key = secrets.dbEncryptionKey;
  const result = mode === "encrypt" ? encrypt(key, input) : decrypt(key, input);
  console.log("\nValue:\n-----------------");
  console.log(result);
  console.log("-----------------");
})().catch((err) => {
  console.error(`Error during ${mode}:`, err.message);
  process.exit(1);
});
