#!/usr/bin/env bash
set -euo pipefail
svc=$1
log(){ printf "[%s] %s
" "$(date --iso-8601=seconds)" "$*"; }
log "Restarting $svc"
docker compose -f docker-compose.yml up -d --no-deps --build $svc
