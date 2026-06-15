# NileRemit — Crypto-to-ETB Remittance (Prototype)

A full-stack prototype for sending crypto from the diaspora and delivering Ethiopian Birr (ETB) to bank accounts and Telebirr. Built as a monorepo with a **Next.js** frontend and **Express + Prisma** backend.

| App | Stack | URL (dev) |
|-----|-------|-----------|
| `apps/web` | Next.js 16, React 19, Tailwind CSS 4 | http://localhost:3000 |
| `apps/api` | Node.js, Express, TypeScript, Prisma 6 | http://localhost:4000 |

Shared contracts and module docs: [`CONTRACTS.md`](CONTRACTS.md) · Product spec: [`PRD.md`](PRD.md) · Build prompts: [`PROMPTS.md`](PROMPTS.md)

---

## Prerequisites

- **Node.js** 20+ and npm
- **PostgreSQL** 14+ running locally (or reachable remotely)
- Two terminal sessions (one for API, one for web)

---

## Quick start

### 1. Clone and install dependencies

```bash
cd apps/api
npm install

cd ../web
npm install
```

### 2. Configure environment

**API** — copy the example env and edit for your database:

```bash
cd apps/api
cp .env.example .env
```

**Web** — point the frontend at the API:

```bash
cd apps/web
cp .env.example .env.local
```

