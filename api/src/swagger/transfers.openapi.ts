/** Transfers module paths and schemas for the OpenAPI spec. */

export const transferSchemas = {
  TransferStatus: {
    type: "string",
    enum: [
      "INITIATED",
      "AWAITING_CRYPTO",
      "BLOCKCHAIN_PENDING",
      "BLOCKCHAIN_CONFIRMED",
      "SWISS_FUNDS_RECEIVED",
      "FX_CONVERTED",
      "PAYOUT_PROCESSING",
      "PAYOUT_SENT",
      "COMPLETED",
      "FAILED",
      "REVERSED",
      "EXPIRED",
    ],
    description: "Current status of the transfer in its lifecycle",
  },
  PublicBeneficiary: {
    type: "object",
    properties: {
      id: { type: "string", example: "ben_xyz123" },
      firstName: { type: "string", example: "Abebe" },
      lastName: { type: "string", example: "Kebede" },
      email: { type: "string", format: "email", example: "abebe@example.et" },
      payoutMethod: { type: "string", enum: ["BANK", "TELEBIRR"] },
      bankName: {
        type: "string",
        enum: ["CBE", "AWASH", "DASHEN"],
        nullable: true,
      },
      accountNumber: { type: "string", nullable: true },
      telebirrPhone: { type: "string", nullable: true },
      isFavorite: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  PublicWallet: {
    type: "object",
    properties: {
      address: {
        type: "string",
        example: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bEb",
      },
      chain: { type: "string", example: "ETHEREUM" },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  DepositAddress: {
    type: "object",
    properties: {
      address: {
        type: "string",
        example: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bEb",
      },
      chain: { type: "string", example: "ETHEREUM" },
      asset: { type: "string", example: "USDC" },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  TransferQuote: {
    type: "object",
    required: [
      "asset",
      "amount",
      "beneficiaryId",
      "usdValue",
      "usdToEtb",
      "grossEtb",
      "feeCrypto",
      "feeEtb",
      "payoutEtb",
      "rateTimestamp",
    ],
    properties: {
      asset: { $ref: "#/components/schemas/AssetType" },
      amount: {
        type: "number",
        format: "double",
        example: 100.5,
        description: "Amount of cryptocurrency",
      },
      beneficiaryId: {
        type: "string",
        example: "ben_xyz123",
        description: "Target beneficiary ID",
      },
      usdValue: {
        type: "number",
        format: "double",
        example: 100.5,
        description: "Equivalent USD value",
      },
      usdToEtb: {
        type: "number",
        format: "double",
        example: 63.0,
        description: "USD to ETB exchange rate",
      },
      grossEtb: {
        type: "number",
        format: "double",
        example: 6336.75,
        description: "Gross amount in ETB (before fees)",
      },
      feeCrypto: {
        type: "number",
        format: "double",
        example: 1.5,
        description: "Fee amount in cryptocurrency",
      },
      feeEtb: {
        type: "number",
        format: "double",
        example: 94.5,
        description: "Fee amount in ETB",
      },
      payoutEtb: {
        type: "number",
        format: "double",
        example: 6242.25,
        description: "Final payout amount in ETB (grossEtb - feeEtb)",
      },
      rateTimestamp: {
        type: "string",
        format: "date-time",
        example: "2026-06-18T10:30:00.000Z",
        description: "When these rates were fetched",
      },
    },
  },
  PublicTransfer: {
    type: "object",
    required: [
      "id",
      "reference",
      "status",
      "senderId",
      "beneficiaryId",
      "asset",
      "sendAmount",
      "depositAddress",
      "createdAt",
    ],
    properties: {
      id: { type: "string", example: "tf_abc123xyz" },
      reference: {
        type: "string",
        example: "TX000001",
        description: "Human-readable transaction reference",
      },
      status: { $ref: "#/components/schemas/TransferStatus" },
      senderId: { type: "string", example: "usr_abc123" },
      beneficiaryId: { type: "string", example: "ben_xyz123" },
      beneficiary: {
        $ref: "#/components/schemas/PublicBeneficiary",
        nullable: true,
      },
      asset: { $ref: "#/components/schemas/AssetType" },
      sendAmount: {
        type: "number",
        format: "double",
        example: 100.5,
        description: "Amount of crypto to send",
      },
      receivedAmount: {
        type: "number",
        format: "double",
        nullable: true,
        description:
          "Amount actually received (may differ due to blockchain confirmation)",
      },
      depositAddress: {
        $ref: "#/components/schemas/DepositAddress",
        nullable: true,
      },
      receiveEtb: {
        type: "number",
        format: "double",
        nullable: true,
        description: "Final amount recipient receives in ETB",
      },
      fees: {
        type: "object",
        properties: {
          feeCrypto: { type: "number", format: "double" },
          feeEtb: { type: "number", format: "double" },
        },
        nullable: true,
      },
      wallet: { $ref: "#/components/schemas/PublicWallet", nullable: true },
      connectedWallet: { type: "object", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  TransferQuoteRequest: {
    type: "object",
    required: ["asset", "amount", "beneficiaryId"],
    properties: {
      asset: { $ref: "#/components/schemas/AssetType" },
      amount: {
        type: "number",
        format: "double",
        example: 100.5,
        minimum: 0,
        exclusiveMinimum: true,
      },
      beneficiaryId: {
        type: "string",
        example: "ben_xyz123",
        description: "ID of the recipient beneficiary",
      },
    },
  },
  TransferQuoteResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          quote: { $ref: "#/components/schemas/TransferQuote" },
        },
      },
    },
  },
  CreateTransferResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          transfer: { $ref: "#/components/schemas/PublicTransfer" },
        },
      },
    },
  },
  ListTransfersResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          transfers: {
            type: "array",
            items: { $ref: "#/components/schemas/PublicTransfer" },
          },
        },
      },
    },
  },
  GetTransferResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          transfer: { $ref: "#/components/schemas/PublicTransfer" },
        },
      },
    },
  },
  AuditLogEntry: {
    type: "object",
    properties: {
      id: { type: "string" },
      action: { type: "string", example: "TRANSFER_CREATED" },
      entityType: { type: "string", example: "Transfer" },
      entityId: { type: "string" },
      metadata: { type: "object" },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  TimelineResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          timeline: {
            type: "array",
            items: { $ref: "#/components/schemas/AuditLogEntry" },
          },
        },
      },
    },
  },
  TransferStatusEvent: {
    type: "object",
    properties: {
      transferId: { type: "string", example: "tf_abc123xyz" },
      reference: { type: "string", example: "TX000001" },
      status: { $ref: "#/components/schemas/TransferStatus" },
      timestamp: { type: "string", format: "date-time" },
    },
  },
  ConfirmWalletResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: { type: "object" },
    },
  },
  Receipt: {
    type: "object",
    properties: {
      id: { type: "string" },
      transferId: { type: "string" },
      reference: { type: "string" },
      sendAmount: { type: "number", format: "double" },
      receiveEtb: { type: "number", format: "double" },
      fees: { type: "object" },
      beneficiary: { $ref: "#/components/schemas/PublicBeneficiary" },
      status: { $ref: "#/components/schemas/TransferStatus" },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  ReceiptResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          receipt: { $ref: "#/components/schemas/Receipt" },
        },
      },
    },
  },
  Payout: {
    type: "object",
    properties: {
      id: { type: "string" },
      transferId: { type: "string" },
      method: { type: "string", enum: ["BANK", "TELEBIRR"] },
      amount: { type: "number", format: "double" },
      status: { type: "string", enum: ["PENDING", "SENT", "FAILED"] },
      reference: { type: "string", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  PayoutResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          payout: { $ref: "#/components/schemas/Payout" },
        },
      },
    },
  },
} as const;

