# API — Crypto-to-ETB Remittance Backend

Node.js + Express + TypeScript backend for the crypto-to-ETB remittance prototype.
This is the **foundation skeleton** (Module 0). Feature modules are stubbed and ready to be
filled in following `../../PROMPTS.md`.

## Stack

- Node.js (ES modules) + Express 4
- TypeScript (strict)
- `tsx` for dev/watch
- `zod` for validation, `morgan` for request logging, `cors` for CORS
- PostgreSQL + Prisma ORM (added in Module 1)

## Setup

```bash
cd apps/api
npm install
cp .env.example .env   # then edit values
npm run dev
```

The server starts on `http://localhost:4000` by default.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start in watch mode (tsx) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build |
| `npm run typecheck` | Type-check without emitting |
| `npm run lint` | Lint `src/**/*.ts` |

## Verify it's running

```bash
curl http://localhost:4000/health
curl http://localhost:4000/api
curl http://localhost:4000/api/auth
```

`/health` returns service status; `/api` lists mounted module prefixes; each module prefix
currently returns `{ "module": "<name>", "status": "not_implemented" }`.

## Folder layout

```
src/
  config/          # env loading (config object)
  lib/
    apiResponse.ts # ok()/fail()/sendOk()/sendFail() + AppError
  middleware/
    asyncHandler.ts
    notFound.ts
    errorHandler.ts
  modules/         # one folder per feature module (stubbed routers)
    auth/ kyc/ beneficiaries/ wallet/ transfers/
    liquidity/ notifications/ admin/ mock/
  routes/
    index.ts       # mounts every module router under its prefix
  app.ts           # builds the Express app (middleware + routes)
  index.ts         # server entry point
```

## Shared contract

All responses use the standard envelope and route prefixes documented in
[`../../CONTRACTS.md`](../../CONTRACTS.md). Do not change shared shapes without updating that file.
