#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# restore.sh — Restore MongoDB (bemft-cms) & uploads dari hasil backup.sh.
#
# Peringatan: proses ini MENIMPA data yang ada (mongorestore --drop) dan
# uploads lama dihapus. Jalankan hanya jika yakin.
#
# Usage:
#   ./restore.sh <file-mongodb-YYYYMMDD-HHMMSS.gz> [file-uploads-YYYYMMDD-HHMMSS.tar.gz]
#   # Jika hanya ingin restore DB (tanpa uploads), berikan argumen pertama saja.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

MONGO_BACKUP="${1:-}"
UPLOADS_BACKUP="${2:-}"
[ -n "$MONGO_BACKUP" ] || { echo "Usage: $0 <mongodb-*.gz> [uploads-*.tar.gz]"; exit 1; }
[ -f "$MONGO_BACKUP" ] || { echo "File tidak ditemukan: $MONGO_BACKUP"; exit 1; }
MONGO_BACKUP="$(realpath "$MONGO_BACKUP")"
[ -z "$UPLOADS_BACKUP" ] || UPLOADS_BACKUP="$(realpath "$UPLOADS_BACKUP")"

# Konfigurasi (sama seperti backup.sh)
MONGO_ROOT_USER="${MONGO_ROOT_USER:-}"
MONGO_ROOT_PASSWORD="${MONGO_ROOT_PASSWORD:-}"
if [ -z "$MONGO_ROOT_USER" ] || [ -z "$MONGO_ROOT_PASSWORD" ]; then
  if [ -f "$PROJECT_ROOT/.env" ]; then
    # shellcheck disable=SC1090
    set -a; . "$PROJECT_ROOT/.env" 2>/dev/null || true; set +a
  fi
fi
MONGO_ROOT_USER="${MONGO_ROOT_USER:-admin}"
MONGO_ROOT_PASSWORD="${MONGO_ROOT_PASSWORD:-password}"
MONGO_DB="${MONGO_DB:-bemft-cms}"
MONGO_URI="mongodb://${MONGO_ROOT_USER}:${MONGO_ROOT_PASSWORD}@localhost:27017/${MONGO_DB}?authSource=admin"

cd "$PROJECT_ROOT"

echo "── RESTORE MONGODB ──"
echo "  File : $MONGO_BACKUP"
echo "  DB   : $MONGO_DB (--drop, data lama dihapus)"
read -r -p "Lanjutkan? [y/N] " ans
case "$ans" in y|Y) ;; *) echo "Dibatalkan."; exit 1 ;; esac

# --nsInclude wajib: tanpa itu mongorestore (dgn --archive) tidak me-restore
# koleksi apa pun (terverifikasi: 0 dokumen). --drop menimpa data lama.
docker compose exec -T db mongorestore --uri="$MONGO_URI" --archive --gzip --drop \
  --nsInclude="${MONGO_DB}.*" < "$MONGO_BACKUP"
echo "  OK: MongoDB restored."

if [ -n "$UPLOADS_BACKUP" ]; then
  [ -f "$UPLOADS_BACKUP" ] || { echo "File uploads tidak ditemukan: $UPLOADS_BACKUP"; exit 1; }
  vol="$(docker volume ls --format '{{.Name}}' | grep "uploads_data$" | head -1 || true)"
  [ -n "$vol" ] || { echo "Volume uploads_data tidak ditemukan"; exit 1; }
  echo "── RESTORE UPLOADS ──"
  echo "  File : $UPLOADS_BACKUP"
  echo "  Vol  : $vol (isi lama DIHAPUS)"
  read -r -p "Lanjutkan? [y/N] " ans
  case "$ans" in y|Y) ;; *) echo "Dibatalkan."; exit 1 ;; esac
  # Hapus isi lama lalu ekstrak backup (via container alpine agar volume sama).
  docker run --rm \
    -v "$vol:/data" \
    -v "$(dirname "$UPLOADS_BACKUP"):/backup:ro" \
    alpine:3 sh -c 'rm -rf /data/* /data/.[!.]* 2>/dev/null || true; tar xzf "/backup/'"$(basename "$UPLOADS_BACKUP")"'" -C /data'
  echo "  OK: Uploads restored."
fi

echo "── Selesai. Restart service api agar upload URL tetap konsisten: docker compose restart api ──"
