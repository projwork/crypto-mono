/** Wallet module paths and schemas for the OpenAPI spec. */

export const walletSchemas = {
  ChainType: {
    type: "string",
    enum: ["ETHEREUM", "BSC", "POLYGON", "ARBITRUM", "OPTIMISM"],
  },
  DepositAddress: {
    type: "object",
    properties: {
      id: { type: "string", example: "wallet_xyz123" },
      transferId: { type: "string", example: "transfer_abc" },
      asset: { $ref: "#/components/schemas/AssetType" },
      address: { type: "string", example: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bEb" },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  DepositInstructions: {
    type: "object",
    properties: {
      transferId: { type: "string" },
      reference: { type: "string", example: "TX0001" },
      asset: { $ref: "#/components/schemas/AssetType" },
      address: { type: "string", example: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bEb" },
      expectedAmount: { type: "string", example: "100" },
      network: { type: "string", example: "Ethereum" },
    },
  },
  ConnectedWallet: {
    type: "object",
    properties: {
      address: { type: "string", example: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bEb" },
      chain: { $ref: "#/components/schemas/ChainType" },
      active: { type: "boolean", example: true },
    },
  },
  DepositAddressRequest: {
    type: "object",
    required: ["transferId"],
    properties: {
      transferId: { type: "string", minLength: 1 },
      asset: { $ref: "#/components/schemas/AssetType" },
    },
  },
  ConnectWalletRequest: {
    type: "object",
    required: ["address", "chain"],
    properties: {
      address: { type: "string", minLength: 1, example: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bEb" },
      chain: { $ref: "#/components/schemas/ChainType" },
      signature: { type: "string" },
    },
  },
  DepositAddressEnvelope: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          depositAddress: { $ref: "#/components/schemas/DepositAddress" },
        },
      },
    },
  },
  DepositInstructionsEnvelope: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          instructions: { $ref: "#/components/schemas/DepositInstructions" },
        },
      },
    },
  },
  ConnectedWalletEnvelope: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          wallet: { $ref: "#/components/schemas/ConnectedWallet" },
        },
      },
    },
  },
  WalletMeResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          wallet: {
            oneOf: [{ $ref: "#/components/schemas/ConnectedWallet" }, { type: "null" }],
          },
        },
      },
    },
  },
  DisconnectResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          disconnected: { type: "boolean", example: true },
        },
      },
    },
  },
} as const;

const authResponses = {
  "401": {
    description: "Missing or invalid token",
    content: {
      "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
    },
  },
};

export const walletPaths = {
  "/api/wallet/connect": {
    post: {
      tags: ["Wallet"],
      summary: "Connect MetaMask wallet",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ConnectWalletRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Wallet connected",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ConnectedWalletEnvelope" },
            },
          },
        },
        "400": {
          description: "Validation error",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
        ...authResponses,
      },
    },
  },
  "/api/wallet/me": {
    get: {
      tags: ["Wallet"],
      summary: "Get my connected wallet",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": {
          description: "Connected wallet or null",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/WalletMeResponse" },
            },
          },
        },
        ...authResponses,
      },
    },
  },
  "/api/wallet/disconnect": {
    post: {
      tags: ["Wallet"],
      summary: "Disconnect wallet",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": {
          description: "Wallet disconnected",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DisconnectResponse" },
            },
          },
        },
        ...authResponses,
      },
    },
  },
  "/api/wallet/deposit-address": {
    post: {
      tags: ["Wallet"],
      summary: "Get or create deposit address",
      description:
        "Returns an existing deposit wallet for the transfer or creates one. `201` on create, `200` if it already exists.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/DepositAddressRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Existing deposit address",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DepositAddressEnvelope" },
            },
          },
        },
        "201": {
          description: "New deposit address created",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DepositAddressEnvelope" },
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
        ...authResponses,
      },
    },
  },
  "/api/wallet/transfers/{transferId}/deposit-instructions": {
    get: {
      tags: ["Wallet"],
      summary: "Get deposit instructions",
      description: "Returns deposit instructions for a transfer (creates wallet if missing).",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "transferId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": {
          description: "Deposit instructions",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DepositInstructionsEnvelope" },
            },
          },
        },
        "404": {
          description: "Transfer not found",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
        ...authResponses,
      },
    },
  },
} as const;
