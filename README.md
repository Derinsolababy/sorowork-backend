# SoroWork Backend

REST API for SoroWork — a platform where communities post real-world tasks (cleanups, repairs, landscaping, maintenance) and workers earn USDC on Stellar/Soroban.

## Stack

- **Runtime**: Node.js 20 + TypeScript
- **Framework**: Express 4
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: JWT + Stellar wallet signature verification
- **Blockchain**: `@stellar/stellar-sdk` for Horizon + Soroban RPC

## Setup

```bash
cp .env.example .env
# Edit .env with your database URL and JWT secret

npm install
npx prisma generate
npx prisma db push   # or prisma migrate dev for migrations

npm run dev          # starts on PORT (default 3001)
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `JWT_SECRET` | Secret for signing JWTs | — |
| `STELLAR_NETWORK` | `testnet` or `mainnet` | `testnet` |
| `PORT` | HTTP port | `3001` |
| `CORS_ORIGIN` | Allowed CORS origin | `*` |
| `UPLOAD_DIR` | File upload directory | `./uploads` |

## Authentication

All protected endpoints require `Authorization: Bearer <token>`.

Tokens are obtained via wallet-signature login:

1. Sign a nonce/message with your Stellar keypair (e.g. using Freighter)
2. POST to `/api/auth/login` with `{ walletAddress, signature, message }`
3. Receive a JWT valid for 7 days

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register new account |
| POST | `/api/auth/login` | — | Login with wallet signature |
| GET | `/api/auth/me` | ✓ | Get current user |

### Tasks (Community Work)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/tasks` | — | List tasks (filter: status, tag, creatorId, communityId) |
| POST | `/api/tasks` | ✓ | Post a new community task with USDC reward |
| GET | `/api/tasks/:id` | — | Get task with submissions |
| PUT | `/api/tasks/:id` | ✓ | Update task (poster only) |
| DELETE | `/api/tasks/:id` | ✓ | Cancel task (poster only, OPEN status) |
| POST | `/api/tasks/:id/assign` | ✓ | Assign a worker (poster only) |

### Submissions
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/submissions` | ✓ | Submit proof of completed work (photos, video, etc.) |
| GET | `/api/submissions/task/:taskId` | ✓ | List submissions for task (poster only) |
| PUT | `/api/submissions/:id/approve` | ✓ | Approve submission — releases USDC (poster only) |
| PUT | `/api/submissions/:id/reject` | ✓ | Reject submission (poster only) |

### Profiles
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/profiles/:walletAddress` | — | Public profile |
| PUT | `/api/profiles/me` | ✓ | Update own profile |
| GET | `/api/profiles/:walletAddress/contributions` | — | Approved contributions |

### Communities
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/communities` | — | List communities (search with ?q=) |
| POST | `/api/communities` | ✓ | Create community |
| GET | `/api/communities/:id` | — | Community detail + members |
| POST | `/api/communities/:id/join` | ✓ | Join community |
| GET | `/api/communities/:id/tasks` | — | Community tasks |

### Feed & Leaderboard
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/feed` | — | Paginated activity feed |
| GET | `/api/leaderboard` | — | Top workers by reputation (?period=week\|month) |

### Notifications
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | ✓ | List notifications (?unread=true) |
| PUT | `/api/notifications/:id/read` | ✓ | Mark one read |
| PUT | `/api/notifications/read-all` | ✓ | Mark all read |

### Admin (ADMIN role required)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/stats` | ✓ Admin | Platform statistics |
| GET | `/api/admin/users` | ✓ Admin | List all users |
| PUT | `/api/admin/users/:id/role` | ✓ Admin | Update user role |

## Stellar Integration

`src/services/stellar.ts` provides:

- **`getAccount(publicKey)`** — fetch Stellar account from Horizon
- **`verifySignature(message, signatureBase64, publicKey)`** — verify Ed25519 wallet signature for passwordless auth
- **`buildEscrowTx(params)`** — build a Soroban transaction calling the bounty escrow contract, returns XDR for client signing

The client (Freighter) signs the XDR and submits it to the network. The backend only builds and verifies — it never holds private keys.

## Payment Flow

```
Community leader → POST /tasks (creates DB record + calls buildEscrowTx)
       ↓
Client signs XDR + submits to Stellar network (USDC locked in escrow)
       ↓
Worker completes the job → POST /submissions (with photo/video proof)
       ↓
Community leader → PUT /submissions/:id/approve
       ↓
On-chain: escrow contract releases USDC to worker
Backend: reputation +10, notification sent
```

## Data Model

See `prisma/schema.prisma` for the full model. Key relations:

- `User` → many `Task` (as community leader), many `Submission` (as worker)
- `Task` → many `Submission`, optional `Community`
- `Community` → many `Task`, many `CommunityMember`
- `Notification` → belongs to `User`
