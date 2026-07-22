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

# ensure cache dir
CACHE_DIR="$DEPLOY_PATH/cache"
mkdir -p "$CACHE_DIR/.turbo"

# determine turbo since
TURBO_SINCE=""

log "Installing dependencies..."
npm ci || npm install

if [ -n "$PREV_SHA" ]; then
  TURBO_SINCE="$PREV_SHA"
fi

log "Running incremental build with turbo since: ${TURBO_SINCE:-full}"
if [ -n "$TURBO_SINCE" ]; then
  npx turbo run build --cache-dir="$CACHE_DIR/.turbo" --filter="...[$TURBO_SINCE]" --dry-run=json > build-plan.json
  npx turbo run build --cache-dir="$CACHE_DIR/.turbo" --filter="...[$TURBO_SINCE]" | tee build-output.log
  BUILD_EXIT=${PIPESTATUS[0]}
else
  npx turbo run build --cache-dir="$CACHE_DIR/.turbo" --dry-run=json > build-plan.json
  npx turbo run build --cache-dir="$CACHE_DIR/.turbo" | tee build-output.log
  BUILD_EXIT=${PIPESTATUS[0]}
fi

if [ "$BUILD_EXIT" -ne 0 ]; then
  log "Build failed, starting rollback"
  ./scripts/deploy/rollback.sh "$CURRENT_SHA_FILE"
  exit 1
fi

# parse changed packages from turbo dry-run json output
CHANGED_PKGS=$(jq -r '.tasks[].package' build-plan.json 2>/dev/null | sort -u | sed 's/^@bemft\///' || true)

if [ -z "$CHANGED_PKGS" ]; then
  # fallback to git diff if turbo json was empty or failed
  if [ -n "$PREV_SHA" ]; then
    CHANGED_FILES=$(git diff --name-only $PREV_SHA $TARGET_SHA)
  else
    CHANGED_FILES=$(git ls-tree -r --name-only HEAD)
  fi
  CHANGED_PKGS=$(printf "%s\n" "$CHANGED_FILES" | awk -F/ '{print $1}' | sort -u)
fi

log "Changed packages:
$CHANGED_PKGS"

# map packages to services - simple rule: package folder names map to docker compose service names
SERVICES_TO_RESTART=()
for pkg in $CHANGED_PKGS; do
  case "$pkg" in
    frontend|backend|ims|pkkmb)
      SERVICES_TO_RESTART+=("$pkg")
      ;;
    *)
      # ignore
      ;;
  esac
done

if [ ${#SERVICES_TO_RESTART[@]} -eq 0 ]; then
  log "No services changed. Exiting."
  echo "$TARGET_SHA" > "$CURRENT_SHA_FILE"
  exit 0
fi

log "Services to restart: ${SERVICES_TO_RESTART[*]}"

# ensure .env exists to prevent docker compose env_file error
touch .env

# restart services via docker-compose
for svc in "${SERVICES_TO_RESTART[@]}"; do
  log "Rebuilding and restarting service: $svc"
  docker compose -f docker-compose.yml up -d --no-deps --build $svc || { log "Failed to restart $svc"; ./scripts/deploy/rollback.sh "$CURRENT_SHA_FILE"; exit 1; }
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
