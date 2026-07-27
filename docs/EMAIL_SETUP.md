# Email Server Setup — BEM FT UNESA 2026

## Architecture

```
┌─────────────┐     SMTP (25)     ┌──────────────────────────────────────┐
│  NestJS API │ ─────────────────→ │ Postal v3.3.7 (Self-hosted)         │
│  (Docker)   │   with auth       │  ┌──────────┐  ┌────────┐  ┌──────┐│──→ Internet
└─────────────┘                    │  │ web-server│  │smtp-srv│  │worker││
                                   │  └──────────┘  └────────┘  └──────┘│
                                   │         └──────────────────┘       │
                                   │              MariaDB               │
                                   └──────────────────────────────────────┘
```

## Current Setup (Production)

| Component | Details |
|---|---|
| Postal Version | 3.3.7 (Docker: `ghcr.io/postalserver/postal`) |
| VPS | `43.133.158.83` |
| Web UI | `http://mail.bemftunesa.org:5000` |
| SMTP | `mail.bemftunesa.org:25` |
| Domain | `bemftunesa.org` (all DNS checks: ✅ Good) |
| Admin | `admin@bemftunesa.org` |
| Mail Server | `mail bemft unesa` (server ID: 1) |
| SMTP Credentials | Server UUID: `d6155653-03cf-4ba8-8710-ef5f7f026589` |

## DNS Records (Cloudflare)

All records configured and verified:

```
MX      @                    → mail.bemftunesa.org (priority 10)       ✅
A       mail                 → 43.133.158.83                           ✅
TXT     @                    → v=spf1 a mx include:bemftunesa.org ~all ✅
TXT     postal-ONZ0Pr._domainkey → (DKIM key)                         ✅
CNAME   psrp                 → mail.bemftunesa.org (Return Path)       ✅
TXT     _dmarc               → v=DMARC1; p=quarantine; ...             ✅
```

## Postal v3 Container Architecture

Three services from the same image, no RabbitMQ needed:

```yaml
postal-web:     postal web-server  (port 5000) — Admin UI
postal-smtp:    postal smtp-server (port 25)   — Receives mail
postal-worker:  postal worker               — Processes & delivers mail
postal-db:      MariaDB 10.11              — Database
```

## Backend SMTP Configuration (.env)

```bash
SMTP_HOST=postal-smtp
SMTP_PORT=25
SMTP_USER=d6155653-03cf-4ba8-8710-ef5f7f026589   # Server UUID
SMTP_PASS=6928527591c00236e6a9fc73baa59ca7        # Credential key
SMTP_FROM_NAME=BEM FT UNESA 2026
SMTP_FROM_EMAIL=noreply@bemftunesa.org
```

## Email Verification Flow

```
1. User registers (POST /auth/register)
   → OTP generated (6 digits, crypto.randomInt)
   → OTP hashed with bcrypt, stored in user document
   → EventEmitter emits 'email.verification.send'
   → MailListener handles event
   → PostalSmtpAdapter sends OTP via SMTP with auth

2. User receives email with 6-digit OTP
   → Dark theme + orange accent email template

3. User submits OTP (POST /auth/verify-email)
   → Max 5 attempts before lockout (15 min)
   → bcrypt.compare against stored hash
   → Audit log recorded

4. Resend OTP (POST /auth/resend-verification)
   → Max 5 resends
   → 60-second cooldown between resends
   → New OTP generated each time (invalidates old)

5. Check status (GET /auth/verification-status?email=...)
   → Returns verification state, resend count, lockout status
```

## Security Features

| Feature | Details |
|---|---|
| OTP Generation | `crypto.randomInt()`, 6 digits |
| OTP Storage | bcrypt-hashed, never stored in plaintext |
| OTP Expiry | 10 minutes |
| Max Verify Attempts | 5 (then 15-min lockout) |
| Max Resend Count | 5 (then 15-min lockout) |
| Resend Cooldown | 60 seconds between resends |
| SMTP Auth | Server UUID + credential key (not plaintext) |
| DKIM Signing | Automatic via Postal |
| SPF/DKIM/DMARC | All configured and passing |

## Management Commands

```bash
# Check Postal services
docker compose ps postal-web postal-smtp postal-worker postal-db

# View Postal logs
docker compose logs postal-smtp --tail 20
docker compose logs postal-worker --tail 20
docker compose logs postal-web --tail 20

# Access Postal Rails console
docker compose exec postal-web postal console

# Create additional admin
docker compose run --rm postal-web postal make-user

# Check DNS records from VPS
dig +short TXT bemftunesa.org           # SPF
dig +short TXT postal-ONZ0Pr._domainkey.bemftunesa.org  # DKIM
dig +short MX bemftunesa.org            # MX
dig +short CNAME psrp.bemftunesa.org    # Return Path
```

## Troubleshooting

### Email goes to spam
1. Verify DNS: all records must be Green in Postal web UI
2. Check PTR record (reverse DNS): `dig -x 43.133.158.83`
3. Warm up the IP — start with small volumes
4. Check Postal logs: `docker compose logs postal-worker`

### Postal won't start
```bash
docker compose logs postal-web postal-smtp postal-worker postal-db
```

Common issues:
- MariaDB not ready: increase `start_period` in healthcheck
- Port 25 blocked: check VPS firewall / cloud provider restrictions
- GHCR.io blocked from VPS: use `docker.io/ghcr.io/postalserver/postal:3.3.7`

### API can't connect to Postal
- Ensure API container is on the `postal` network
- Use `SMTP_HOST=postal-smtp` (the compose service name)
- Check: `docker compose exec api nc -zv postal-smtp 25`

### Port 25 blocked by cloud provider
Some cloud providers (AWS, GCP) block port 25 by default. Tencent Cloud typically allows it:
```bash
# From VPS
telnet localhost 25

# From external
telnet 43.133.158.83 25
```
