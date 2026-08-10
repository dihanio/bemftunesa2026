#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# backup.sh — Backup otomatis MongoDB (bemft-cms) + uploads untuk deployment
# docker-compose (VPS). Aman dijalankan via cron.
#
# Fitur:
#   1. mongodump (gzip archive) via `docker compose exec db`
#   2. Backup folder uploads (volume uploads_data) via container alpine
#   3. Retensi otomatis: hapus backup lebih tua dari BACKUP_RETENTION_DAYS
#   4. Opsional: copy ke remote (rclone) jika BACKUP_RCLONE_REMOTE di-set
#
# Konfigurasi via env (default aman tercantum di bawah). Bisa di-set di
# environment, file scripts/backup/backup.env, atau root .env.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# cron punya PATH minimal (/usr/bin:/bin) — pastikan docker & rclone ditemukan
# (rclone via installer sering di /usr/local/bin).
export PATH="$PATH:/usr/local/bin"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ── Konfigurasi (bisa di-override via env) ────────────────────────────────
: "${BACKUP_DIR:=/var/backups/bemft-unesa}"
: "${BACKUP_RETENTION_DAYS:=14}"
: "${MONGO_CONTAINER_SERVICE:=db}"
: "${MONGO_DB:=bemft-cms}"
# Credential dibaca dari root .env (MONGO_ROOT_USER/PASSWORD) — sama seperti
# docker-compose.yml. Hanya dua variabel ini yang diekstrak (jangan source
# seluruh .env — nilainya bisa berisi spasi/karakter khusus yang memecah bash).
if [ -z "${MONGO_ROOT_USER:-}" ] || [ -z "${MONGO_ROOT_PASSWORD:-}" ]; then
  if [ -f "$PROJECT_ROOT/.env" ]; then
    MONGO_ROOT_USER="${MONGO_ROOT_USER:-$(grep '^MONGO_ROOT_USER=' "$PROJECT_ROOT/.env" 2>/dev/null | head -1 | cut -d= -f2-)}"
    MONGO_ROOT_PASSWORD="${MONGO_ROOT_PASSWORD:-$(grep '^MONGO_ROOT_PASSWORD=' "$PROJECT_ROOT/.env" 2>/dev/null | head -1 | cut -d= -f2-)}"
  fi
fi
MONGO_ROOT_USER="${MONGO_ROOT_USER:-admin}"
MONGO_ROOT_PASSWORD="${MONGO_ROOT_PASSWORD:-password}"
# Di dalam container `db`, localhost = mongo itu sendiri.
MONGO_URI="mongodb://${MONGO_ROOT_USER}:${MONGO_ROOT_PASSWORD}@localhost:27017/${MONGO_DB}?authSource=admin"

# Opsional: remote rclone (contoh: "backup-s3:bemft-unesa") — jika kosong, skip.
BACKUP_RCLONE_REMOTE="${BACKUP_RCLONE_REMOTE:-}"

# ── Util ───────────────────────────────────────────────────────────────────
TS="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="${BACKUP_DIR}/backup.log"
mkdir -p "$BACKUP_DIR"
if [ ! -w "$BACKUP_DIR" ]; then
  echo "ERROR: ${BACKUP_DIR} tidak writable (coba sudo atau set BACKUP_DIR)." >&2
  exit 1
fi

# Cegah dua backup berjalan bersamaan (dump bisa lebih lama dari interval cron).
if command -v flock >/dev/null 2>&1; then
  exec 9>"$BACKUP_DIR/.lock"
  if ! flock -n 9; then
    echo "[$(date '+%F %T %Z')] Backup sedang berjalan — lewati." | tee -a "$LOG_FILE"
    exit 0
  fi
fi

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S %Z')] $*" | tee -a "$LOG_FILE"; }
fail() { log "ERROR: $*"; exit 1; }

# Pastikan berada di direktori project (untuk `docker compose`).
cd "$PROJECT_ROOT"

compose_up() {
  docker compose ps --services 2>/dev/null | grep -qx "$MONGO_CONTAINER_SERVICE"
}

