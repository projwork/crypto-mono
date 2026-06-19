import { authPaths, authSchemas } from "./auth.openapi.js";
import { kycPaths, kycSchemas } from "./kyc.openapi.js";
import { conversionPaths, conversionSchemas } from "./conversions.openapi.js";
import { transferPaths, transferSchemas } from "./transfers.openapi.js";
import { liquidityPaths, liquiditySchemas } from "./liquidity.openapi.js";
import { beneficiariesPaths, beneficiariesSchemas } from "./beneficiaries.openapi.js";
import { walletPaths, walletSchemas } from "./wallet.openapi.js";
import { notificationsPaths, notificationsSchemas } from "./notifications.openapi.js";
import { adminPaths, adminSchemas } from "./admin.openapi.js";
import { mockPaths, mockSchemas } from "./mock.openapi.js";

const commonSchemas = {
  ErrorEnvelope: {
    type: "object",
    required: ["success", "error"],
    properties: {
      success: { type: "boolean", enum: [false] },
      error: {
        type: "object",
        required: ["code", "message"],
        properties: {
          code: { type: "string", example: "BAD_REQUEST" },
          message: { type: "string", example: "Validation failed" },
          details: {},
        },
      },
    },
  },
} as const;

/**
 * Combined OpenAPI 3.0 spec for the crypto-remittance API.
 * Served at GET /api/docs and GET /api/docs/openapi.json.
 */
export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Crypto Remittance API",
    version: "0.1.0",
    description:
      "Interactive API docs for the crypto-remittance prototype.\n\n" +
      "All standard endpoints use the envelope: `{ success: true, data: ... }` or " +
      "`{ success: false, error: { code, message, details? } }`.\n\n" +
      "Mock external APIs (`/api/mock/*`) return PRD-shaped JSON directly, except `GET /api/mock/fx-rate`.\n\n" +
      "### Authentication\n" +
      "1. Call **POST /api/auth/login** (e.g. `abel@diaspora.test` / `Password123!`).\n" +
      "2. Copy `data.tokens.accessToken`.\n" +
      "3. Click **Authorize** and paste the token (Swagger adds `Bearer` automatically).\n" +
      "4. Call protected endpoints.\n\n" +
      "**Admin routes** (`/api/admin/*`, some `/api/kyc/*`, `/api/liquidity/*`) require " +
      "`admin@remittance.test` (ADMIN role).",
  },
  servers: [
    { url: "http://localhost:4000", description: "Local development" },
    { url: "/", description: "Current host (relative)" },
  ],
  tags: [
    { name: "Auth", description: "Registration, login, token refresh, and profile" },
    { name: "KYC — User", description: "Sender KYC (Bearer token required)" },
    { name: "KYC — Admin", description: "Admin KYC review (Bearer + ADMIN role)" },
    { name: "Beneficiaries", description: "Payout recipient directory (Bearer token)" },
    { name: "Wallet", description: "Deposit addresses and MetaMask connect (Bearer token)" },
    { name: "Conversions", description: "Crypto-to-CHF and CHF-to-ETB rates and execution" },
    { name: "Transfers", description: "Remittance transfer lifecycle" },
    { name: "Liquidity", description: "Liquidity pools and ledger (Admin)" },
    { name: "Notifications", description: "User notifications (Bearer token)" },
    { name: "Admin", description: "Dashboard, treasury, audit, FX controls (Bearer + ADMIN)" },
    { name: "Mock — FX", description: "Mock FX rate (no auth)" },
    { name: "Mock — Blockchain", description: "Mock on-chain confirmation (no auth)" },
    { name: "Mock — Swiss", description: "Mock Swiss liquidity bank (no auth)" },
    { name: "Mock — Payouts", description: "Mock Ethiopian payouts (no auth)" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "JWT access token from POST /api/auth/login → `data.tokens.accessToken`. " +
          "Enter the token value only in Authorize (no `Bearer` prefix).",
      },
    },
    schemas: {
      ...commonSchemas,
      ...conversionSchemas,
      ...transferSchemas,
      ...kycSchemas,
      ...authSchemas,
      ...beneficiariesSchemas,
      ...walletSchemas,
      ...notificationsSchemas,
      ...liquiditySchemas,
      ...adminSchemas,
      ...mockSchemas,
    },
  },
  paths: {
    ...authPaths,
    ...kycPaths,
    ...beneficiariesPaths,
    ...walletPaths,
    ...conversionPaths,
    ...transferPaths,
    ...liquidityPaths,
    ...notificationsPaths,
    ...adminPaths,
    ...mockPaths,
  },
} as const;
