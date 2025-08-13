FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache bash dotnet8-sdk && \
    touch /.gitignore # needed for eslint/compat includeIgnoreFile

COPY package.json yarn.lock ./
COPY apps/agentbridge-be/package.json ./apps/agentbridge-be/
COPY libs/agentbridge-api/package.json ./libs/agentbridge-api/
COPY libs/agentbridge-utils/package.json ./libs/agentbridge-utils/
COPY scripts/remove-fingerprint.sh ./scripts/remove-fingerprint.sh

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn nx build @agentbridge/be -c production

FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache bash curl vim && \
    yarn add @datadog/native-metrics @datadog/pprof prisma

COPY apps/agentbridge-be/scripts/*.sh ./scripts/
COPY --from=builder /app/node_modules/.prisma/client node_modules/.prisma/client
COPY --from=builder /app/dist/apps/agentbridge-be .
COPY --from=builder /app/apps/agentbridge-be/prisma ./prisma

ARG BUILD_VERSION
ARG DD_GIT_REPOSITORY_URL
ARG DD_GIT_COMMIT_SHA

ENV DD_VERSION=$BUILD_VERSION
ENV DD_SERVICE=agentbridge-be
ENV DD_GIT_REPOSITORY_URL=${DD_GIT_REPOSITORY_URL}
ENV DD_GIT_COMMIT_SHA=${DD_GIT_COMMIT_SHA}
ENV DD_LOGS_INJECTION=true

ENV NO_UPDATE_NOTIFIER=true
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

ENTRYPOINT [ "node", "main.cjs" ]
