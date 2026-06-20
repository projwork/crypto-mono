/** Conversions module paths and schemas for the OpenAPI spec. */

export const conversionSchemas = {
  AssetType: {
    type: "string",
    enum: ["USDC", "USDT", "ETH"],
    description: "Supported cryptocurrency assets",
  },
  ConversionType: {
    type: "string",
    enum: ["CRYPTO_TO_CHF", "CHF_TO_ETB"],
    description: "Type of conversion",
  },
  ConversionStatus: {
    type: "string",
    enum: ["PENDING", "COMPLETED", "FAILED"],
    description: "Status of the conversion transaction",
  },
  CryptoToChfRate: {
    type: "object",
    required: [
      "asset",
      "usdRate",
      "usdToChf",
      "chfRate",
      "source",
      "fetchedAt",
    ],
    properties: {
      asset: { $ref: "#/components/schemas/AssetType" },
      usdRate: {
        type: "number",
        format: "double",
        example: 65.45,
        description: "Current USD price of the crypto asset",
      },
      usdToChf: {
        type: "number",
        format: "double",
        example: 0.88,
        description: "Current USD to CHF exchange rate",
      },
      chfRate: {
        type: "number",
        format: "double",
        example: 57.6,
        description: "Calculated CHF rate (usdRate * usdToChf)",
      },
      source: {
        type: "string",
        example: "CoinGecko + FOREX API",
        description: "Data source for the rates",
      },
      fetchedAt: {
        type: "string",
        format: "date-time",
        example: "2026-06-18T10:30:00.000Z",
      },
    },
  },
  ChfToEtbRate: {
    type: "object",
    required: [
      "from",
      "to",
      "rate",
      "usdToChf",
      "usdToEtb",
      "source",
      "fetchedAt",
    ],
    properties: {
      from: { type: "string", enum: ["CHF"] },
      to: { type: "string", enum: ["ETB"] },
      rate: {
        type: "number",
        format: "double",
        example: 55.35,
        description: "CHF to ETB exchange rate",
      },
      usdToChf: {
        type: "number",
        format: "double",
        example: 0.88,
      },
      usdToEtb: {
        type: "number",
        format: "double",
        example: 63.0,
      },
      source: {
        type: "string",
        example: "FOREX API",
      },
      fetchedAt: {
        type: "string",
        format: "date-time",
      },
    },
  },
  CryptoToChfRateResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: { $ref: "#/components/schemas/CryptoToChfRate" },
    },
  },
  ChfToEtbRateResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: { $ref: "#/components/schemas/ChfToEtbRate" },
    },
  },
  CryptoToChfConversionRequest: {
    type: "object",
    required: ["transferId", "asset", "cryptoAmount"],
    properties: {
      transferId: {
        type: "string",
        example: "tf_abc123xyz",
        description: "The transfer ID tied to this conversion",
      },
      asset: { $ref: "#/components/schemas/AssetType" },
      cryptoAmount: {
        type: "number",
        format: "double",
        example: 100.5,
        minimum: 0,
        exclusiveMinimum: true,
        description:
          "Amount of crypto to convert (must match transfer sendAmount)",
      },
    },
  },
  ChfToEtbConversionRequest: {
    type: "object",
    required: ["transferId", "chfAmount"],
    properties: {
      transferId: {
        type: "string",
        example: "tf_abc123xyz",
        description: "The transfer ID tied to this conversion",
      },
      chfAmount: {
        type: "number",
        format: "double",
        example: 5500.0,
        minimum: 0,
        exclusiveMinimum: true,
        description: "Amount in CHF to convert to ETB",
      },
    },
  },
  CryptoToChfConversion: {
    type: "object",
    required: [
      "transferId",
      "asset",
      "cryptoAmount",
      "marketRate",
      "chfAmount",
      "source",
      "convertedAt",
    ],
    properties: {
      transferId: { type: "string", example: "tf_abc123xyz" },
      asset: { $ref: "#/components/schemas/AssetType" },
      cryptoAmount: {
        type: "number",
        format: "double",
        example: 100.5,
      },
      marketRate: {
        type: "number",
        format: "double",
        example: 57.6,
        description: "The market rate used for conversion",
      },
      chfAmount: {
        type: "number",
        format: "double",
        example: 5789.8,
        description: "Resulting amount in CHF (cryptoAmount * marketRate)",
      },
      source: {
        type: "string",
        example: "CoinGecko + FOREX API",
      },
      convertedAt: {
        type: "string",
        format: "date-time",
        example: "2026-06-18T10:30:00.000Z",
      },
    },
  },
  ChfToEtbConversion: {
    type: "object",
    required: [
      "transferId",
      "chfAmount",
      "rate",
      "etbAmount",
      "source",
      "convertedAt",
    ],
    properties: {
      transferId: { type: "string", example: "tf_abc123xyz" },
      chfAmount: {
        type: "number",
        format: "double",
        example: 5500.0,
      },
      rate: {
        type: "number",
        format: "double",
        example: 55.35,
        description: "The CHF to ETB exchange rate used",
      },
      etbAmount: {
        type: "number",
        format: "double",
        example: 304425.0,
        description: "Resulting amount in ETB (chfAmount * rate)",
      },
      source: {
        type: "string",
        example: "FOREX API",
      },
      convertedAt: {
        type: "string",
        format: "date-time",
      },
    },
  },
  CryptoToChfConversionResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          conversion: { $ref: "#/components/schemas/CryptoToChfConversion" },
        },
      },
    },
  },
  ChfToEtbConversionResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          conversion: { $ref: "#/components/schemas/ChfToEtbConversion" },
        },
      },
    },
  },
} as const;

