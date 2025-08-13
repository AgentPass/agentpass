const CLI_CALLBACK_ROUTE = "http://localhost:32167/api/oauth/callback";

export const CliCommunicationService = {
  auth(token: string, state: string | null): void {
    window.location.replace(`${CLI_CALLBACK_ROUTE}?token=${token}&state=${state}`);
  },
};
