# Contributing to SoroWork Backend

## Prerequisites

- Node.js 20+
- PostgreSQL
- npm

## Setup

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run dev
```

## Code Style

- TypeScript strict mode
- ESLint + Prettier (coming soon)
- Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `chore:`

## Pull Requests

1. Fork the repo and create a branch from `main`
2. Add tests for new features
3. Ensure all tests pass
4. Submit a PR with a clear description
