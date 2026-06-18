/** Liquidity module paths and schemas for the OpenAPI spec. */

export const liquiditySchemas = {
  LiquidityPoolType: {
    type: "string",
    enum: ["SWISS", "ETHIOPIA"],
    description: "Type of liquidity pool",
  },
  LiquidityTransactionType: {
    type: "string",
    enum: ["CREDIT", "DEBIT", "RESERVE", "RELEASE", "DISBURSE", "SETTLEMENT"],
    description: "Type of liquidity transaction",
  },
  LiquidityPool: {
    type: "object",
    required: [
      "id",
      "type",
      "name",
      "chfBalance",
      "usdBalance",
      "etbAvailable",
      "etbReserved",
      "etbDisbursed",
    ],
    properties: {
      id: { type: "string", example: "pool_swiss_001" },
      type: { $ref: "#/components/schemas/LiquidityPoolType" },
      name: { type: "string", example: "Swiss Liquidity Pool" },
      // Swiss pool balances
      chfBalance: {
        type: "number",
        format: "double",
        example: 50000.0,
        description: "Available Swiss Francs in the pool",
      },
      usdBalance: {
        type: "number",
        format: "double",
        example: 55000.0,
        description: "Available US Dollars in the pool",
      },
      incomingDeposits: {
        type: "number",
        format: "double",
        example: 10000.0,
        description: "Incoming deposits awaiting settlement",
      },
      pendingSettlements: {
        type: "number",
        format: "double",
        example: 5000.0,
        description: "Pending settlement amounts",
      },
      // Ethiopia pool balances
      etbAvailable: {
        type: "number",
        format: "double",
        example: 3000000.0,
        description: "Available Ethiopian Birr",
      },
      etbReserved: {
        type: "number",
        format: "double",
        example: 500000.0,
        description: "Reserved ETB for pending transfers",
      },
      etbDisbursed: {
        type: "number",
        format: "double",
        example: 1000000.0,
        description: "Total ETB already disbursed",
      },
      etbCapacity: {
        type: "number",
        format: "double",
        example: 5000000.0,
        description: "Total capacity of ETB pool",
      },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  PoolsSnapshot: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          swiss: { $ref: "#/components/schemas/LiquidityPool" },
          ethiopia: { $ref: "#/components/schemas/LiquidityPool" },
          timestamp: {
            type: "string",
            format: "date-time",
            description: "When this snapshot was created",
          },
        },
      },
    },
  },
  LiquidityTransaction: {
    type: "object",
    required: [
      "id",
      "poolId",
      "type",
      "currency",
      "amount",
      "balanceAfter",
      "createdAt",
    ],
    properties: {
      id: { type: "string", example: "ltx_123456" },
      poolId: { type: "string", example: "pool_swiss_001" },
      type: { $ref: "#/components/schemas/LiquidityTransactionType" },
      currency: {
        type: "string",
        enum: ["CHF", "USD", "ETB"],
        example: "CHF",
      },
      amount: {
        type: "number",
        format: "double",
        example: 5000.0,
        description: "Transaction amount",
      },
      balanceAfter: {
        type: "number",
        format: "double",
        example: 55000.0,
        description: "Pool balance after this transaction",
      },
      referenceId: {
        type: "string",
        nullable: true,
        example: "TX000001",
        description:
          "Reference to the transfer or settlement this transaction is tied to",
      },
      note: {
        type: "string",
        nullable: true,
        example: "Crypto deposit received for TX000001",
        description: "Human-readable note about the transaction",
      },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  LiquidityLedger: {
    type: "array",
    items: { $ref: "#/components/schemas/LiquidityTransaction" },
  },
  LedgerResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          ledger: { $ref: "#/components/schemas/LiquidityLedger" },
        },
      },
    },
  },
} as const;