export const conversionPaths = {
  "/api/conversions/crypto-to-chf/rate": {
    get: {
      tags: ["Conversions"],
      summary: "Get current crypto-to-CHF rate",
      description:
        "Fetches the real-time market rate to convert a cryptocurrency asset to Swiss Francs.\n\n" +
        "**Public endpoint** — no authentication required.\n\n" +
        "Rates are sourced from CoinGecko (crypto prices) and FOREX APIs (fiat rates).",
      security: [],
      parameters: [
        {
          name: "asset",
          in: "query",
          required: true,
          description: "Cryptocurrency asset (USDC, USDT, or ETH)",
          schema: { $ref: "#/components/schemas/AssetType" },
        },
      ],
      responses: {
        "200": {
          description: "Rate retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CryptoToChfRateResponse" },
              example: {
                success: true,
                data: {
                  asset: "USDC",
                  usdRate: 1.0,
                  usdToChf: 0.88,
                  chfRate: 0.88,
                  source: "CoinGecko + FOREX API",
                  fetchedAt: "2026-06-18T10:30:00.000Z",
                },
              },
            },
          },
        },
        "400": {
          description: "Invalid asset parameter",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorEnvelope" },
            },
          },
        },
      },
    },
  },
  "/api/conversions/chf-to-etb/rate": {
    get: {
      tags: ["Conversions"],
      summary: "Get current CHF-to-ETB rate",
      description:
        "Fetches the real-time market rate to convert Swiss Francs to Ethiopian Birr.\n\n" +
        "**Public endpoint** — no authentication required.",
      security: [],
      responses: {
        "200": {
          description: "Rate retrieved successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ChfToEtbRateResponse" },
              example: {
                success: true,
                data: {
                  from: "CHF",
                  to: "ETB",
                  rate: 55.35,
                  usdToChf: 0.88,
                  usdToEtb: 63.0,
                  source: "FOREX API",
                  fetchedAt: "2026-06-18T10:30:00.000Z",
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/conversions/crypto-to-chf": {
    post: {
      tags: ["Conversions"],
      summary: "Execute crypto-to-CHF conversion",
      description:
        "Converts a specified amount of cryptocurrency to Swiss Francs for a specific transfer.\n\n" +
        "**Authentication required** — Bearer token needed.\n\n" +
        "**Key rules:**\n" +
        "- `cryptoAmount` must match the transfer's `sendAmount` (enforced on backend)\n" +
        "- `asset` must match the transfer's asset type\n" +
        "- Only the transfer owner (sender) or ADMIN can call this\n" +
        "- Amount is rounded to 2 decimal places\n" +
        "- Conversion is upserted (updated if already exists for this transfer)",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/CryptoToChfConversionRequest",
            },
            example: {
              transferId: "tf_abc123xyz",
              asset: "USDC",
              cryptoAmount: 100.5,
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Conversion completed successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CryptoToChfConversionResponse",
              },
              example: {
                success: true,
                data: {
                  conversion: {
                    transferId: "tf_abc123xyz",
                    asset: "USDC",
                    cryptoAmount: 100.5,
                    marketRate: 0.88,
                    chfAmount: 88.44,
                    source: "CoinGecko + FOREX API",
                    convertedAt: "2026-06-18T10:30:00.000Z",
                  },
                },
              },
            },
          },
        },
        "400": {
          description:
            "Validation error (e.g., cryptoAmount doesn't match transfer, asset mismatch)",
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
  "/api/conversions/chf-to-etb": {
    post: {
      tags: ["Conversions"],
      summary: "Execute CHF-to-ETB conversion",
      description:
        "Converts a specified amount of Swiss Francs to Ethiopian Birr for a specific transfer.\n\n" +
        "**Authentication required** — Bearer token needed.\n\n" +
        "**Key rules:**\n" +
        "- Only the transfer owner (sender) or ADMIN can call this\n" +
        "- Amount is rounded to 2 decimal places\n" +
        "- Conversion is upserted (updated if already exists for this transfer)\n" +
        "- Typically called after `crypto-to-chf` conversion is complete",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ChfToEtbConversionRequest" },
            example: {
              transferId: "tf_abc123xyz",
              chfAmount: 88.44,
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Conversion completed successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ChfToEtbConversionResponse",
              },
              example: {
                success: true,
                data: {
                  conversion: {
                    transferId: "tf_abc123xyz",
                    chfAmount: 88.44,
                    rate: 55.35,
                    etbAmount: 4893.51,
                    source: "FOREX API",
                    convertedAt: "2026-06-18T10:30:00.000Z",
                  },
                },
              },
            },
          },
        },
        "400": {
          description: "Validation error (e.g., invalid chfAmount)",
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
