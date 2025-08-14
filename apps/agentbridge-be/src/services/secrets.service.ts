import {
  GetSecretValueCommand,
  GetSecretValueCommandInput,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
// eslint-disable-next-line no-restricted-imports
import logger from "../logger.js";

const environment = process.env.ENV || "dev";
const secretName = `agentbridge-${environment}-secrets`;

const client = new SecretsManagerClient({
  region: process.env.AWS_SECRETS_REGION || "us-east-2",
});

export interface AppSecrets {
  jwtSecret: string;
  dbEncryptionKey: string;
  datadogApiKey: string;
  datadogAppKey: string;
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  ownidAdminSharedSecret: string;
  ownidEnduserSharedSecret: string;
  anthropicApiKey: string;
  openaiApiKey: string;
}

const appSecrets: Promise<AppSecrets> = (async () => {
  try {
    const input: GetSecretValueCommandInput = {
      SecretId: secretName,
    };

    const command = new GetSecretValueCommand(input);
    const response = await client.send(command);

    if (!response.SecretString) {
      throw new Error(`Secret ${secretName} value is empty`);
    }

    const value = JSON.parse(response.SecretString) as AppSecrets;
    logger.debug(`Successfully loaded secrets from AWS Secrets Manager for environment: ${environment}`);
    return value;
  } catch (error) {
    logger.error(`Failed to retrieve secrets from AWS Secrets Manager`, error);
    process.exit(1);
  }
})();

export async function getAppSecrets(): Promise<AppSecrets> {
  return await appSecrets;
}
