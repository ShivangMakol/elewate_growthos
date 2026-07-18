#!/usr/bin/env bash
# Full reset: stops the compose stack AND deletes its volumes (Postgres data,
# Redis AOF file, MinIO buckets). Confirms before doing anything destructive.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "This will stop the compose stack and DELETE all local data volumes"
echo "(Postgres database, Redis data, MinIO buckets). This cannot be undone."
read -r -p "Continue? [y/N] " confirm
case "$confirm" in
  [yY]|[yY][eE][sS]) ;;
  *)
    echo "Aborted — nothing was changed."
    exit 0
    ;;
esac

docker compose down -v
echo "Stack stopped and volumes removed."
