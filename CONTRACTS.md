# Shared Contracts

This file documents the contracts every team member must respect so modules can be built in
parallel without breaking each other. **Do not change a shared shape without updating this file
in the same PR and notifying the team.** (See `PROMPTS.md` for the module/ownership plan.)

## Repo layout

```
apps/
  web/   # Next.js 16 (App Router) frontend  — runs on http://localhost:3000
  api/   # Node.js + Express + TypeScript backend — runs on http://localhost:4000
PRD.md
PROMPTS.md
CONTRACTS.md
```

## Standard response envelope

Every API response uses this envelope (implemented in `apps/api/src/lib/apiResponse.ts`):

```jsonc
// success
{ "success": true, "data": { /* payload */ } }

// failure
{ "success": false, "error": { "code": "STRING_CODE", "message": "human readable", "details": {} } }
```

- Build with `ok(data)` / `fail(code, message, details?)`.
- Send with `sendOk(res, data, status?)` / `sendFail(res, status, code, message, details?)`.
- Throw `AppError` (e.g. `AppError.badRequest(...)`, `.unauthorized()`, `.notFound()`) anywhere in a
  request; the global error handler converts it to the error envelope.
- `ZodError`s are auto-converted to `400 VALIDATION_ERROR` with `error.details` = `zodError.flatten()`.

### Common error codes

`BAD_REQUEST` · `VALIDATION_ERROR` · `UNAUTHORIZED` · `FORBIDDEN` · `NOT_FOUND` · `CONFLICT` ·
`INTERNAL_SERVER_ERROR`

## Auth header format (Module 2)

- Access token sent as: `Authorization: Bearer <accessToken>`.
- `authMiddleware` (import from `../../middleware/auth.js`) verifies the access token and attaches
  `req.user = { id, email, role }`. Throws `401 UNAUTHORIZED` on missing/invalid/expired token.
- `requireRole(...roles)` enforces RBAC; use **after** `authMiddleware`. Throws `403 FORBIDDEN`.
  Roles: `SENDER`, `ADMIN`. Example: `router.get("/x", authMiddleware, requireRole("ADMIN"), handler)`.
- Access token TTL ~15m; refresh token TTL ~7d (configurable via env). Refresh tokens are stored
  hashed (SHA-256) in the `RefreshToken` table and **rotated** on every `/refresh` (old one revoked).
  `/logout` revokes the supplied refresh token.

## API route prefixes

Base URL: `http://localhost:4000`

