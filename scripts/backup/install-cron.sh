#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# install-cron.sh — Pasang jadwal cron untuk backup otomatis harian.
#
# Default: setiap hari 19:30 UTC (02:30 WIB). Ubah CRON_SCHEDULE bila perlu.
#
# Usage:
#   ./install-cron.sh            # pasang (atau update) cron backup
#   ./install-cron.sh --remove   # hapus cron backup
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup.sh"
LOG_DIR="${BACKUP_DIR:-/var/backups/bemft-unesa}"
CRON_LINE=""
CRON_TAG="# bemft-unesa-db-backup"
CRON_SCHEDULE="${CRON_SCHEDULE:-30 19 * * *}"   # 19:30 UTC = 02:30 WIB

chmod +x "$BACKUP_SCRIPT" "$SCRIPT_DIR/restore.sh" 2>/dev/null || true
mkdir -p "$LOG_DIR"

if [ "${1:-}" = "--remove" ]; then
  crontab -l 2>/dev/null | grep -v -e "$CRON_TAG" -e "$CRON_SCHEDULE.*backup.sh" | crontab -
  echo "Cron backup dihapus."
  exit 0
fi

CRON_LINE="$CRON_SCHEDULE $BACKUP_SCRIPT >> $LOG_DIR/cron.log 2>&1 $CRON_TAG"

# Hapus baris lama lalu tambahkan (idempotent)
(crontab -l 2>/dev/null | grep -v -e "$CRON_TAG" -e "$CRON_SCHEDULE.*backup.sh" || true; echo "$CRON_LINE") | crontab -
echo "Cron terpasang:"
echo "  $CRON_LINE"
echo ""
echo "Verifikasi: crontab -l"
echo "Backup pertama bisa diuji manual: $BACKUP_SCRIPT"
