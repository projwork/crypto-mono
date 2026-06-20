/** Admin module paths and schemas for the OpenAPI spec. */

export const adminSchemas = {
  UpdateFxRateRequest: {
    type: "object",
    required: ["usdToEtb", "chfToEtb"],
    properties: {
      usdToEtb: { type: "number", example: 132.5 },
      chfToEtb: { type: "number", example: 151.2 },
      source: { type: "string", maxLength: 50, example: "ADMIN" },
    },
  },
  FxRateResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          usdToEtb: { type: "number" },
          chfToEtb: { type: "number" },
          timestamp: { type: "string", format: "date-time" },
          source: { type: "string" },
        },
      },
    },
  },
  AdminOverrideRequest: {
    type: "object",
    required: ["action"],
    properties: {
      action: { type: "string", enum: ["reverse", "complete"] },
      note: { type: "string", maxLength: 500 },
    },
  },
  LiquidityTopupRequest: {
    type: "object",
    required: ["amount", "reference"],
    properties: {
      amount: { type: "number", example: 10000 },
      reference: { type: "string", example: "TOPUP-001" },
    },
  },
  SweepCryptoRequest: {
    type: "object",
    required: ["asset", "amount"],
    properties: {
      asset: { $ref: "#/components/schemas/AssetType" },
      amount: { type: "number", example: 500 },
    },
  },
  BroadcastNotificationRequest: {
    type: "object",
    required: ["title", "message"],
    properties: {
      title: { type: "string", minLength: 1, maxLength: 200 },
      message: { type: "string", minLength: 1, maxLength: 1000 },
    },
  },
  AdminStats: {
    type: "object",
    properties: {
      totalTransfers: { type: "integer", example: 42 },
      totalEtbPaid: { type: "number", example: 550000 },
      totalCryptoReceivedUsd: { type: "number", example: 12000 },
      swissLiquidity: {
        type: "object",
        properties: {
          usdBalance: { type: "number" },
          chfBalance: { type: "number" },
        },
      },
      ethiopiaLiquidity: {
        type: "object",
        properties: {
          etbAvailable: { type: "number" },
          etbReserved: { type: "number" },
          etbCapacity: { type: "number" },
        },
      },
      activeUsers: { type: "integer", example: 15 },
    },
  },
  AdminStatsResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          stats: { $ref: "#/components/schemas/AdminStats" },
        },
      },
    },
  },
  AuditEntry: {
    type: "object",
    properties: {
      id: { type: "string" },
      actorId: { type: "string", nullable: true },
      action: { type: "string", example: "KYC_APPROVED" },
      entityType: { type: "string", example: "KycVerification" },
      entityId: { type: "string", nullable: true },
      transferId: { type: "string", nullable: true },
      metadata: { type: "object", nullable: true },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  AuditListResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          audit: {
            type: "array",
            items: { $ref: "#/components/schemas/AuditEntry" },
          },
        },
      },
    },
  },
  AdminAuditLogEntry: {
    type: "object",
    properties: {
      id: { type: "string" },
      adminId: { type: "string", nullable: true },
      action: { type: "string" },
      entityId: { type: "string", nullable: true },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  HotWalletBalance: {
    type: "object",
    properties: {
      walletAddress: { type: "string", example: "0xCOMPANYHOTWALLET" },
      usdcBalance: { type: "number", example: 100000 },
      usdtBalance: { type: "number", example: 50000 },
      ethBalance: { type: "number", example: 25 },
    },
  },
  SystemHealth: {
    type: "object",
    properties: {
      database: { type: "boolean", example: true },
      blockchainListener: { type: "boolean", example: true },
      conversionService: { type: "boolean", example: true },
      liquidityService: { type: "boolean", example: true },
      payoutService: { type: "boolean", example: true },
    },
  },
  AdminUserSummary: {
    allOf: [
      { $ref: "#/components/schemas/PublicUser" },
      {
        type: "object",
        properties: {
          beneficiariesCount: { type: "integer", example: 2 },
          transfersCount: { type: "integer", example: 5 },
          connectedWalletsCount: { type: "integer", example: 1 },
          kycSubmissionsCount: { type: "integer", example: 1 },
        },
      },
    ],
  },
  AdminUsersListResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          users: {
            type: "array",
            items: { $ref: "#/components/schemas/AdminUserSummary" },
          },
        },
      },
    },
  },
  AdminConnectedWallet: {
    type: "object",
    properties: {
      id: { type: "string" },
      address: { type: "string", example: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bEb" },
      chain: { $ref: "#/components/schemas/ChainType" },
      active: { type: "boolean", example: true },
    },
  },
  AdminUserDetailResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/PublicUser" },
          wallets: {
            type: "array",
            items: { $ref: "#/components/schemas/AdminConnectedWallet" },
          },
          beneficiaries: {
            type: "array",
            items: { $ref: "#/components/schemas/PublicBeneficiary" },
          },
          transfers: {
            type: "array",
            items: { $ref: "#/components/schemas/PublicTransfer" },
          },
        },
      },
    },
  },
} as const;

