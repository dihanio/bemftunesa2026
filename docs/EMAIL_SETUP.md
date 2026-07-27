# Email Server Setup — BEM FT UNESA 2026

## Architecture

```
┌─────────────┐     SMTP (25)     ┌──────────────┐
│  NestJS API │ ─────────────────→ │ Postal Server │ ──→ Internet
│  (Docker)   │                    │  (Docker)     │
└─────────────┘                    └──────┬───────┘
                                          │
                              ┌───────────┼───────────┐
                              │           │           │
                         ┌────┴───┐  ┌────┴───┐  ┌───┴────┐
                         │ MariaDB│  │ RabbitMQ│  │ Caddy  │
                         └────────┘  └─────────┘  └────────┘
```

## Quick Start

### 1. Configure DNS Records

Add these records to your DNS provider for `bemftunesa.org`:

```
# MX Record (required — tells mail servers where to deliver email)
Type: MX
Host: @ (or bemftunesa.org)
Value: mail.bemftunesa.org
Priority: 10
TTL: 3600

# A Record (required — points mail subdomain to your VPS)
Type: A
Host: mail
Value: 43.133.158.83
TTL: 3600

# SPF Record (required — authorizes your server to send email)
Type: TXT
Host: @ (or bemftunesa.org)
Value: v=spf1 mx a ip4:43.133.158.83 ~all
TTL: 3600

# DKIM Record (required — cryptographic signature for email authentication)
# Get the DKIM key from Postal UI after setup: http://<VPS_IP>:5000
Type: TXT
Host: postal._domainkey
Value: (obtained from Postal UI after setup)
TTL: 3600

# DMARC Record (required — tells receivers what to do with failed checks)
Type: TXT
Host: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@bemftunesa.org; pct=100
TTL: 3600

# Reverse DNS / PTR Record (required — verify with your VPS provider)
# Contact Tencent Cloud support to set PTR for 43.133.158.83 → mail.bemftunesa.org
```

### 2. Start Postal Server

```bash
cd ~/bemftunesa2026
docker compose up -d postal postal-db postal-rabbitmq
```

### 3. Initial Postal Setup

```bash
# Wait for services to be healthy (~30 seconds)
docker compose ps

# Create initial admin user
docker compose exec postal postal make-user
# Follow the prompts:
#   Email: admin@bemftunesa.org
#   Password: (choose a strong password)
#   Name: Postal Admin
```

### 4. Configure Postal via Web UI

1. Open `http://43.133.158.83:5000` in your browser
2. Login with the admin credentials
3. Go to **Organization Settings** → **Add Organization**
4. Create organization: `BEM FT UNESA`
5. Go to **Servers** → **Add Server**
   - Name: `bemftunesa`
   - Mode: `Transactional`
6. After server is created, go to **Credentials** tab
7. Note down:
   - **SMTP Host**: `postal` (Docker internal) or `43.133.158.83` (external)
   - **SMTP Port**: `25`
   - **API Key** (for future HTTP API use)
8. Go to **DKIM Keys** tab → **Generate Key**
9. Copy the DKIM TXT record value and add it to your DNS

### 5. Verify DNS Setup

```bash
# Check MX record
dig MX bemftunesa.org +short

# Check SPF
dig TXT bemftunesa.org +short

# Check DKIM (after adding the record)
dig TXT postal._domainkey.bemftunesa.org +short

# Check DMARC
dig TXT _dmarc.bemftunesa.org +short

# Check reverse DNS (PTR)
dig -x 43.133.158.83 +short
```

### 6. Test Email Delivery

From the Postal UI, go to **Servers** → **bemftunesa** → **Send Test Email**:

```
To: test@gmail.com
From: noreply@bemftunesa.org
Subject: Test Email from BEM FT UNESA
Body: This is a test email.
```

Check:
- [ ] Email arrives in inbox (not spam)
- [ ] SPF passes (check email headers)
- [ ] DKIM passes
- [ ] DMARC passes

### 7. Start Full Stack

```bash
cd ~/bemftunesa2026
docker compose up -d --build
```

## Environment Variables

Add to `.env`:

```bash
# SMTP (Postal)
SMTP_HOST=postal
SMTP_PORT=25
SMTP_USER=
SMTP_PASS=
SMTP_FROM_NAME=BEM FT UNESA 2026
SMTP_FROM_EMAIL=noreply@bemftunesa.org
```

> When running inside Docker, `SMTP_HOST=postal` resolves to the Postal container.
> For external access (from host), use `SMTP_HOST=43.133.158.83`.

## Email Verification Flow

```
1. User registers (POST /auth/register)
   → OTP generated (6 digits, crypto.randomInt)
   → OTP hashed with bcrypt, stored in user document
   → Email verification sent via Postal SMTP

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
| Audit Logging | All attempts logged with IP + User Agent |
| Brute Force Protection | Progressive lockout on failed attempts |

## Troubleshooting

### Email goes to spam
1. Verify all DNS records are correct: `dig MX/TXT bemftunesa.org`
2. Check PTR record (reverse DNS): `dig -x 43.133.158.83`
3. Warm up the IP — start with small volumes
4. Check Postal logs: `docker compose logs postal`

### Postal won't start
```bash
docker compose logs postal postal-db postal-rabbitmq
```

Common issues:
- MariaDB not ready: increase `start_period` in healthcheck
- Port 25 blocked: check VPS firewall / cloud provider restrictions
- RabbitMQ connection refused: check `postal-rabbitmq` health

### API can't connect to Postal
- Ensure API container is on the `postal` network
- Use `SMTP_HOST=postal` (not localhost)
- Check: `docker compose exec api nc -zv postal 25`

### Port 25 blocked by cloud provider
Some cloud providers (AWS, GCP) block port 25 by default. Tencent Cloud (your VPS) typically allows it, but check:
```bash
# From VPS
telnet localhost 25

# From external
telnet 43.133.158.83 25
```

If blocked, you may need to:
1. Request unblock from Tencent Cloud support
2. Or use port 587 with TLS (requires SSL certificate for mail.bemftunesa.org)