# ── 1. Backup MongoDB ──────────────────────────────────────────────────────
backup_mongo() {
  local out="${BACKUP_DIR}/mongodb-${TS}.gz"
  log "MongoDB dump → ${out}"
  if ! compose_up; then
    fail "Service compose '${MONGO_CONTAINER_SERVICE}' tidak berjalan. Jalankan docker compose up -d db dulu."
  fi
  # --archive --gzip → stream biner langsung ke file di host (tanpa tmp di container)
  if ! docker compose exec -T "$MONGO_CONTAINER_SERVICE" \
      mongodump --uri="$MONGO_URI" --archive --gzip --db "$MONGO_DB" > "$out" 2>>"$LOG_FILE"; then
    rm -f "$out"
    fail "mongodump gagal — lihat $LOG_FILE"
  fi
  # Validasi: file harus non-kosong & berawalan gzip magic.
  [ -s "$out" ] || { rm -f "$out"; fail "mongodump menghasilkan file kosong"; }
  if [ "$(head -c 2 "$out" | od -An -tx1 | tr -d ' \n')" != "1f8b" ]; then
    rm -f "$out"
    fail "Output mongodump bukan gzip (bukan archive biner?) — periksa $LOG_FILE"
  fi
  log "  OK: $(du -h "$out" | cut -f1) ($(ls -la "$out" | awk '{print $5}') bytes)"
}

# ── 2. Backup uploads (volume) ─────────────────────────────────────────────
backup_uploads() {
  local vol uploads_dir out
  uploads_dir="/app/backend/public/uploads"
  # Nama volume docker untuk service api: <project>_uploads_data
  vol="$(docker volume ls --format '{{.Name}}' | grep "uploads_data$" | head -1 || true)"
  if [ -z "$vol" ]; then
    log "  WARN: volume uploads_data tidak ditemukan — lewati backup uploads"
    return 0
  fi
  out="${BACKUP_DIR}/uploads-${TS}.tar.gz"
  log "Uploads dump (${vol}) → ${out}"
  if ! docker run --rm \
      -v "$vol:/data:ro" \
      -v "$BACKUP_DIR:/backup" \
      alpine:3 tar czf "/backup/$(basename "$out")" -C /data . 2>>"$LOG_FILE"; then
    rm -f "$out"
    fail "Backup uploads gagal — lihat $LOG_FILE"
  fi
  log "  OK: $(du -h "$out" | cut -f1) ($(ls -la "$out" | awk '{print $5}') bytes)"
}

# ── 3. Retensi ─────────────────────────────────────────────────────────────
cleanup_old() {
  local before after
  before="$(find "$BACKUP_DIR" -maxdepth 1 \( -name 'mongodb-*.gz' -o -name 'uploads-*.tar.gz' \) | wc -l)"
  # Hapus file backup (bukan log) yang lebih tua dari RETENTION_DAYS.
  find "$BACKUP_DIR" -maxdepth 1 -type f \
    \( -name 'mongodb-*.gz' -o -name 'uploads-*.tar.gz' \) \
    -mtime +"$BACKUP_RETENTION_DAYS" -delete 2>/dev/null || true
  after="$(find "$BACKUP_DIR" -maxdepth 1 \( -name 'mongodb-*.gz' -o -name 'uploads-*.tar.gz' \) | wc -l)"
  log "Retensi (> ${BACKUP_RETENTION_DAYS} hari): ${before} → ${after} file"
}

# ── 4. Opsional: remote (rclone) ───────────────────────────────────────────
push_remote() {
  [ -n "$BACKUP_RCLONE_REMOTE" ] || return 0
  if ! command -v rclone >/dev/null 2>&1; then
    log "  WARN: BACKUP_RCLONE_REMOTE diset tapi rclone tidak terpasang — lewati"
    return 0
  fi
  log "Push ke remote rclone: ${BACKUP_RCLONE_REMOTE}"
  if ! rclone copy "$BACKUP_DIR"/mongodb-"$TS".gz "$BACKUP_DIR"/uploads-"$TS".tar.gz \
      "$BACKUP_RCLONE_REMOTE/$(date +%Y%m%d)/" >>"$LOG_FILE" 2>&1; then
    log "  WARN: rclone copy gagal (backup lokal tetap tersimpan)"
  else
    log "  OK: terkirim ke remote"
    # Retensi remote juga (hapus file remote lebih tua dari N hari) — kalau
    # tidak, remote menumpuk tanpa batas.
    if ! rclone delete --min-age "${BACKUP_RETENTION_DAYS}d" \
        "$BACKUP_RCLONE_REMOTE" >>"$LOG_FILE" 2>&1; then
      log "  WARN: retensi remote gagal"
    fi
  fi
}

# ── Main ───────────────────────────────────────────────────────────────────
log "═══ Backup dimulai ═══"
backup_mongo
backup_uploads
cleanup_old
push_remote
log "═══ Backup selesai OK (${TS}) ═══"