const adminSecurity = [{ bearerAuth: [] }];

const adminResponses = {
  "401": {
    description: "Missing or invalid token",
    content: {
      "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
    },
  },
  "403": {
    description: "Requires ADMIN role",
    content: {
      "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
    },
  },
};

export const adminPaths = {
  "/api/admin/fx-rate": {
    post: {
      tags: ["Admin"],
      summary: "Update FX rate",
      description: "Inserts a new exchange rate row and invalidates the FX cache.",
      security: adminSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateFxRateRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Rate updated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FxRateResponse" },
            },
          },
        },
        "400": {
          description: "Validation error",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
        ...adminResponses,
      },
    },
  },
  "/api/admin/transfers": {
    get: {
      tags: ["Admin"],
      summary: "List all transfers",
      security: adminSecurity,
      parameters: [
        { name: "status", in: "query", schema: { $ref: "#/components/schemas/TransferStatus" } },
        { name: "asset", in: "query", schema: { $ref: "#/components/schemas/AssetType" } },
        { name: "reference", in: "query", schema: { type: "string" } },
        { name: "limit", in: "query", schema: { type: "integer", default: 50, maximum: 200 } },
      ],
      responses: {
        "200": {
          description: "Transfer list",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ListTransfersResponse" },
            },
          },
        },
        ...adminResponses,
      },
    },
  },
  "/api/admin/transfers/{id}": {
    get: {
      tags: ["Admin"],
      summary: "Get transfer by ID",
      security: adminSecurity,
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
      ],
      responses: {
        "200": {
          description: "Transfer details",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GetTransferResponse" },
            },
          },
        },
        "404": {
          description: "Transfer not found",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
        ...adminResponses,
      },
    },
  },
  "/api/admin/transfers/{id}/override": {
    post: {
      tags: ["Admin"],
      summary: "Override failed transfer",
      description: "Admin recovery: mark reversed or force complete.",
      security: adminSecurity,
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AdminOverrideRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Transfer overridden",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GetTransferResponse" },
            },
          },
        },
        "400": {
          description: "Validation error",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
        "404": {
          description: "Transfer not found",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
        ...adminResponses,
      },
    },
  },
  "/api/admin/stats": {
    get: {
      tags: ["Admin"],
      summary: "Dashboard KPI stats",
      security: adminSecurity,
      responses: {
        "200": {
          description: "Admin statistics",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminStatsResponse" },
            },
          },
        },
        ...adminResponses,
      },
    },
  },
  "/api/admin/audit": {
    get: {
      tags: ["Admin"],
      summary: "Query audit log",
      security: adminSecurity,
      parameters: [
        { name: "entityType", in: "query", schema: { type: "string" } },
        { name: "transferId", in: "query", schema: { type: "string" } },
        { name: "actorId", in: "query", schema: { type: "string" } },
        { name: "action", in: "query", schema: { type: "string" } },
        { name: "limit", in: "query", schema: { type: "integer", default: 100 } },
      ],
      responses: {
        "200": {
          description: "Audit entries",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuditListResponse" },
            },
          },
        },
        ...adminResponses,
      },
    },
  },
  "/api/admin/users": {
    get: {
      tags: ["Admin"],
      summary: "List registered users",
      description:
        "Returns all users on the system with profile info and activity counts. " +
        "Filter by role or search by email, name, or phone.",
      security: adminSecurity,
      parameters: [
        {
          name: "role",
          in: "query",
          required: false,
          schema: { $ref: "#/components/schemas/Role" },
          description: "Filter by SENDER or ADMIN",
        },
        {
          name: "search",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Search email, first name, last name, or phone",
        },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 200, default: 50 },
        },
      ],
      responses: {
        "200": {
          description: "User list",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminUsersListResponse" },
            },
          },
        },
        ...adminResponses,
      },
    },
  },
  "/api/admin/users/{id}": {
    get: {
      tags: ["Admin"],
      summary: "Get user detail",
      description:
        "Returns full user profile plus connected wallets, beneficiaries, and transfer history.",
      security: adminSecurity,
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
      ],
      responses: {
        "200": {
          description: "User detail",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminUserDetailResponse" },
            },
          },
        },
        "404": {
          description: "User not found",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
        ...adminResponses,
      },
    },
  },
  "/api/admin/liquidity/chf/topup": {
    post: {
      tags: ["Admin"],
      summary: "Top up Swiss CHF liquidity",
      security: adminSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LiquidityTopupRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Top-up recorded",
          content: { "application/json": { schema: { type: "object" } } },
        },
        "400": {
          description: "Validation error",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
        ...adminResponses,
      },
    },
  },
  "/api/admin/liquidity/etb/topup": {
    post: {
      tags: ["Admin"],
      summary: "Top up Ethiopia ETB liquidity",
      security: adminSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LiquidityTopupRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Top-up recorded",
          content: { "application/json": { schema: { type: "object" } } },
        },
        "400": {
          description: "Validation error",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
        ...adminResponses,
      },
    },
  },
  "/api/admin/liquidity/history": {
    get: {
      tags: ["Admin"],
      summary: "Liquidity ledger history",
      security: adminSecurity,
      responses: {
        "200": {
          description: "Ledger entries",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", enum: [true] },
                  data: {
                    type: "object",
                    properties: {
                      data: { type: "array", items: { type: "object" } },
                    },
                  },
                },
              },
            },
          },
        },
        ...adminResponses,
      },
    },
  },
  "/api/admin/treasury/hot-wallet": {
    get: {
      tags: ["Admin"],
      summary: "Hot wallet balance",
      security: adminSecurity,
      responses: {
        "200": {
          description: "Treasury balances",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", enum: [true] },
                  data: { $ref: "#/components/schemas/HotWalletBalance" },
                },
              },
            },
          },
        },
        ...adminResponses,
      },
    },
  },
  "/api/admin/treasury/blockchain-transactions": {
    get: {
      tags: ["Admin"],
      summary: "Blockchain transactions",
      security: adminSecurity,
      responses: {
        "200": {
          description: "Transaction list",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", enum: [true] },
                  data: {
                    type: "object",
                    properties: {
                      data: { type: "array", items: { type: "object" } },
                    },
                  },
                },
              },
            },
          },
        },
        ...adminResponses,
      },
    },
  },
  "/api/admin/treasury/sweep": {
    post: {
      tags: ["Admin"],
      summary: "Sweep crypto to treasury",
      security: adminSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/SweepCryptoRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Sweep initiated",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", enum: [true] },
                  data: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "SWEEP_INITIATED" },
                    },
                  },
                },
              },
            },
          },
        },
        "400": {
          description: "Validation error",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
        ...adminResponses,
      },
    },
  },
  "/api/admin/audit-logs": {
    get: {
      tags: ["Admin"],
      summary: "Formatted audit logs",
      security: adminSecurity,
      parameters: [
        { name: "entity", in: "query", schema: { type: "string" } },
        { name: "limit", in: "query", schema: { type: "integer", default: 100 } },
      ],
      responses: {
        "200": {
          description: "Formatted audit logs",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", enum: [true] },
                  data: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/AdminAuditLogEntry" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        ...adminResponses,
      },
    },
  },
  "/api/admin/notifications/broadcast": {
    post: {
      tags: ["Admin"],
      summary: "Broadcast system notification",
      description: "Sends a notification to all users.",
      security: adminSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/BroadcastNotificationRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Broadcast sent",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", enum: [true] },
                  data: {
                    type: "object",
                    properties: {
                      sent: { type: "boolean", example: true },
                    },
                  },
                },
              },
            },
          },
        },
        "400": {
          description: "Validation error",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
        ...adminResponses,
      },
    },
  },
  "/api/admin/system/health": {
    get: {
      tags: ["Admin"],
      summary: "System health check",
      security: adminSecurity,
      responses: {
        "200": {
          description: "Subsystem health flags",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", enum: [true] },
                  data: { $ref: "#/components/schemas/SystemHealth" },
                },
              },
            },
          },
        },
        ...adminResponses,
      },
    },
  },
} as const;