export const liquidityPaths = {
  "/api/liquidity/pools": {
    get: {
      tags: ["Liquidity"],
      summary: "Get liquidity pools snapshot",
      description:
        "Retrieve current balances for both Swiss and Ethiopia liquidity pools.\n\n" +
        "**Admin only** — Bearer token + ADMIN role required.\n\n" +
        "**Swiss Pool** tracks:\n" +
        "- CHF balance (Swiss Francs available)\n" +
        "- USD balance (US Dollars available)\n" +
        "- Incoming deposits (awaiting settlement)\n" +
        "- Pending settlements\n\n" +
        "**Ethiopia Pool** tracks:\n" +
        "- ETB Available (ready to disburse)\n" +
        "- ETB Reserved (held for pending transfers)\n" +
        "- ETB Disbursed (total paid out)\n" +
        "- ETB Capacity (pool limit)",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": {
          description: "Pools snapshot retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PoolsSnapshot" },
              example: {
                success: true,
                data: {
                  swiss: {
                    id: "pool_swiss_001",
                    type: "SWISS",
                    name: "Swiss Liquidity Pool",
                    chfBalance: 50000.0,
                    usdBalance: 55000.0,
                    incomingDeposits: 10000.0,
                    pendingSettlements: 5000.0,
                    etbAvailable: 0,
                    etbReserved: 0,
                    etbDisbursed: 0,
                    etbCapacity: 0,
                    createdAt: "2026-01-15T10:00:00.000Z",
                    updatedAt: "2026-06-18T10:30:00.000Z",
                  },
                  ethiopia: {
                    id: "pool_eth_001",
                    type: "ETHIOPIA",
                    name: "Ethiopia Liquidity Pool",
                    chfBalance: 0,
                    usdBalance: 0,
                    incomingDeposits: 0,
                    pendingSettlements: 0,
                    etbAvailable: 3000000.0,
                    etbReserved: 500000.0,
                    etbDisbursed: 1000000.0,
                    etbCapacity: 5000000.0,
                    createdAt: "2026-01-15T10:00:00.000Z",
                    updatedAt: "2026-06-18T10:30:00.000Z",
                  },
                  timestamp: "2026-06-18T10:30:00.000Z",
                },
              },
            },
          },
        },
        "401": {
          description: "Missing or invalid Bearer token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorEnvelope" },
            },
          },
        },
        "403": {
          description: "User is not an ADMIN",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorEnvelope" },
            },
          },
        },
      },
    },
  },
  "/api/liquidity/ledger": {
    get: {
      tags: ["Liquidity"],
      summary: "Get liquidity transaction ledger",
      description:
        "Retrieve the complete append-only audit trail of all liquidity transactions.\n\n" +
        "**Admin only** — Bearer token + ADMIN role required.\n\n" +
        "**Transaction types:**\n" +
        "- `CREDIT` - Funds added to pool\n" +
        "- `DEBIT` - Funds withdrawn from pool\n" +
        "- `RESERVE` - Funds reserved for pending transfers\n" +
        "- `RELEASE` - Reserved funds released back\n" +
        "- `DISBURSE` - Funds disbursed to recipient\n" +
        "- `SETTLEMENT` - Inter-pool settlement\n\n" +
        "**Currencies tracked:** CHF, USD, ETB",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "limit",
          in: "query",
          required: false,
          description:
            "Maximum number of ledger entries to return (default: 100)",
          schema: { type: "integer", minimum: 1, maximum: 1000, example: 100 },
        },
      ],
      responses: {
        "200": {
          description: "Ledger retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LedgerResponse" },
              example: {
                success: true,
                data: {
                  ledger: [
                    {
                      id: "ltx_001",
                      poolId: "pool_swiss_001",
                      type: "CREDIT",
                      currency: "USD",
                      amount: 10000.0,
                      balanceAfter: 55000.0,
                      referenceId: "TX000001",
                      note: "Crypto deposit confirmed for TX000001",
                      createdAt: "2026-06-18T10:30:00.000Z",
                    },
                    {
                      id: "ltx_002",
                      poolId: "pool_eth_001",
                      type: "RESERVE",
                      currency: "ETB",
                      amount: 500000.0,
                      balanceAfter: 2500000.0,
                      referenceId: "TX000001",
                      note: "Reserved ETB for transfer TX000001",
                      createdAt: "2026-06-18T10:31:00.000Z",
                    },
                    {
                      id: "ltx_003",
                      poolId: "pool_eth_001",
                      type: "DISBURSE",
                      currency: "ETB",
                      amount: 500000.0,
                      balanceAfter: 2500000.0,
                      referenceId: "TX000001",
                      note: "Paid out to recipient — TX000001",
                      createdAt: "2026-06-18T10:35:00.000Z",
                    },
                  ],
                },
              },
            },
          },
        },
        "400": {
          description: "Invalid limit parameter",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorEnvelope" },
            },
          },
        },
        "401": {
          description: "Missing or invalid Bearer token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorEnvelope" },
            },
          },
        },
        "403": {
          description: "User is not an ADMIN",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorEnvelope" },
            },
          },
        },
      },
    },
  },
} as const;
