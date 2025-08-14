# AgentBridge Backend

A Node.js backend service for managing API servers and authentication.

## Pre-requisites

### 0. AWS CLI
Get access to AWS CLI and generate access key in [IAM > Security credentials](https://us-east-1.console.aws.amazon.com/iam/home?region=us-east-2#/security_credentials?section=IAM_credentials).

Install AWS CLI
```bash
brew install awscli
aws --version
```

Login using your credentials
```bash
aws configure
```

### 1. Create a `.env` file from `.env.local`:

```bash
cp .env.local .env
```

Edit what's necessary in the `.env` file.


## Development 


### Docker Setup

1. Build all containers
```bash
docker compose --profile be build
```

2. Run containers detached
```bash
docker compose --profile be up -d
```

3. Run db migration
```bash
docker compose exec agentbridge-be bash -c "yarn prisma db push"
```

4. Validate schema applied successfuly
```bash
docker compose exec agentbridge-be bash -c "yarn prisma validate"
```

5. Seed initial database
```bash
docker compose exec agentbridge-be bash -c "yarn prisma db seed"
```

### OwnID integration setup

1. install nGrok and create nGrok account
[Manual](https://ngrok.com/docs/getting-started/)

```shell
brew install ngrok

ngrok config add-authtoken $YOUR_TOKEN
```

2. Run ngrok manually
NOTE: mostlikely for free tier --url will be ignored and domain will be generated manually.

```shell
ngrok http --url=???.ngrok-free.app 3333
```

3. Create OwnID account

[https://console.ownid.com/registration](https://console.ownid.com/registration)
after sign up ask someone to approve your user and go to create 2 applications, for Admin and Enduser accordingly.

when asked about URL set these URLs accordingly

```
https://${NGROK_URL}/api/ownid/admin

https://${NGROK_URL}/api/ownid/enduser
```

4. Use OwnID dashboard to aquire Application ID and Shared Secret and fill them in .env file


```shell
OWNID_ADMIN_APP_ID=...
OWNID_ADMIN_ENV=...
OWNID_ADMIN_SHARED_SECRET=...

OWNID_ENDUSER_APP_ID=...
OWNID_ENDUSER_ENV=...
OWNID_ENDUSER_SHARED_SECRET=...
```



## Old Development

### Database Setup

1. Run a PostgreSQL database locally using Docker (or manually to match the .env file):

```bash
docker compose up -d
```

2. Apply pending migrations to the database:

```bash
yarn nx prisma-push @agentbridge/be
```

⚠️ Note ⚠️ If no migrations exist yet, you’ll need to create an initial one:

```bash
yarn nx prisma-migrate @agentbridge/be --name init
```

3. Create schema objects

```bash
yarn nx prisma-generate @agentbridge/be
```

⚠️ Note: If you're experiencing issues with TypeScript related to Prisma object types, try deleting the .prisma folder inside node_modules

4. Seed the database with initial data:

```bash
yarn nx prisma-seed @agentbridge/be
```

### API Linting

To lint the API types and generate type definitions:

```bash
yarn nx generate-api-lint @agentbridge/api
```

### Running Tests

```bash
yarn nx test @agentbridge/be
```

### Building for Production

```bash
yarn nx build @agentbridge/be
```

### Starting Production Server

```bash
yarn nx serve @agentbridge/be
```

### Testing MCP

We are using the [`mcp-remote`](https://github.com/OwnID/mcp-remote) tool to translate MCP to STDIO. It has two modes: client and proxy. Client is more of a sanity check, proxy is the real live STDIO <-> streamable HTTP.

Run

```shell
# for use in your favorite agent:
npx -y "@ownid/mcp-remote@latest" http://localhost:3333/api/mcp

# for sanity check:
npx -y -p "@ownid/mcp-remote@latest" mcp-remote-client http://localhost:3333/api/mcp

# or if you're using a local version of the mcp-remote tool:

cd mcp-remote
pnpm install
pnpm build
npx tsx dist/client.js http://localhost:3333/api/mcp
npx tsx dist/proxy.js http://localhost:3333/api/mcp
```

You can use inspector with the npx commands to test locally:

```shell
npx @modelcontextprotocol/inspector
# then set it to use `STDIO` with `npx` and your arguments. For local js, use full path.
```

### Running BE in Docker

Simply add `--profile be` to your compose commands.

## OwnID Auth

We have two apps, one for admins and one for users.

In deployment envs, the apps are owned by admin@ownid.com

### Local setup

Create two new custom integration apps in your OwnID console of choice. Make sure to setup ngrok to wrap your BE, and set the following URLs for your apps:

```shell
NGROK_URL="???.ngrok-free.app"
ngrok http --url=${NGROK_URL} 3333

https://${NGROK_URL}/api/ownid/admin
https://${NGROK_URL}/api/ownid/enduser
```

Copy the App IDs and shared secrets and set them to env:

```shell
OWNID_ADMIN_APP_ID=...
OWNID_ADMIN_ENV=...
OWNID_ADMIN_SHARED_SECRET=...

OWNID_ENDUSER_APP_ID=...
OWNID_ENDUSER_ENV=...
OWNID_ENDUSER_SHARED_SECRET=...
```

It is also recommended to set the following in console DB:

```sql
UPDATE "Apps"
SET "PreventLoginIdHarvesting" = FALSE,
    "EnableInstantConnect"     = FALSE,
    "IsVerified"               = TRUE
WHERE "Url" LIKE 'xxx%'
   OR "Url" LIKE 'yyy%'
```
