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

## API Base URL
`/api/v1`

## Auth
- Google OAuth: `GET /api/v1/auth/google`
- JWT Token: `POST /api/v1/auth/login`
- Bypass (dev only): `GET /api/v1/auth/bypass?email=...`
