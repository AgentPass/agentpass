#!/bin/bash

set -e

# Run this script from the root src

echo "Generating client api"

TARGET_PATH="libs/agentbridge-api/src"
rm -rf "$TARGET_PATH"
yarn openapi -i "api/agentbridge.openapi.yaml" -o "$TARGET_PATH" -c fetch --useOptions

echo "Formatting client api"

yarn nx format

echo "Done"
