#!/usr/bin/env bash
# One-command local dev environment setup:
#   1. Creates .env from .env.example if it doesn't exist yet.
#   2. Builds the core-api image and starts the full compose stack.
#   3. Waits for every service to report healthy.
#   4. Prints where everything is reachable.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [ ! -f .env ]; then
  echo "No .env found — creating one from .env.example."
  cp .env.example .env
else
  echo ".env already exists — leaving it as-is."
fi

echo ""
echo "Building core-api image and starting the compose stack..."
docker compose up -d --build

echo ""
bash scripts/wait-for-services.sh

echo ""
echo "Environment is up:"
echo "  core-api REST   -> http://localhost:${CORE_API_PORT:-4000}/health"
echo "  core-api GraphQL -> http://localhost:${CORE_API_PORT:-4000}/graphiql"
echo "  PostgreSQL       -> localhost:${POSTGRES_PORT:-5432}"
echo "  Redis            -> localhost:${REDIS_PORT:-6379}"
echo "  MinIO API        -> http://localhost:${MINIO_API_PORT:-9000}"
echo "  MinIO Console     -> http://localhost:${MINIO_CONSOLE_PORT:-9001}"
echo "  Mailpit UI        -> http://localhost:${MAILPIT_UI_PORT:-8025}"
echo ""
echo "Run 'pnpm run docker:logs' to follow logs, or 'pnpm run docker:down' to stop everything."
