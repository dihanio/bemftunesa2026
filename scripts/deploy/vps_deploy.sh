#!/usr/bin/env bash
set -euo pipefail

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"


REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
DEPLOY_PATH="${DEPLOY_PATH:-$REPO_DIR}"
LOG_DIR="$DEPLOY_PATH/deploy-logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/deploy-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

log(){ printf "[%s] %s
" "$(date --iso-8601=seconds)" "$*"; }

TARGET_SHA=${1:-$(git rev-parse --short HEAD)}

log "Starting deploy for $TARGET_SHA"

# save current sha
CURRENT_SHA_FILE="$DEPLOY_PATH/current_sha"
PREV_SHA=""
if [ -f "$CURRENT_SHA_FILE" ]; then
  PREV_SHA=$(cat "$CURRENT_SHA_FILE")
fi
if [ -z "$PREV_SHA" ]; then
  PREV_SHA=$(git rev-parse --short HEAD~1 || echo "")
fi
log "Previous SHA: $PREV_SHA"

# fetch and checkout
if [ -d .git ]; then
  git fetch --all --prune
  git checkout --force "$TARGET_SHA"
  git reset --hard "$TARGET_SHA"
else
  git clone --depth 1 https://github.com/$(git config --get remote.origin.url | sed -e 's#.*github.com[:/]##') . || true
  git fetch --all || true
  git checkout --force "$TARGET_SHA" || true
  git reset --hard "$TARGET_SHA" || true
fi

# Lightweight change detection without using Node/npm on the VPS
if [ -z "$PREV_SHA" ]; then
  # If no previous SHA, restart all services
  CHANGED_FILES=$(git ls-tree -r --name-only HEAD)
else
  CHANGED_FILES=$(git diff --name-only $PREV_SHA $TARGET_SHA)
fi

log "Changed files detected."

SERVICES_TO_RESTART=()
RESTART_ALL=false

# Check if any core/shared packages changed
if echo "$CHANGED_FILES" | grep -qE '^packages/|^turbo.json|^package.json|^package-lock.json'; then
  log "Core files or shared packages changed. Will restart all services."
  RESTART_ALL=true
fi

if [ "$RESTART_ALL" = true ]; then
  SERVICES_TO_RESTART=("frontend" "backend" "ims" "pkkmb")
else
  # Check individual apps
  if echo "$CHANGED_FILES" | grep -q '^apps/fe/'; then SERVICES_TO_RESTART+=("frontend"); fi
  if echo "$CHANGED_FILES" | grep -q '^apps/be/'; then SERVICES_TO_RESTART+=("backend"); fi
  if echo "$CHANGED_FILES" | grep -q '^apps/ims/'; then SERVICES_TO_RESTART+=("ims"); fi
  if echo "$CHANGED_FILES" | grep -q '^apps/pkkmb/'; then SERVICES_TO_RESTART+=("pkkmb"); fi
fi

# ensure .env exists to prevent docker compose env_file error
touch .env

# restart services via docker-compose
for svc in "${SERVICES_TO_RESTART[@]}"; do
  log "Rebuilding and restarting service: $svc"
  docker compose pull $svc || log "Failed to pull latest image for $svc"
  docker compose -f docker-compose.yml up -d --no-deps $svc || { log "Failed to restart $svc"; ./scripts/deploy/rollback.sh "$CURRENT_SHA_FILE"; exit 1; }
  # wait for health
  for i in $(seq 1 30); do
    STATUS=$(docker inspect --format='{{json .State.Health}}' $(docker compose ps -q $svc) 2>/dev/null || echo "{}")
    if echo "$STATUS" | grep -q '"Status":"healthy"'; then
      log "$svc healthy"
      break
    fi
    sleep 2
  done
done

# success
echo "$TARGET_SHA" > "$CURRENT_SHA_FILE"
log "Deploy successful for $TARGET_SHA"
exit 0
