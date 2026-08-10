# BEM FT UNESA — Backend API

NestJS REST API for the BEM FT UNESA Digital Ecosystem monorepo.

## Prerequisites
- Node.js >= 18
- MongoDB Atlas account (or local MongoDB >= 6)
- Google OAuth credentials (for SSO login)

## Setup

1. Copy environment template:
   cp .env.example .env

2. Fill in all values in `.env` (see `.env.example` for required keys)

3. Install dependencies (from monorepo root):
   npm install

4. Start in development mode:
   npm run start:dev

## Available Commands
| Command | Description |
|---|---|
| `npm run start:dev` | Start with hot reload |
| `npm run build` | Compile to production |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |

## Database Seeders
| Command | Description |
|---|---|
| `npm run seed:berita` | Seed sample news content |
| `npm run seed:cms` | Seed CMS initial data |

## Environment Variables
See `.env.example` for the full list of required variables.

> **Dua file `.env` (jangan tertukar):**
> - `.env` di **root repo** → untuk **docker-compose** (`MONGODB_URI` memakai host `db` = nama service docker).
> - `backend/.env` → untuk **dev lokal** (`MONGODB_URI` memakai `127.0.0.1:27017`).
>
> Karena dotenv tidak menimpa variabel yang sudah ada di environment shell, jika shell/root `.env`
> mengekspor `MONGODB_URI` dengan host `db`, server lokal akan gagal connect (host tidak resolve di luar docker).
> Script dev (`npm run start:dev` / `start:debug`) sudah otomatis me-`unset MONGODB_URI` & `REDIS_URL`
> sehingga selalu memakai `backend/.env`. Script `start` / `start:prod` dan Dockerfile **tidak** diubah
> (produksi memang memakai host `db` dari compose).

## API Base URL
`/api/v1`

## Auth
- Google OAuth: `GET /api/v1/auth/google`
- JWT Token: `POST /api/v1/auth/login`
- Bypass (dev only): `GET /api/v1/auth/bypass?email=...`
