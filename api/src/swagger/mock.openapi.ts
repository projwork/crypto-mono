/** Mock external APIs module paths and schemas for the OpenAPI spec. */

export const mockSchemas = {
  MockFxRateResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          usdToEtb: { type: "number", example: 132.5 },
          chfToEtb: { type: "number", example: 151.2 },
          timestamp: { type: "string", format: "date-time" },
        },
      },
    },
  },
  BlockchainConfirmRequest: {
    type: "object",
    properties: {
      referenceId: { type: "string", example: "TX0001" },
      transferId: { type: "string" },
      txHash: { type: "string" },
    },
    description: "At least one of `referenceId` or `transferId` is required.",
  },
  BlockchainConfirmResponse: {
    type: "object",
    properties: {
      txHash: { type: "string", example: "0xabc123..." },
      confirmations: { type: "integer", example: 12 },
      status: { type: "string", enum: ["CONFIRMED"] },
    },
  },
  SwissDepositRequest: {
    type: "object",
    required: ["referenceId", "asset", "amount"],
    properties: {
      referenceId: { type: "string", example: "TX0001" },
      asset: { $ref: "#/components/schemas/AssetType" },
      amount: { type: "number", example: 100 },
    },
  },
  SwissDepositResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      swissReference: { type: "string", example: "SW-REF-001" },
      status: { type: "string", example: "FUNDS_RECEIVED" },
      receivedAmount: { type: "number", example: 100 },
    },
  },
  SwissBalanceResponse: {
    type: "object",
    properties: {
      chfBalance: { type: "number", example: 500000 },
      usdBalance: { type: "number", example: 250000 },
    },
  },
  SwissWithdrawRequest: {
    type: "object",
    required: ["amount"],
    properties: {
      amount: { type: "number", example: 1000 },
      currency: { type: "string", enum: ["USD", "CHF"], default: "USD" },
      referenceId: { type: "string" },
    },
  },
  SwissWithdrawResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      swissReference: { type: "string" },
      status: { type: "string", example: "WITHDRAWN" },
      amount: { type: "number" },
      currency: { type: "string", example: "USD" },
    },
  },
  PayoutRequest: {
    type: "object",
    required: ["referenceId", "amount"],
    properties: {
      referenceId: { type: "string", example: "TX0001" },
      amount: { type: "number", example: 13050 },
      accountNumber: { type: "string", example: "1000123456789" },
      phone: { type: "string", example: "251912345678" },
    },
  },
  PayoutBankResponse: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      reference: { type: "string" },
      status: { type: "string", enum: ["COMPLETED", "FAILED"] },
    },
  },
  PayoutTelebirrResponse: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      transactionId: { type: "string" },
      status: { type: "string", enum: ["COMPLETED", "FAILED"] },
    },
  },
} as const;

const payoutPath = (bank: string, tag: string) => ({
  post: {
    tags: ["Mock — Payouts"],
    summary: `Mock ${tag} payout`,
    description:
      "Simulates Ethiopian bank/Telebirr payout. Add `?fail=true` to force a demo failure (~15% random failure when enabled).",
    security: [],
    parameters: [
      {
        name: "fail",
        in: "query",
        required: false,
        schema: { type: "boolean" },
        description: "Force failure path for demo",
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/PayoutRequest" },
        },
      },
    },
    responses: {
      "200": {
        description: "Payout result (raw JSON, no API envelope)",
        content: {
          "application/json": {
            schema:
              bank === "telebirr"
                ? { $ref: "#/components/schemas/PayoutTelebirrResponse" }
                : { $ref: "#/components/schemas/PayoutBankResponse" },
          },
        },
      },
      "400": {
        description: "Validation error",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
        },
      },
    },
  },
});

export const mockPaths = {
  "/api/mock/fx-rate": {
    get: {
      tags: ["Mock — FX"],
      summary: "Get current FX rate (mock)",
      description: "Uses the standard API envelope. Reflects latest exchange rate.",
      security: [],
      responses: {
        "200": {
          description: "Current FX rate",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MockFxRateResponse" },
            },
          },
        },
      },
    },
  },
  "/api/mock/blockchain/confirm": {
    post: {
      tags: ["Mock — Blockchain"],
      summary: "Confirm blockchain deposit",
      description:
        "Simulates on-chain confirmation. Returns PRD-shaped JSON directly (no envelope).",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/BlockchainConfirmRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Deposit confirmed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BlockchainConfirmResponse" },
            },
          },
        },
        "400": {
          description: "Validation error",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
      },
    },
  },
  "/api/mock/swiss/deposit-confirmation": {
    post: {
      tags: ["Mock — Swiss"],
      summary: "Swiss deposit confirmation",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/SwissDepositRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Funds received",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SwissDepositResponse" },
            },
          },
        },
        "400": {
          description: "Validation error",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
      },
    },
  },
  "/api/mock/swiss/balance": {
    get: {
      tags: ["Mock — Swiss"],
      summary: "Swiss liquidity balance",
      security: [],
      responses: {
        "200": {
          description: "Pool balances",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SwissBalanceResponse" },
            },
          },
        },
      },
    },
  },
  "/api/mock/swiss/withdraw": {
    post: {
      tags: ["Mock — Swiss"],
      summary: "Swiss withdraw",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/SwissWithdrawRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Withdrawal processed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SwissWithdrawResponse" },
            },
          },
        },
        "400": {
          description: "Validation error",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
      },
    },
  },
  "/api/mock/payout/cbe": payoutPath("cbe", "CBE"),
  "/api/mock/payout/awash": payoutPath("awash", "Awash"),
  "/api/mock/payout/dashen": payoutPath("dashen", "Dashen"),
  "/api/mock/payout/telebirr": payoutPath("telebirr", "Telebirr"),
} as const;