| Prefix | Module(s) | Notes |
|--------|-----------|-------|
| `/health` | foundation | service health check |
| `/api` | foundation | lists mounted modules |
| `/api/auth` | 2 | register, login, refresh, logout, me |
| `/api/kyc` | 3 | submit (multipart), status, tier, admin pending/approve/reject |
| `/uploads/*` | 3 | static-served uploaded files (e.g. KYC docs) |
| `/api/beneficiaries` | 4 | CRUD + favorite toggle (auth required) |
| `/api/wallet` | 6 | deposit address / instructions |
| `/api/conversions` | 14 | crypto→CHF and CHF→ETB rate/conversion snapshots |
| `/api/transfers` | 8, 9 | quote, create, list, detail, timeline, events (SSE), simulate-deposit |
| `/api/liquidity` | 10 | pools, ledger (admin) |
| `/api/notifications` | 11 | list, mark read |
| `/api/admin` | 5, 10, 11, 13 | stats, audit, fx-rate, overrides |
| `/api/notifications` | 11 | list, mark read (auth required) |
| `/api/mock/*` | 5, 7 | fx-rate, blockchain/confirm, swiss/*, payout/* |

## Transfer status enum (PRD §7 — Transaction Lifecycle)

Happy path:

```
INITIATED → AWAITING_CRYPTO → BLOCKCHAIN_PENDING → BLOCKCHAIN_CONFIRMED →
SWISS_FUNDS_RECEIVED → FX_CONVERTED → PAYOUT_PROCESSING → PAYOUT_SENT → COMPLETED
```

Failure paths: `FAILED` · `REVERSED` · `EXPIRED`

## Conventions

- All IDs are strings (cuid/uuid from Prisma).
- Money fields: store amounts with explicit currency/asset; avoid floats for ledger math where possible.
- Timestamps are ISO 8601 strings in responses.
- New shared service/function signatures (e.g. `fxService.quote`, `getUserTransferLimit`,
  liquidity functions) get documented under their module section below as they are built.

## Module contract notes (append as modules ship)

> Add the concrete request/response shapes and exported function signatures here as each module
> is implemented, so the next person can rely on them.

### Module 1 — Prisma models (DONE)

Datasource: PostgreSQL via `DATABASE_URL`. Client: Prisma **v6**, singleton at
`apps/api/src/lib/prisma.ts` (`import { prisma } from "../lib/prisma.js"`). Schema:
`apps/api/prisma/schema.prisma`. Migrations: `apps/api/prisma/migrations/` (initial: `init`).
Scripts: `npm run prisma:generate | prisma:migrate | prisma:deploy | prisma:studio | db:reset | seed`.

**Seed (`apps/api/prisma/seed.ts`, idempotent via upsert)** — `npm run seed`:
- Users (default password `Password123!`): `admin@remittance.test` (ADMIN, KYC TIER_3 APPROVED),
  `abel@diaspora.test` (SENDER, TIER_2 APPROVED), `sara@diaspora.test` (SENDER, TIER_1 PENDING).
- ExchangeRate: usdToEtb 132.5, chfToEtb 151.2 (source SEED).
- LiquidityPools: SWISS (CHF 500,000 / USD 250,000), ETHIOPIA (ETB 5,000,000 available, capacity 5,000,000).
- Beneficiaries: Abebe Kebede (CBE, favorite) & Mulu Alemu (Telebirr) for Abel; Dawit Haile (Awash) for Sara.
All IDs are `cuid()` strings; money is `Decimal` (crypto `@db.Decimal(38,18)`, fiat
`@db.Decimal(20,2)`, rates `@db.Decimal(20,6)`).

**Enums**
- `Role`: `SENDER`, `ADMIN`
- `KycStatus`: `PENDING`, `APPROVED`, `REJECTED`
- `KycTier`: `TIER_1` ($500/mo), `TIER_2` ($5,000/mo), `TIER_3` (unlimited)
- `PayoutMethod`: `BANK`, `TELEBIRR`
- `BankName`: `CBE`, `AWASH`, `DASHEN`
- `AssetType`: `USDC`, `USDT`, `ETH`
- `TransferStatus`: full lifecycle (see enum above) + `FAILED`, `REVERSED`, `EXPIRED`
- `LiquidityPoolType`: `SWISS`, `ETHIOPIA`
- `LiquidityTransactionType`: `CREDIT`, `DEBIT`, `RESERVE`, `RELEASE`, `DISBURSE`, `SETTLEMENT`
- `NotificationType`: `TRANSFER_UPDATE`, `KYC_UPDATE`, `LIQUIDITY_ALERT`, `SYSTEM`

**Models** (key fields)
- `User`: firstName, lastName, email (unique), phone, country, passwordHash, role, kycTier,
  kycStatus, timestamps. Relations: kycVerifications, beneficiaries, wallets, transfers,
  notifications, auditLogs.
- `KycVerification`: userId, tier, status, passportUrl?, nationalIdUrl?, selfieUrl?,
  proofOfAddressUrl?, sourceOfFunds?, rejectionReason?, reviewedById?, reviewedAt?.
- `Beneficiary`: userId, fullName, country, payoutMethod, bank?, accountNumber?, phoneNumber?,
  isFavorite. (bank required when payoutMethod=BANK; phoneNumber for TELEBIRR — enforced in app layer.)
- `Wallet`: userId, asset, address, transferId? (unique 1:1 with Transfer). Deposit address sim.
- `Transfer`: reference (unique, e.g. TX0001), senderId, beneficiaryId, asset, sendAmount,
  feeCrypto, usdValue, usdToEtb, grossEtb, feeEtb, payoutEtb, status, txHash?, swissReference?,
  payoutReference?, failureReason?, rateTimestamp?, completedAt?. Relations: sender, beneficiary,
  wallet, auditLogs, notifications.
- `LiquidityPool`: type (unique), name; Swiss fields (chfBalance, usdBalance, incomingDeposits,
  pendingSettlements); Ethiopia fields (etbAvailable, etbReserved, etbDisbursed, etbCapacity).
- `LiquidityTransaction`: poolId, type, currency, amount, balanceAfter, referenceId?, note?
  (append-only ledger).
- `ExchangeRate`: usdToEtb, chfToEtb, source (default "MOCK"), createdAt. Latest row = active rate.
- `AuditLog`: actorId?, action, entityType, entityId?, transferId?, metadata (Json?).
- `Notification`: userId, type, message, data (Json?), transferId?, isRead.

### Module 2 — Auth (DONE)

Files: `apps/api/src/modules/auth/*`, middleware `apps/api/src/middleware/auth.ts`, request type
augmentation `apps/api/src/types/express.d.ts`. New model: `RefreshToken` (hashed, revocable).

**Endpoints** (all under `/api/auth`, standard envelope):
- `POST /register` → `201` `{ user: PublicUser, tokens: { accessToken, refreshToken } }`.
  Body: `{ firstName, lastName, email, phone, country, password(min 8) }`. `409` if email exists.
- `POST /login` → `200` `{ user, tokens }`. Body: `{ email, password }`. `401` on bad creds.
- `POST /refresh` → `200` `{ accessToken, refreshToken }`. Body: `{ refreshToken }`. Rotates token.
- `POST /logout` → `200` `{ loggedOut: true }`. Body: `{ refreshToken }`. Idempotent.
- `GET /me` (auth required) → `200` `{ user: PublicUser }`.

**`PublicUser`** = `{ id, firstName, lastName, email, phone, country, role, kycTier, kycStatus,
createdAt }` (never includes passwordHash). Exported helpers in `auth.service.ts`:
`toPublicUser`, `registerUser`, `loginUser`, `refreshTokens`, `logout`, `getUserById`.

Passwords hashed with bcryptjs (10 rounds). Other modules protect routes by importing
`authMiddleware` / `requireRole` from `../../middleware/auth.js`.

### Module 3 — KYC (DONE)

Files: `apps/api/src/modules/kyc/*`. Uploads via **multer** to `UPLOAD_DIR/kyc/` (default
`apps/api/uploads/kyc/`), served statically at `/uploads/kyc/<file>`. Allowed types: jpeg/png/webp/pdf,
max `MAX_UPLOAD_BYTES` (default 5 MB). Tier limits live in `kyc.limits.ts`.

**Tier monthly limits (USD)** — `TIER_1` 500, `TIER_2` 5000, `TIER_3` null (unlimited).

**User endpoints** (`/api/kyc`, auth required):
- `POST /submit` — **multipart/form-data**: file fields `passport`, `nationalId`, `selfie`
  (+ optional text fields `tier`, `proofOfAddressUrl`, `sourceOfFunds`). Falls back to JSON
  `*Url` fields if no files. Creates a PENDING `KycVerification`; sets user `kycStatus=PENDING`.
  → `201 { verification }`.
- `GET /status` → `{ verification|null, tier, status, limit: TransferLimit, tiers: [{tier, monthlyLimitUsd, requirements}] }`.
- `POST /tier` — body `{ tier }` → `{ verification }` (sets desired tier on pending record).

**Admin endpoints** (`/api/kyc`, `requireRole("ADMIN")`):
- `GET /pending` → `{ pending: [verification + user summary] }`.
- `POST /:id/approve` → approves; sets user `kycStatus=APPROVED`, `kycTier=verification.tier`.
- `POST /:id/reject` — body `{ reason }` → rejects; sets user `kycStatus=REJECTED`.

**Exported helper (Module 8 will use):** `getUserTransferLimit(userId): Promise<TransferLimit>`
from `kyc.service.ts`, where
`TransferLimit = { tier, kycStatus, unlimited, limitUsd: number|null, usedUsd: number, remainingUsd: number|null }`.
`usedUsd` = sum of `usdValue` of the user's `COMPLETED` transfers in the current calendar month.

### Module 4 — Beneficiaries (DONE)

Files: `apps/api/src/modules/beneficiaries/*`. All routes require `authMiddleware`; every query
is scoped to `req.user.id`.

**`PublicBeneficiary`** (response shape for Transfer + frontend modules):
`{ id, fullName, country, payoutMethod, bank, accountNumber, phoneNumber, isFavorite, createdAt, updatedAt }`.
Exported via `toPublicBeneficiary()` in `beneficiaries.service.ts`.

**Validation rules:**
- `payoutMethod=BANK` → `bank` (CBE | AWASH | DASHEN) and `accountNumber` required; `phoneNumber` cleared.
- `payoutMethod=TELEBIRR` → `phoneNumber` required; `bank` and `accountNumber` cleared.

**Endpoints** (`/api/beneficiaries`, auth required):
- `POST /` — create. Body:
  `{ fullName, country?, payoutMethod, bank?, accountNumber?, phoneNumber? }` → `201 { beneficiary }`.
- `GET /` → `{ beneficiaries: PublicBeneficiary[] }` (favorites first).
- `GET /:id` → `{ beneficiary }`. `404` if not owned by caller.
- `PUT /:id` — partial update; re-validates merged payout fields → `{ beneficiary }`.
- `DELETE /:id` → `{ deleted: true }`. `409` if linked to existing transfers.
- `POST /:id/favorite` — toggles `isFavorite` → `{ beneficiary }`.

### Module 5 — FX engine (DONE — Step 5.1)

Files: `apps/api/src/modules/fx/*`, mock route in `mock/mock.routes.ts`.
Uses latest `ExchangeRate` row (fallback defaults **132.5** USD/ETB, **151.2** CHF/ETB from PRD §9).

**Mock endpoint:** `GET /api/mock/fx-rate` → `{ usdToEtb, chfToEtb, timestamp }` (ISO string).

**Exported `fxService`** (`fx.service.ts`):
- `getCurrentRate(): Promise<FxRate>` — `{ usdToEtb, chfToEtb, timestamp, source }`, cached in-memory
  for `FX_CACHE_TTL_MS` (60s). `invalidateCache()` clears cache (for admin rate updates in Step 5.2).
- `quote(input): Promise<FxQuote>` — PRD §9 formula:
  `ETB = (cryptoAmount × cryptoToUsd × usdToEtb) − feeEtb`.

**`QuoteInput`:** `{ cryptoAmount, cryptoToUsd, feeMode }` where `feeMode` is one of:
- `{ type: "crypto", amount }` — fee deducted as crypto converted to ETB
- `{ type: "etb", amount }` — fixed ETB fee
- `{ type: "percent", percent }` — percentage of gross ETB

**`FxQuote`:** `{ grossEtb, feeEtb, payoutEtb, usdToEtb, rateTimestamp }` (ETB amounts rounded to 2 dp).

Example (seed rate 132.5): `quote({ cryptoAmount: 100, cryptoToUsd: 1, feeMode: { type: "etb", amount: 200 } })`
→ gross 13250, fee 200, payout 13050.

**Admin endpoint (Step 5.2):** `POST /api/admin/fx-rate` (`requireRole("ADMIN")`).
Body: `{ usdToEtb, chfToEtb, source? }` → `201 { usdToEtb, chfToEtb, timestamp, source }`.
Inserts a new `ExchangeRate` row and calls `fxService.invalidateCache()` so `getCurrentRate()` and
`GET /api/mock/fx-rate` reflect the change immediately.

- **Module 5 — FX:** ✅ complete (mock endpoint + fxService + admin rate update)

### Module 6 — Wallet & deposit simulation (DONE)

Files: `apps/api/src/modules/wallet/*`. All routes require `authMiddleware`. Does **not** move funds —
crypto confirmation is Module 7 (mock blockchain) + Module 9 (orchestrator).

**Exported helpers** (`wallet.service.ts`):
- `getOrCreateDepositAddress(userId, transferId, asset?)` → `{ depositAddress, created }`
- `getDepositInstructions(userId, transferId)` → `DepositInstructions`
- `generateMockAddress(userId, transferId, asset)` — deterministic `0x...` address

**`DepositAddress`:** `{ id, transferId, asset, address, createdAt }`.

**`DepositInstructions`:** `{ transferId, reference, asset, address, expectedAmount, network }`
(`expectedAmount` = transfer `sendAmount` as string; `network` = `"Ethereum"` for prototype).

**Endpoints** (`/api/wallet`, auth required):
- `POST /deposit-address` — body `{ transferId, asset? }`. Gets or creates wallet for the transfer
  (asset defaults to transfer asset; must match if provided). → `201` on create, `200` if exists.
  `{ depositAddress }`.
- `GET /transfers/:transferId/deposit-instructions` → `{ instructions: DepositInstructions }`
  (auto-creates wallet if missing).

### Module 7 — Mock external APIs (DONE)

Files: `apps/api/src/modules/mock/*`. Mock endpoints that simulate external systems return **PRD-shaped
JSON directly** (no standard API envelope), except `GET /fx-rate` which uses the envelope (Module 5).

**Blockchain (Step 7.1):** `POST /api/mock/blockchain/confirm`
- Body: `{ referenceId?, transferId?, txHash? }` (one of referenceId/transferId required)
- Response: `{ txHash, confirmations: 12, status: "CONFIRMED" }`
- Updates transfer `txHash` + status → `BLOCKCHAIN_CONFIRMED` when applicable.
- Emits `mockEvents` event `blockchain:confirmed` with `{ transferId, reference, txHash }` for Module 9.

**Swiss liquidity (Step 7.2):**
- `POST /api/mock/swiss/deposit-confirmation` — body `{ referenceId, asset, amount }`
  → `{ success, swissReference, status: "FUNDS_RECEIVED", receivedAmount, creditedAmount,
  creditedCurrency }`. New transfers credit the snapshotted CHF value; legacy transfers fall back
  to their snapshotted USD value.
- `GET /api/mock/swiss/balance` → `{ chfBalance, usdBalance }`
- `POST /api/mock/swiss/withdraw` — body `{ amount, currency?, referenceId? }`
  → `{ success, swissReference, status: "WITHDRAWN", amount, currency }`

**Ethiopian payouts (Step 7.3):** `POST /api/mock/payout/{cbe|awash|dashen|telebirr}`
- Body: `{ referenceId, amount, accountNumber? (banks), phone? (telebirr) }`
- Success: bank → `{ success: true, reference, status: "COMPLETED" }`;
  telebirr → `{ success: true, transactionId, status: "COMPLETED" }`
- Demo failure path: add query `?fail=true` (~15% random `success: false, status: "FAILED"`).

### Module 8 — Transfers (DONE — Steps 8.1 & 8.2)

Files: `apps/api/src/modules/transfers/*`. All routes require `authMiddleware`.

**Fee policy (PRD §6 Step 4):** USDC/USDT flat **2** crypto fee; ETH 1% (min 0.001 ETH).
Mock ETH/USD = 3500. Uses `fxService.quote()` with `{ type: "crypto", amount: feeCrypto }`.

**`TransferQuote`:** `{ asset, amount, beneficiaryId, cryptoToUsd, usdValue, usdToChf, chfAmount,
chfToEtb, usdToEtb, grossEtb, feeCrypto, feeEtb, payoutEtb, rateSource, rateTimestamp }`.
Rates come from the conversion providers and are snapshotted when the transfer is created.
The fee is converted through the same crypto→CHF→ETB path as the principal.

**`PublicTransfer`:** `{ id, reference, status, asset, sendAmount, feeCrypto, cryptoToUsd?,
usdValue, usdToChf?, chfAmount?, chfToEtb?, usdToEtb, grossEtb, feeEtb, payoutEtb, rateSource?,
txHash?, swissReference?, payoutReference?, failureReason?, rateTimestamp?, createdAt, updatedAt,
completedAt?, beneficiary: PublicBeneficiary, depositAddress: DepositAddress | null }`.
Amounts are decimal strings in responses; new snapshot fields are nullable for legacy transfers.

**Endpoints** (`/api/transfers`, auth required):
- `POST /quote` — body `{ asset, amount, beneficiaryId }` → `{ quote: TransferQuote }`.
  Validates beneficiary belongs to caller.
- `POST /` — creates transfer (`reference` e.g. `TX0001`), snapshots the accepted live conversion
  fields and creates both `Conversion` rows in the same database transaction, enforces KYC
  approval + monthly limit via `getUserTransferLimit`, creates deposit wallet, sets status
  `AWAITING_CRYPTO`. → `201 { transfer }`.
- `GET /` → `{ transfers: PublicTransfer[] }` (mine, newest first).
- `GET /:id` → `{ transfer }`.

### Module 9 — Orchestrator & timeline (DONE)

Files: `transfers.state-machine.ts`, `transfers.orchestrator.ts`, `transfers.events.ts`,
minimal `liquidity.service.ts` (reserve/release/disburse ETB), `audit/audit.service.ts`,
`notifications/notifications.service.ts`.

**State machine:** `transition(transferId, toStatus, meta?)` validates moves per
`ALLOWED_TRANSITIONS` (PRD §7 happy path + `FAILED` / `REVERSED` / `EXPIRED`), updates the
transfer, writes `AuditLog`, creates `Notification`, emits SSE event. `meta` may include
`actorId`, `txHash`, `swissReference`, `payoutReference`, `failureReason`, `note`.

**Orchestration:** `POST /api/transfers/:id/simulate-deposit` (auth, owner only) runs the demo flow:
`BLOCKCHAIN_PENDING` → `BLOCKCHAIN_CONFIRMED` → Swiss credit → `SWISS_FUNDS_RECEIVED` →
`FX_CONVERTED` → reserve ETB → `PAYOUT_PROCESSING` → mock payout → `PAYOUT_SENT` → disburse ETB →
`COMPLETED`. On failure: release reserved ETB + `FAILED`.

**Timeline:** `GET /api/transfers/:id/timeline` → `{ timeline: [{ id, action, entityType, metadata, createdAt }] }`.

**SSE:** `GET /api/transfers/:id/events` streams `TransferStatusEvent`:
`{ transferId, reference, status, timestamp, metadata? }`. Auth via Bearer or `?accessToken=`.

- **Module 9 — State machine / event payload:** ✅ see above
- **Module 10 — Liquidity functions:** ✅ see below

### Module 10 — Liquidity management (DONE)

Files: `apps/api/src/modules/liquidity/*`. Core service exported as **`liquidityService`**.

**Functions** (each writes a `LiquidityTransaction` ledger row):
- `creditSwiss({ amount, currency: "USD"|"CHF", referenceId, note?, trackIncomingDeposit? })`
  → `{ balanceAfter }`. USD credits also increment `incomingDeposits` by default.
- `reserveEtb(amount, referenceId)` — moves ETB from available → reserved.
- `releaseEtb(amount, referenceId)` — reverses a reserve on failure.
- `disburseEtb(amount, referenceId)` — marks reserved ETB as disbursed.

**Admin endpoints** (`/api/liquidity`, `requireRole("ADMIN")`):
- `GET /pools` → `{ pools: { swiss: {...}, ethiopia: {...} }, alerts: { lowLiquidityWarning, reasons[] } }`.
  Alert when `etbAvailable < 500,000` OR `etbAvailable < 20%` of `etbCapacity`.
- `GET /ledger?limit=100` → `{ ledger: [{ id, date, poolType, poolName, type, currency, amount, balance, referenceId, note }] }`.

### Module 11 — Audit log & notifications (DONE)

**Audit** (`apps/api/src/modules/audit/audit.service.ts`):
- `logEvent({ actorId?, action, entityType, entityId?, transferId?, metadata? })` — exported for all modules.
- Transfer status changes logged via Module 9 `transition()`. Admin actions logged for FX rate updates and KYC approve/reject.
- `GET /api/admin/audit` (admin) — query filters: `entityType`, `transferId`, `actorId`, `action`, `limit`.
  → `{ audit: [{ id, actorId, action, entityType, entityId, transferId, metadata, createdAt }] }`.

**Notifications** (`apps/api/src/modules/notifications/*`):
- `notify({ userId, type?, message, transferId?, data? })` — created on transfer status changes (Module 9).
- **`PublicNotification`:** `{ id, type, message, data, transferId, isRead, createdAt }`.
- `GET /api/notifications?limit=50` (auth) → `{ notifications: PublicNotification[] }`.
- `POST /api/notifications/:id/read` (auth) → `{ notification }`.

### Module 12 — Web frontend foundation (DONE — Step 12.1)

Stack: `apps/web` Next.js 16 (App Router) + React 19 + Tailwind v4. Path alias `@/*` → `src/*`.
Env: `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`) in `apps/web/.env.local`.

**API client** (`src/lib/api/`):
- `client.ts` — `api.get/post/put/delete<T>(path, body?, auth=true)`. Unwraps the standard
  envelope and returns `data` directly; throws `ApiError { status, code, message, details }` on
  `success:false`. Attaches `Authorization: Bearer <accessToken>`. On `401` it auto-calls
  `/api/auth/refresh` once (deduped), stores rotated tokens, and replays the request.
- `tokenStore.ts` — `localStorage` keys `cr_access_token` / `cr_refresh_token`; `get*/set/clear`.
- `types.ts` — shared FE types: `ApiEnvelope<T>`, `PublicUser`, `AuthTokens`, `AuthResult`,
  `RegisterPayload`, `LoginPayload`, plus enums (`Role`, `KycTier`, `KycStatus`, `TransferStatus`,
  `AssetType`, `PayoutMethod`, `BankName`). Keep in sync with backend shapes.
- `auth.ts` — `authApi.register/login/me/logout` (register & login persist tokens).

**Auth context** (`src/lib/auth/AuthContext.tsx`): `AuthProvider` (wraps app in root layout) +
`useAuth()` → `{ user, loading, login, register, logout, refresh }`. Loads `/me` on mount when a
token exists.

**Guards & routing:**
- `src/components/auth/RouteGuard.tsx` — redirects unauthenticated users to `/login`.
- Route groups: `(auth)` → `/login`, `/register` (redirect to `/dashboard` if already signed in);
  `(dashboard)` → guarded + wrapped in `AppShell`. `/` redirects to `/dashboard`.

**Layout & UI primitives:**
- `src/components/layout/` — `AppShell` (responsive sidebar + topbar), `Sidebar` (nav from
  `nav.tsx`, role-filtered via `item.roles`), `Topbar` (user/KYC badge + sign out).
- `src/components/ui/` — `Button`, `Input`, `Card` (+ `CardHeader/Title/Content`), `Badge`,
  `Alert`. `src/lib/utils.ts` — `cn`, `formatEtb`, `formatAsset`, `humanize`.
- Add new nav links in `nav.tsx`; admin-only items set `roles: ["ADMIN"]`.

### Module 12 — Web frontend (Step 12.2 DONE — KYC & beneficiaries UI)

**API modules:**
- `src/lib/api/kyc.ts` — `kycApi.getStatus()`, `chooseTier(tier)`, `submit(payload)` (multipart via
  `api.upload` with fields `passport`, `nationalId`, `selfie`, plus optional `tier`,
  `proofOfAddressUrl`, `sourceOfFunds`).
- `src/lib/api/beneficiaries.ts` — `list`, `get`, `create`, `update`, `remove`, `toggleFavorite`.
- `client.ts` — added `api.upload(path, formData)` for multipart POST with JWT + envelope unwrap.

**FE types** (`types.ts`): `PublicKycVerification`, `KycStatusResponse`, `TransferLimit`, `TierInfo`,
`SubmitKycPayload`, `PublicBeneficiary`, `CreateBeneficiaryPayload`, `UpdateBeneficiaryPayload`.

**Pages:**
- `/kyc` — tier cards with limits/requirements, monthly limit usage bar, status badges
  (pending/approved/rejected), document upload (passport, national ID, selfie), Tier 3 text fields,
  submitted-doc links via `uploadUrl()`. Submit blocked when approved or pending review with docs.
- `/beneficiaries` — list (favorites first), star toggle, add/edit modal form, delete with confirm.
  Form switches BANK (CBE/Awash/Dashen + account) vs TELEBIRR (phone) fields.

**Shared UI added:** `Select`, `FileInput`, `Modal`, `PageStates` (header/loading/empty/error).
Utils: `formatUsd`, `uploadUrl`.

### Module 12 — Web frontend (Step 12.3 DONE — Create transfer flow)

**API module:** `src/lib/api/transfers.ts` — `quote`, `create`, `get`, `list`, `simulateDeposit`.

**FE types:** `TransferQuote`, `TransferQuotePayload`, `PublicTransfer`, `DepositAddress`.

**Page:** `/transfers/new` — 4-step wizard:
1. **Recipient** — pick beneficiary (loads `/api/beneficiaries`).
2. **Amount** — asset toggle (USDC/USDT/ETH) + amount input; **live quote** via debounced
   `POST /api/transfers/quote` (400ms), shown in sticky `QuotePanel` (PRD §6 Step 4 format:
   amount = gross ETB, fee, recipient gets, 100 {asset} ≈ X ETB).
3. **Review** — summary + `POST /api/transfers` (blocks if KYC not approved).
4. **Deposit** — shows reference, deposit address (copy), recipient ETB; **"I've deposited
   (simulate)"** → `POST /api/transfers/:id/simulate-deposit`; polls status until COMPLETED/FAILED.

**Components:** `WizardStepper`, `QuotePanel`. Hook: `useDebouncedValue`.

### Module 12 — Web frontend (Step 12.4 DONE — Transfer timeline & list)

**API extensions** (`transfers.ts`):
- `getTimeline(id)` → audit timeline entries.
- `subscribeEvents(id, onEvent, onError?)` — SSE via `EventSource` + `?accessToken=` (Module 9).

**Types:** `TransferStatusEvent`, `TimelineEntry`.

**Pages:**
- `/transfers` — table of user's transfers (reference, recipient, amount, payout ETB, status badge,
  date) with link to detail. Empty/loading/error states.
- `/transfers/[id]` — summary card (recipient, payout, amounts, failure reason) + **live timeline**
  (PRD §7 steps with timestamps, color-coded states). Green pulse **Live** indicator when SSE connected.

**Shared:** `TransferTimeline`, `TransferStatusBadge`, `useTransferTimeline` hook,
`lib/transfers/status.ts` (lifecycle steps, `statusTone`, `getStepState`, `parseTimelineAction`).

Timeline merges initial audit log + SSE events; steps show completed / in-progress / pending / failed.

### Module 13 — Admin dashboard (Step 13.1 DONE)

**Backend** (`apps/api/src/modules/admin/admin.stats.service.ts`):
- `GET /api/admin/stats` (`requireRole("ADMIN")`) → `{ stats: AdminStats }`:
  - `totalTransfers` — all transfers count
  - `totalEtbPaid` — sum `payoutEtb` for `COMPLETED`
  - `totalCryptoReceivedUsd` — sum `usdValue` for on-chain-confirmed+ statuses
  - `swissLiquidity` — `{ usdBalance, chfBalance }`
  - `ethiopiaLiquidity` — `{ etbAvailable, etbReserved, etbCapacity }`
  - `activeUsers` — count of `SENDER` role users

**Frontend** (`apps/web`):
- `AdminGuard` — redirects non-admins to `/dashboard`; wraps `(dashboard)/admin/*` layout.
- `adminApi.getStats()` — consumes `/api/admin/stats`.
- `/admin` — KPI cards (PRD §12) + quick links to KYC / liquidity / audit.
- Sidebar **Admin** nav item (`roles: ["ADMIN"]` only).

### Module 13 — Admin dashboard (Step 13.2 DONE — Transactions & liquidity)

**Backend admin transfers** (`admin.transfers.service.ts`):
- `GET /api/admin/transfers` — query: `status?`, `asset?`, `reference?`, `limit?` (default 50).
  → `{ transfers: AdminTransfer[] }` with `sender { id, name, email }` + beneficiary snapshot.
- `GET /api/admin/transfers/:id` → `{ transfer }`.
- `POST /api/admin/transfers/:id/override` — body `{ action: "reverse"|"complete", note? }`.
  Failed transfers only. `reverse` → `REVERSED` via state machine; `complete` → admin force
  `COMPLETED` with audit `ADMIN_TRANSFER_OVERRIDE_*`.

**Frontend pages:**
- `/admin/transactions` — filterable table (reference, sender, recipient, amount, asset, status,
  date). Row opens **drawer** with details; failed transfers show override actions.
- `/admin/liquidity` — Swiss + Ethiopia **pool widgets**, **LOW LIQUIDITY WARNING** banner (from
  `GET /api/liquidity/pools` alerts), **ledger table** via `GET /api/liquidity/ledger`.

**API modules:** `adminApi.listTransfers/getTransfer/overrideTransfer`, `liquidityApi.getPools/getLedger`.
**UI:** `Drawer` component for admin transfer detail.

### Module 13 — Admin dashboard (Step 13.3 DONE — KYC & controls)

**KYC admin API** (`kycApi`): `listPending()`, `approve(id)`, `reject(id, reason)` →
`/api/kyc/pending`, `POST /:id/approve`, `POST /:id/reject`.

**FX / admin API:** `fxApi.getCurrentRate()` → `GET /api/mock/fx-rate`;
`adminApi.updateFxRate({ usdToEtb, chfToEtb, source? })` → `POST /api/admin/fx-rate`.

**Pages:**
- `/admin/kyc` — pending queue cards; review drawer with document links, approve/reject + reason.
- `/admin/controls` — FX rate form (loads current rate, posts admin update); failed transfers list
  with shared `TransferDetailDrawer` override (reverse / force complete).

**Shared:** `TransferDetailDrawer` extracted for transactions + controls pages.

### Module 14 — Conversion service (DONE — Backend)

Files: `apps/api/src/modules/conversions/*`. The module adds explicit conversion snapshots for the
new Swiss liquidity flow while preserving the existing transfer quote fields. Providers are isolated
under `providers/` so external API changes do not leak into transfer/orchestration code.

**Providers:**
- Crypto prices: CoinGecko simple price (`COINGECKO_DEMO_API_KEY` optional). Prototype fallbacks:
  USDC/USDT = 1 USD, ETH = 3500 USD.
- Fiat rates: ExchangeRate-API open endpoint (`USD` base). If unavailable, falls back to the latest
  local `ExchangeRate` row (`usdToEtb`, `chfToEtb`) and derives `usdToChf = usdToEtb / chfToEtb`.
- Config: `CONVERSION_RATE_CACHE_TTL_MS` (default 60000), `CONVERSION_REQUEST_TIMEOUT_MS`
  (default 8000).

**Prisma:** New `Conversion` model with unique `(transferId, type)` and enums:
- `ConversionType`: `CRYPTO_TO_CHF`, `CHF_TO_ETB`
- `ConversionStatus`: `PENDING`, `COMPLETED`, `FAILED`

**Endpoints** (`/api/conversions`):
- `GET /crypto-to-chf/rate?asset=USDC` → `{ asset, usdRate, usdToChf, chfRate, source, fetchedAt }`.
- `POST /crypto-to-chf` (auth) body `{ transferId, asset, cryptoAmount }`
  → `{ transferId, asset, cryptoAmount, marketRate, chfAmount, source, convertedAt }`.
- `GET /chf-to-etb/rate` → `{ from: "CHF", to: "ETB", rate, usdToChf, usdToEtb, source, fetchedAt }`.
- `POST /chf-to-etb` (auth) body `{ transferId, chfAmount }`
  → `{ transferId, chfAmount, rate, etbAmount, source, convertedAt }`.

**Conversion visibility endpoints:**
- `GET /api/transfers/:id/conversion-status` (auth, owner only) →
  `{ conversionStatus: { transferId, reference, transferStatus, asset, sendAmount, payoutEtb,
  rateSource, rateTimestamp, cryptoToChf, chfToEtb } }`.
- Each conversion contains `{ id, transferId, type, status, fromCurrency, toCurrency, fromAmount,
  toAmount, rate, source, fetchedAt, createdAt, updatedAt }`; decimal values are strings.
- `GET /api/admin/conversions` (admin) supports `transferId`, `type`, `status`, `source`, `asset`,
  `dateFrom`, `dateTo`, and `limit` filters. Returns conversion rows with transfer, sender, and
  beneficiary context.
- `GET /api/admin/conversions/:id` (admin) returns one conversion with the same related context.

**Authoritative settlement integration:**
- `POST /api/transfers/quote` uses live conversion-provider rates.
- Transfer creation stores the accepted crypto/USD, USD/CHF, CHF amount, CHF/ETB, ETB amounts,
  provider source, and timestamp; it also creates both conversion records atomically.
- Explicit conversion POST endpoints return existing transfer snapshots instead of replacing them
  with newer rates.
- Swiss liquidity is credited with the stored CHF amount (USD fallback for legacy transfers).
- The orchestrator reserves and pays the stored `transfer.payoutEtb`, so quote, fee, reserve, and
  payout use one consistent snapshot.

**Automated tests:** `cd api && npm test`
- Provider tests mock HTTP responses for CoinGecko and ExchangeRate-API.
- Coverage includes provider success, stablecoin fallback, crypto/fiat cache behavior, CHF/ETB
  derivation, authoritative quote/fee math, accepted snapshot reuse, and sender ownership checks.
- Tests use narrow injected dependencies for service boundaries; production calls still default to
  the real Prisma client and rate providers.


