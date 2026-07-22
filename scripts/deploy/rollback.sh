#!/usr/bin/env bash
set -euo pipefail
PREV_SHA_FILE=${1:-/var/www/bemft/current_sha}
log(){ printf "[%s] %s
" "$(date --iso-8601=seconds)" "$*"; }
if [ -f "$PREV_SHA_FILE" ]; then
  PREV_SHA=$(cat "$PREV_SHA_FILE")
  log "Rolling back to $PREV_SHA"
  git reset --hard "$PREV_SHA" || true
  # rebuild
  npx turbo run build || true
  # restart full stack
  docker compose -f docker-compose.yml up -d --build || true
else
  log "No previous SHA file. Skip rollback"
fi
