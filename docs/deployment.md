# Deployment Guide

## Docker

```bash
docker-compose up -d
```

## Manual

1. Set up PostgreSQL
2. Copy `.env.example` to `.env` and fill in values
3. `npm install && npm run build`
4. `npx prisma db push`
5. `node dist/index.js`

## Environment Variables

See `.env.example` for all required variables.

## Health Check

```
GET /health → { status: "ok", version: "1.0.0", uptime: ... }
```
