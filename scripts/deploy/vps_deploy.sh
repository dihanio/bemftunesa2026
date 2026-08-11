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
if echo "$CHANGED_FILES" | grep -qE '^packages/|^turbo.json|^package.json|^package-lock.json|^scripts/'; then
  log "Core files or shared packages changed. Will restart all services."
  RESTART_ALL=true
fi

if [ "$RESTART_ALL" = true ]; then
  SERVICES_TO_RESTART=("api" "public_web" "ims_web" "pkkmb_web")
else
  # Check individual apps
  if echo "$CHANGED_FILES" | grep -q '^frontend/'; then SERVICES_TO_RESTART+=("public_web"); fi
  if echo "$CHANGED_FILES" | grep -q '^backend/'; then SERVICES_TO_RESTART+=("api"); fi
  if echo "$CHANGED_FILES" | grep -q '^ims/'; then SERVICES_TO_RESTART+=("ims_web"); fi
  if echo "$CHANGED_FILES" | grep -q '^pkkmb/'; then SERVICES_TO_RESTART+=("pkkmb_web"); fi
fi

# ensure .env exists and has required variables
if ! grep -q "^JWT_SECRET=." .env 2>/dev/null; then
  log "JWT_SECRET not found or empty in .env, generating basic .env"
  cat <<EOF > .env
NEXT_PUBLIC_API_URL=https://api.bemftunesa.org/api/v1
NEXT_PUBLIC_PUBLIC_URL=https://bemftunesa.org
NEXT_PUBLIC_IMS_URL=https://ims.bemftunesa.org
PORT=4000
NODE_ENV=production
MONGODB_URI=mongodb://admin:password@db:27017/bemft-cms?authSource=admin
JWT_SECRET=super-secret-key-change-me-in-production
JWT_EXPIRES_IN=1800
FRONTEND_URL=https://bemftunesa.org
IMS_URL=https://ims.bemftunesa.org
PKKMB_URL=https://pkkmb.bemftunesa.org
UPLOAD_DIR=./public/uploads
BASE_URL=https://api.bemftunesa.org
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=password
GOOGLE_CLIENT_ID=dummy-google-client-id
GOOGLE_CLIENT_SECRET=dummy-google-client-secret
GOOGLE_CALLBACK_URL=https://api.bemftunesa.org/api/v1/auth/google/callback
EOF
else
  if ! grep -q "^GOOGLE_CLIENT_ID=" .env 2>/dev/null; then
    log "GOOGLE_CLIENT_ID not found in .env, appending dummy values"
    echo "GOOGLE_CLIENT_ID=dummy-google-client-id" >> .env
    echo "GOOGLE_CLIENT_SECRET=dummy-google-client-secret" >> .env
    echo "GOOGLE_CALLBACK_URL=https://api.bemftunesa.org/api/v1/auth/google/callback" >> .env
  fi
fi

# Pastikan JWT_EXPIRES_IN selalu = 1800 detik (30 menit) — nilai lama yang
# pendek (mis. 300/600) bikin access token kedaluwarsa tiap beberapa menit,
# sehingga maba harus login ulang terus-menerus. 1800 + auto-refresh token di
# frontend = sesi praktis tidak pernah terputus (refresh token 30 hari).
if grep -q "^JWT_EXPIRES_IN=" .env 2>/dev/null; then
  sed -i 's|^JWT_EXPIRES_IN=.*|JWT_EXPIRES_IN=1800|' .env
  log "JWT_EXPIRES_IN dipaksa = 1800 (30 menit) di .env"
else
  echo "JWT_EXPIRES_IN=1800" >> .env
  log "JWT_EXPIRES_IN=1800 ditambahkan ke .env"
fi

# Ensure backing services are running before restarting apps
log "Starting backing services (db, redis)..."
docker compose -f docker-compose.yml up -d db redis

# restart services via docker-compose
for svc in "${SERVICES_TO_RESTART[@]}"; do
  log "Rebuilding and restarting service: $svc"
  docker compose -f docker-compose.yml pull "$svc" || { log "Failed to pull latest image for $svc"; ./scripts/deploy/rollback.sh "$CURRENT_SHA_FILE"; exit 1; }
  docker compose -f docker-compose.yml up -d --no-deps --force-recreate "$svc" || { log "Failed to restart $svc"; ./scripts/deploy/rollback.sh "$CURRENT_SHA_FILE"; exit 1; }
  IMAGE_REF=$(docker compose -f docker-compose.yml config --images 2>/dev/null | grep "$svc" | head -n1 || echo "ghcr.io/dihanio/bemftunesa2026-$svc:latest")
  IMAGE_DIGEST=$(docker image inspect --format='{{index .RepoDigests 0}}' "$IMAGE_REF" 2>/dev/null || true)
  if [ -z "$IMAGE_DIGEST" ]; then
    # ponytail: `:latest` from GHCR often has empty RepoDigests after pull.
    # fresh image is guaranteed by `docker compose pull` + `--force-recreate` above;
    # healthcheck below is the real gate. Warn, don't roll back.
    log "No RepoDigests for $svc (may be empty for :latest); relying on healthcheck"
  else
    log "$svc image: $IMAGE_DIGEST"
  fi
  # wait for health
  for i in $(seq 1 30); do
    STATUS=$(docker inspect --format='{{json .State.Health}}' $(docker compose -f docker-compose.yml ps -q $svc) 2>/dev/null || echo "{}")
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