export const transferPaths = {
  "/api/transfers/quote": {
    post: {
      tags: ["Transfers"],
      summary: "Get transfer quote",
      description:
        "Calculate the exact payout amounts before creating a transfer.\n\n" +
        "**Authentication required** — Bearer token needed.\n\n" +
        "Returns fees, exchange rates, and final ETB amount the recipient will receive.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/TransferQuoteRequest" },
            example: {
              asset: "USDC",
              amount: 100.5,
              beneficiaryId: "ben_xyz123",
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Quote calculated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TransferQuoteResponse" },
              example: {
                success: true,
                data: {
                  quote: {
                    asset: "USDC",
                    amount: 100.5,
                    beneficiaryId: "ben_xyz123",
                    usdValue: 100.5,
                    usdToEtb: 63.0,
                    grossEtb: 6336.75,
                    feeCrypto: 1.5,
                    feeEtb: 94.5,
                    payoutEtb: 6242.25,
                    rateTimestamp: "2026-06-18T10:30:00.000Z",
                  },
                },
              },
            },
          },
        },
        "400": {
          description: "Validation error or beneficiary not found",
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
      },
    },
  },
  "/api/transfers": {
    post: {
      tags: ["Transfers"],
      summary: "Create a new transfer",
      description:
        "Initiates a new cryptocurrency transfer. After creation, the sender must deposit crypto to the provided address.\n\n" +
        "**Authentication required** — Bearer token needed.\n\n" +
        "Transfer follows this lifecycle:\n" +
        "`INITIATED` → `AWAITING_CRYPTO` → `BLOCKCHAIN_PENDING` → `COMPLETED`",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/TransferQuoteRequest" },
            example: {
              asset: "USDC",
              amount: 100.5,
              beneficiaryId: "ben_xyz123",
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Transfer created successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateTransferResponse" },
              example: {
                success: true,
                data: {
                  transfer: {
                    id: "tf_abc123xyz",
                    reference: "TX000001",
                    status: "INITIATED",
                    senderId: "usr_abc123",
                    beneficiaryId: "ben_xyz123",
                    asset: "USDC",
                    sendAmount: 100.5,
                    depositAddress: {
                      address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bEb",
                      chain: "ETHEREUM",
                      asset: "USDC",
                      createdAt: "2026-06-18T10:30:00.000Z",
                    },
                    createdAt: "2026-06-18T10:30:00.000Z",
                    updatedAt: "2026-06-18T10:30:00.000Z",
                  },
                },
              },
            },
          },
        },
        "400": {
          description:
            "Validation error, KYC limit exceeded, or beneficiary not found",
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
      },
    },
    get: {
      tags: ["Transfers"],
      summary: "List my transfers",
      description:
        "Retrieve all transfers initiated by the authenticated user.\n\n" +
        "**Authentication required** — Bearer token needed.",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": {
          description: "Transfers retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ListTransfersResponse" },
              example: {
                success: true,
                data: {
                  transfers: [
                    {
                      id: "tf_abc123xyz",
                      reference: "TX000001",
                      status: "BLOCKCHAIN_CONFIRMED",
                      senderId: "usr_abc123",
                      beneficiaryId: "ben_xyz123",
                      asset: "USDC",
                      sendAmount: 100.5,
                      createdAt: "2026-06-18T10:30:00.000Z",
                      updatedAt: "2026-06-18T10:35:00.000Z",
                    },
                  ],
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
      },
    },
  },
  "/api/transfers/{id}": {
    get: {
      tags: ["Transfers"],
      summary: "Get transfer details",
      description:
        "Retrieve full details of a specific transfer by ID.\n\n" +
        "**Authentication required** — Bearer token needed.\n\n" +
        "Only the transfer owner (sender) or ADMIN can view.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "Transfer ID",
          schema: { type: "string", example: "tf_abc123xyz" },
        },
      ],
      responses: {
        "200": {
          description: "Transfer retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GetTransferResponse" },
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
        "404": {
          description: "Transfer not found or access denied",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorEnvelope" },
            },
          },
        },
      },
    },
  },
  "/api/transfers/{id}/timeline": {
    get: {
      tags: ["Transfers"],
      summary: "Get transfer timeline",
      description:
        "Retrieve complete audit trail of all status changes and events for a transfer.\n\n" +
        "**Authentication required** — Bearer token needed.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", example: "tf_abc123xyz" },
        },
      ],
      responses: {
        "200": {
          description: "Timeline retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TimelineResponse" },
              example: {
                success: true,
                data: {
                  timeline: [
                    {
                      id: "audit_1",
                      action: "TRANSFER_CREATED",
                      entityType: "Transfer",
                      entityId: "tf_abc123xyz",
                      metadata: { status: "INITIATED" },
                      createdAt: "2026-06-18T10:30:00.000Z",
                    },
                    {
                      id: "audit_2",
                      action: "TRANSFER_UPDATED",
                      entityType: "Transfer",
                      entityId: "tf_abc123xyz",
                      metadata: { status: "BLOCKCHAIN_CONFIRMED" },
                      createdAt: "2026-06-18T10:35:00.000Z",
                    },
                  ],
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
        "404": {
          description: "Transfer not found or access denied",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorEnvelope" },
            },
          },
        },
      },
    },
  },
  "/api/transfers/{id}/events": {
    get: {
      tags: ["Transfers"],
      summary: "Subscribe to transfer status updates (SSE)",
      description:
        "Open a Server-Sent Events (SSE) connection to receive real-time transfer status updates.\n\n" +
        "**Authentication required** — Bearer token in header or `?accessToken=` query param.\n\n" +
        "**Response format:** Each status change is sent as a JSON event:\n" +
        "```\n" +
        'data: {"transferId":"...","reference":"...","status":"...","timestamp":"..."}\n' +
        "```\n\n" +
        "**Example client (JavaScript):**\n" +
        "```javascript\n" +
        "const token = 'your-access-token';\n" +
        "const eventSource = new EventSource(`/api/transfers/tf_123/events?accessToken=${token}`);\n" +
        "eventSource.onmessage = (e) => console.log(JSON.parse(e.data));\n" +
        "```",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", example: "tf_abc123xyz" },
        },
        {
          name: "accessToken",
          in: "query",
          required: false,
          description:
            "Optional: Bearer token for EventSource clients that cannot set headers",
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": {
          description: "SSE stream established",
          content: {
            "text/event-stream": {
              schema: {
                type: "object",
                properties: {
                  data: { $ref: "#/components/schemas/TransferStatusEvent" },
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
        "404": {
          description: "Transfer not found or access denied",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorEnvelope" },
            },
          },
        },
      },
    },
  },
  "/api/transfers/{id}/confirm-wallet": {
    post: {
      tags: ["Transfers"],
      summary: "Confirm wallet address",
      description:
        "Mark the crypto deposit wallet as confirmed after user has sent funds.\n\n" +
        "**Authentication required** — Bearer token needed.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", example: "tf_abc123xyz" },
        },
      ],
      responses: {
        "200": {
          description: "Wallet confirmed successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ConfirmWalletResponse" },
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
        "404": {
          description: "Transfer not found or access denied",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorEnvelope" },
            },
          },
        },
      },
    },
  },
  "/api/transfers/{id}/receipt": {
    get: {
      tags: ["Transfers"],
      summary: "Get transfer receipt",
      description:
        "Retrieve a receipt for a completed transfer with all transaction details.\n\n" +
        "**Authentication required** — Bearer token needed.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", example: "tf_abc123xyz" },
        },
      ],
      responses: {
        "200": {
          description: "Receipt retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReceiptResponse" },
              example: {
                success: true,
                data: {
                  receipt: {
                    id: "receipt_123",
                    transferId: "tf_abc123xyz",
                    reference: "TX000001",
                    sendAmount: 100.5,
                    receiveEtb: 6242.25,
                    fees: { feeCrypto: 1.5, feeEtb: 94.5 },
                    status: "COMPLETED",
                    createdAt: "2026-06-18T10:30:00.000Z",
                  },
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
        "404": {
          description: "Transfer not found or access denied",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorEnvelope" },
            },
          },
        },
      },
    },
  },
  "/api/transfers/{id}/payout": {
    get: {
      tags: ["Transfers"],
      summary: "Get payout details",
      description:
        "Retrieve payout information for the recipient (method, amount, status).\n\n" +
        "**Authentication required** — Bearer token needed.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", example: "tf_abc123xyz" },
        },
      ],
      responses: {
        "200": {
          description: "Payout details retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PayoutResponse" },
              example: {
                success: true,
                data: {
                  payout: {
                    id: "payout_123",
                    transferId: "tf_abc123xyz",
                    method: "BANK",
                    amount: 6242.25,
                    status: "SENT",
                    reference: "PAYOUT-20260618-001",
                    createdAt: "2026-06-18T10:35:00.000Z",
                    updatedAt: "2026-06-18T10:45:00.000Z",
                  },
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
        "404": {
          description: "Transfer not found or access denied",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorEnvelope" },
            },
          },
        },
      },
    },
  },
  "/api/transfers/{id}/simulate-deposit": {
    post: {
      tags: ["Transfers"],
      summary: "Simulate crypto deposit (Testing only)",
      description:
        "**⚠️ Development/Testing endpoint only.**\n\n" +
        "Simulates receiving a crypto deposit to advance the transfer to the next stage in its lifecycle.\n\n" +
        "**Authentication required** — Bearer token needed.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", example: "tf_abc123xyz" },
        },
      ],
      responses: {
        "200": {
          description: "Deposit simulated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateTransferResponse" },
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
        "404": {
          description: "Transfer not found or access denied",
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
