#!/usr/bin/env bash
set -euo pipefail
PREV_SHA_FILE=${1:-/var/www/bemft/current_sha}
log(){ printf "[%s] %s
" "$(date --iso-8601=seconds)" "$*"; }
if [ -f "$PREV_SHA_FILE" ]; then
  PREV_SHA=$(cat "$PREV_SHA_FILE")
  log "Rolling back to $PREV_SHA"
  git reset --hard "$PREV_SHA" || true
  # We cannot rebuild on the VPS to prevent OOM
  # Just try to bring up the existing containers if any were stopped
  docker compose -f docker-compose.yml up -d || true
else
  log "No previous SHA file. Skip rollback"
fi
