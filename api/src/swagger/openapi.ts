import { authPaths, authSchemas } from "./auth.openapi.js";
import { kycPaths, kycSchemas } from "./kyc.openapi.js";
import { conversionPaths, conversionSchemas } from "./conversions.openapi.js";
import { transferPaths, transferSchemas } from "./transfers.openapi.js";
import { liquidityPaths, liquiditySchemas } from "./liquidity.openapi.js";

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
 * Combined OpenAPI 3.0 spec for Auth (Module 2), KYC (Module 3), Conversions, Transfers, and Liquidity.
 * Served at GET /api/docs and GET /api/docs/openapi.json.
 */
export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title:
      "Crypto Remittance API — Auth, KYC, Conversions, Transfers & Liquidity",
    version: "0.1.0",
    description:
      "Interactive API docs for **Auth** (token generation), **KYC** (verification), **Conversions** (rates & exchange), **Transfers** (remittance orchestration), and **Liquidity** (fund management).\n\n" +
      "All responses use the shared envelope: `{ success: true, data: ... }` or " +
      "`{ success: false, error: { code, message, details? } }`.\n\n" +
      "### How to authenticate in Swagger\n" +
      "1. Call **POST /api/auth/login** with a demo account (e.g. `abel@diaspora.test` / `Password123!`).\n" +
      "2. Copy `data.tokens.accessToken` from the response.\n" +
      "3. Click the green **Authorize** button (top right).\n" +
      "4. Paste the token only (Swagger adds the `Bearer` prefix automatically).\n" +
      "5. Call protected endpoints (KYC, conversions, transfers, liquidity, GET /api/auth/me, etc.).\n\n" +
      "**Admin endpoints** (Liquidity) require logging in as `admin@remittance.test`.",
  },
  servers: [
    { url: "http://localhost:4000", description: "Local development" },
    { url: "/", description: "Current host (relative)" },
  ],
  tags: [
    {
      name: "Auth",
      description: "Registration, login, token refresh, and profile",
    },
    {
      name: "KYC — User",
      description: "Sender KYC endpoints (Bearer token required)",
    },
    {
      name: "KYC — Admin",
      description: "Admin KYC review (Bearer token + ADMIN role)",
    },
    {
      name: "Conversions",
      description:
        "Crypto-to-CHF and CHF-to-ETB conversion rates and execution",
    },
    {
      name: "Transfers",
      description:
        "Initiate, track, and manage cryptocurrency remittance transfers",
    },
    {
      name: "Liquidity",
      description:
        "Manage liquidity pools and view transaction ledger (Admin only)",
    },
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
      ...authSchemas,
      ...kycSchemas,
      ...conversionSchemas,
      ...transferSchemas,
      ...liquiditySchemas,
    },
  },
  paths: {
    ...authPaths,
    ...kycPaths,
    ...conversionPaths,
    ...transferPaths,
    ...liquidityPaths,
  },
} as const;