See [Environment variables](#environment-variables) below for every key.

### 3. Database migrate & seed

From `apps/api` (with PostgreSQL running and `DATABASE_URL` set in `.env`):

```bash
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

`prisma:migrate` applies existing migrations. To reset the DB and re-seed from scratch:

```bash
npm run db:reset
```

### 4. Run both apps

**Terminal 1 — API**

```bash
cd apps/api
npm run dev
```

**Terminal 2 — Web**

```bash
cd apps/web
npm run dev
```

Open **http://localhost:3000**. The API health check is at **http://localhost:4000/health**.

---

## Environment variables

### `apps/api/.env`

| Variable | Required | Default / example | Description |
|----------|----------|-------------------|-------------|
| `PORT` | No | `4000` | API listen port |
| `NODE_ENV` | No | `development` | Runtime environment |
| `CORS_ORIGINS` | Yes | `http://localhost:3000` | Comma-separated allowed browser origins |
| `DATABASE_URL` | Yes | `postgresql://user:pass@localhost:5432/crypto_remittance?schema=public` | PostgreSQL connection string for Prisma |
| `UPLOAD_DIR` | No | `uploads` | Directory for KYC document uploads (relative to `apps/api`) |
| `MAX_UPLOAD_BYTES` | No | `5242880` | Max KYC upload size (5 MB) |
| `JWT_ACCESS_SECRET` | Yes | — | Secret for access tokens (use a long random string in prod) |
| `JWT_REFRESH_SECRET` | Yes | — | Secret for refresh tokens |
| `JWT_ACCESS_TTL` | No | `15m` | Access token lifetime |
| `JWT_REFRESH_TTL` | No | `7d` | Refresh token lifetime |

### `apps/web/.env.local`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:4000` | Base URL of `apps/api` (no trailing slash) |

---

## Seed data

The seed script (`apps/api/prisma/seed.ts`) is **idempotent** — safe to run multiple times.

**Default password for all seeded accounts:** `Password123!`

| Email | Role | KYC | Notes |
|-------|------|-----|-------|
| `admin@remittance.test` | ADMIN | Tier 3, APPROVED | Admin dashboard, KYC review, liquidity |
| `abel@diaspora.test` | SENDER | Tier 2, APPROVED | Pre-loaded beneficiaries; ready to send money |
| `sara@diaspora.test` | SENDER | Tier 1, PENDING | Useful for KYC approval demo |

**Also seeded:**

- Exchange rate: **132.5** USD/ETB, **151.2** CHF/ETB
- Swiss liquidity pool: CHF 500,000 · USD 250,000
- Ethiopia liquidity pool: ETB 5,000,000 available
- Sample beneficiaries for Abel (CBE bank + Telebirr) and Sara (Awash bank)

Run manually anytime from `apps/api`:

```bash
npm run seed
```

---

## Full demo walkthrough

This follows the [PRD §16 Demo Success Criteria](PRD.md). Allow ~10 minutes for the happy path.

### A. Sender happy path (use `abel@diaspora.test`)

Abel is already KYC-approved with beneficiaries — fastest path to a completed transfer.

1. **Login** at http://localhost:3000/login  
   - Email: `abel@diaspora.test` · Password: `Password123!`

2. **Send money** — sidebar → **Send Money** (`/transfers/new`)  
   - Pick beneficiary **Abebe Kebede** (CBE)  
   - Amount: e.g. **100 USDC** — watch the live quote update  
   - Review → **Confirm & create transfer**

3. **Simulate crypto deposit** on the deposit screen  
   - Click **I've deposited (simulate)**  
   - The orchestrator runs: blockchain confirm → Swiss credit → FX → ETB reserve → mock bank payout → **COMPLETED**

4. **Live timeline** — click **View live timeline** or open **Transfers** → your transfer  
   - Steps update in real time via SSE (`INITIATED` → … → `COMPLETED`)

### B. Full registration + KYC path (optional)

Demonstrates criteria for register → KYC → beneficiary → transfer.

1. **Register** a new sender at `/register` (or use `sara@diaspora.test` for a pending KYC user).

2. **KYC** — `/kyc`  
   - Choose tier, upload documents (or activate Tier 1)  
   - Status shows **Pending** until admin approves

3. **Admin approves KYC** — log in as `admin@remittance.test`  
   - **KYC Review** (`/admin/kyc`) → open submission → **Approve**

4. **Beneficiary** — `/beneficiaries` → add or edit a recipient (bank or Telebirr).

5. Continue from **Send money** (step A.2 above).

### C. Admin monitoring

Log in as **`admin@remittance.test`** / `Password123!`

| Page | URL | What to show |
|------|-----|--------------|
| Dashboard | `/admin` | KPI cards: transfers, ETB paid, crypto received, pool balances, active users |
| Transactions | `/admin/transactions` | All transfers; filter by status; open drawer for details |
| Liquidity | `/admin/liquidity` | Swiss & Ethiopia pool widgets, ledger, low-liquidity banner |
| Controls | `/admin/controls` | Update FX rate; reconcile **failed** transfers (reverse / force complete) |
| KYC Review | `/admin/kyc` | Approve or reject pending verifications |

After a completed transfer, refresh **Admin dashboard** and **Liquidity** — Swiss USD balance and Ethiopia ETB reserved/disbursed figures update via the ledger.

### D. Failure demo (optional)

Mock Ethiopian payouts fail ~15% of the time when the orchestrator calls the mock API with `?fail=true`. To demo admin recovery:

1. Complete a transfer that ends in **FAILED** (may require several simulate attempts).
2. Open **Admin → Controls** or **Transactions** → select the failed transfer.
3. **Mark reversed** or **Force complete** with an optional note.

---

## Demo success checklist

| # | Criterion | How to verify |
|---|-----------|---------------|
| 1 | User can register | `/register` |
| 2 | User can complete KYC | `/kyc` + admin approval at `/admin/kyc` |
| 3 | User can create beneficiary | `/beneficiaries` |
| 4 | User can initiate transfer | `/transfers/new` |
| 5 | Mock crypto deposit confirmed | **I've deposited (simulate)** |
| 6 | Swiss liquidity receives funds | Transfer timeline → `SWISS_FUNDS_RECEIVED`; `/admin/liquidity` ledger |
| 7 | ETB payout via mock bank | Timeline → `PAYOUT_SENT` / `COMPLETED` |
| 8 | Timeline updates in real time | `/transfers/[id]` with live indicator |
| 9 | Admin sees liquidity balances | `/admin` or `/admin/liquidity` |
| 10 | Admin sees all transactions | `/admin/transactions` |

---

## Useful commands

### API (`apps/api`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled production build |
| `npm run typecheck` | TypeScript check |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:migrate` | Apply migrations (dev) |
| `npm run prisma:deploy` | Apply migrations (production) |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm run db:reset` | Drop DB, migrate, seed |
| `npm run seed` | Run seed script only |

### Web (`apps/web`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |

---

## Project structure

```
crypto-remittance/
├── apps/
│   ├── api/                 # Express API, Prisma, modules (auth, kyc, transfers, …)
│   │   ├── prisma/          # schema, migrations, seed
│   │   └── src/
│   └── web/                 # Next.js App Router frontend
│       └── src/
│           ├── app/         # routes (dashboard, admin, auth, transfers)
│           ├── components/
│           └── lib/api/     # typed API client
├── CONTRACTS.md             # Shared API shapes & module contracts
├── PRD.md                   # Product requirements
├── PROMPTS.md               # Module-by-module build prompts
└── README.md                # This file
```

---

## Troubleshooting

**API won't start — database connection**  
Confirm PostgreSQL is running and `DATABASE_URL` in `apps/api/.env` is correct. Test with `npm run prisma:studio`.

**Web can't reach API**  
Ensure `NEXT_PUBLIC_API_URL=http://localhost:4000` in `apps/web/.env.local` and `CORS_ORIGINS` includes `http://localhost:3000`.

**KYC uploads fail**  
Check `UPLOAD_DIR` exists and is writable. The API serves uploaded files from `/uploads/kyc/…`.

**Transfer blocked — KYC**  
Sending requires `kycStatus=APPROVED`. Use Abel's seeded account or approve via `/admin/kyc`.

**401 on admin pages**  
Log in with `admin@remittance.test`. Non-admin users are redirected to the sender dashboard.

---

## Production notes (prototype)

This repo is a **demo prototype**, not production-ready:

- Seeded passwords are shared and documented.
- JWT secrets in `.env.example` are placeholders — rotate for any shared deployment.
- External systems (blockchain, Swiss bank, Ethiopian payouts) are **mocked** under `/api/mock/*`.
- Do not commit `.env` or `.env.local` files.
