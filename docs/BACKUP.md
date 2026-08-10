# Backup Otomatis Database & Uploads

Program backup otomatis untuk database MongoDB (`bemft-cms`) dan folder uploads
pada deployment docker-compose (VPS). Dijalankan via **cron** dan **aman untuk
produksi**.

## Ringkasan

| Item | Nilai |
|---|---|
| Database | MongoDB 6 (container `db`, volume `mongodb_data`) |
| Uploads | Volume `uploads_data` (`/app/backend/public/uploads`) |
| File backup | `mongodb-YYYYMMDD-HHMMSS.gz` + `uploads-YYYYMMDD-HHMMSS.tar.gz` |
| Lokasi default | `/var/backups/bemft-unesa` |
| Retensi default | 14 hari (file lama dihapus otomatis) |
| Jadwal default | Harian 19:30 UTC (02:30 WIB) |
| Remote (opsional) | rclone (R2/Wasabi/S3/Drive) bila `BACKUP_RCLONE_REMOTE` di-set |

## File

```
scripts/backup/
├── backup.sh            # Script utama: dump DB + uploads + retensi (+ remote)
├── restore.sh           # Restore DB & uploads dari file backup
├── backup.env.example   # Contoh konfigurasi
└── install-cron.sh      # Pasang/hapus jadwal cron
docs/BACKUP.md           # Dokumentasi ini
```

## Cara pakai (VPS)

### 1. Tes manual sekali

```bash
cd /home/<user>/bemft-unesa-web
bash scripts/backup/backup.sh
ls -lh /var/backups/bemft-unesa/
```

Harus menghasilkan `mongodb-*.gz` (dan `uploads-*.tar.gz`). Log ada di
`/var/backups/bemft-unesa/backup.log`.

### 2. Pasang cron otomatis

```bash
bash scripts/backup/install-cron.sh        # harian 02:30 WIB
# atau dengan jadwal khusus:
CRON_SCHEDULE="0 */6 * * *" bash scripts/backup/install-cron.sh   # tiap 6 jam
# hapus cron:
bash scripts/backup/install-cron.sh --remove
```

Cek: `crontab -l`.

> Pastikan script dapat dijalankan tanpa tty (cron tidak punya terminal).
> `docker compose` harus bisa dipanggil dari direktori project — script sudah
> otomatis `cd` ke root project.

## Restore

> ⚠️ **Restore menimpa data yang ada** (mongorestore `--drop` + uploads lama
> dihapus). Backup dulu data saat ini bila ragu.

```bash
# Restore DB saja:
bash scripts/backup/restore.sh /var/backups/bemft-unesa/mongodb-20260810-210832.gz

# Restore DB + uploads:
bash scripts/backup/restore.sh mongodb-....gz uploads-....tar.gz

# Setelah restore uploads, restart service api:
docker compose restart api
```

Restore bisa diuji aman ke database terpisah:

```bash
docker compose exec -T db mongorestore \
  --uri='mongodb://admin:password@localhost:27017/bemft-restore-test?authSource=admin' \
  --archive --gzip --nsInclude='bemft-cms.*' \
  --nsFrom='bemft-cms.*' --nsTo='bemft-restore-test.*' < mongodb-....gz
```

## Konfigurasi

Semua variabel punya default aman. Override via environment, file
`scripts/backup/backup.env`, atau root `.env` (credential mongo dibaca dari
`MONGO_ROOT_USER` / `MONGO_ROOT_PASSWORD` di root `.env`).

| Variabel | Default | Keterangan |
|---|---|---|
| `BACKUP_DIR` | `/var/backups/bemft-unesa` | Lokasi simpan backup |
| `BACKUP_RETENTION_DAYS` | `14` | Hapus backup lebih tua dari N hari |
| `MONGO_CONTAINER_SERVICE` | `db` | Service compose untuk mongo |
| `MONGO_DB` | `bemft-cms` | Nama database |
| `BACKUP_RCLONE_REMOTE` | (kosong) | Remote rclone, mis. `backup-s3:bemft-unesa` |

## Backup remote (opsional tapi disarankan)

Backup di server yang sama tetap berisiko hilang jika **server mati**.
Disarankan salin ke penyimpanan eksternal (R2/Wasabi/S3 — murah, ~$0.15/GB/bulan
untuk R2, upload gratis).

1. Install rclone: `sudo apt install rclone` lalu `rclone config` (pilih S3
   provider, mis. Cloudflare R2 / Backblaze B2 / Wasabi).
2. Set di root `.env` atau environment:
   ```
   BACKUP_RCLONE_REMOTE=backup-s3:bemft-unesa
   ```
3. Jalankan backup — file akan otomatis di-`rclone copy` ke remote (folder per
   tanggal `YYYYMMDD/`). Backup lokal tetap tersimpan.

> Kredensial rclone (`~/.config/rclone/rclone.conf`) jangan dicommit ke repo.

## Catatan teknis

- Dump memakai `mongodump --archive --gzip` via `docker compose exec db` —
  menghasilkan **satu file biner** yang valid & mudah dipindah. Ukuran dev
  ~30 KB (data sedikit); produksi dengan ribuan maba bisa ratusan MB.
- Uploads di-*tar* via container `alpine:3` agar isi volume persis.
- Script validasi output gzip (`1f 8b` magic) — gagal dump = tidak menyisakan
  file korup.
- Teruji di mesin dev: backup OK + restore ke DB terpisah menghasilkan 42/42
  koleksi identik (termasuk `users`, `roles`, `permissions`, `pkkmb_gugus`).
