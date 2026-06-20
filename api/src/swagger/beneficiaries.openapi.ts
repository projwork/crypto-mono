/** Beneficiaries module paths and schemas for the OpenAPI spec. */

export const beneficiariesSchemas = {
  PayoutMethod: {
    type: "string",
    enum: ["BANK", "TELEBIRR"],
  },
  BankName: {
    type: "string",
    enum: ["CBE", "AWASH", "DASHEN"],
  },
  PublicBeneficiary: {
    type: "object",
    properties: {
      id: { type: "string", example: "seed-ben-abebe" },
      fullName: { type: "string", example: "Abebe Kebede" },
      country: { type: "string", example: "Ethiopia" },
      payoutMethod: { $ref: "#/components/schemas/PayoutMethod" },
      bank: { $ref: "#/components/schemas/BankName", nullable: true },
      accountNumber: { type: "string", nullable: true, example: "1000123456789" },
      phoneNumber: { type: "string", nullable: true, example: "251912345678" },
      isFavorite: { type: "boolean", example: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  CreateBeneficiaryRequest: {
    type: "object",
    required: ["fullName", "payoutMethod"],
    properties: {
      fullName: { type: "string", minLength: 1, maxLength: 200, example: "Abebe Kebede" },
      country: { type: "string", minLength: 2, maxLength: 100, default: "Ethiopia" },
      payoutMethod: { $ref: "#/components/schemas/PayoutMethod" },
      bank: { $ref: "#/components/schemas/BankName", nullable: true },
      accountNumber: { type: "string", maxLength: 50, nullable: true },
      phoneNumber: { type: "string", maxLength: 30, nullable: true },
    },
    description:
      "BANK requires `bank` + `accountNumber`. TELEBIRR requires `phoneNumber`.",
  },
  UpdateBeneficiaryRequest: {
    type: "object",
    minProperties: 1,
    properties: {
      fullName: { type: "string", minLength: 1, maxLength: 200 },
      country: { type: "string", minLength: 2, maxLength: 100 },
      payoutMethod: { $ref: "#/components/schemas/PayoutMethod" },
      bank: { $ref: "#/components/schemas/BankName", nullable: true },
      accountNumber: { type: "string", maxLength: 50, nullable: true },
      phoneNumber: { type: "string", maxLength: 30, nullable: true },
    },
  },
  BeneficiaryEnvelope: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          beneficiary: { $ref: "#/components/schemas/PublicBeneficiary" },
        },
      },
    },
  },
  BeneficiariesListResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          beneficiaries: {
            type: "array",
            items: { $ref: "#/components/schemas/PublicBeneficiary" },
          },
        },
      },
    },
  },
  DeletedResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          deleted: { type: "boolean", example: true },
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

export const beneficiariesPaths = {
  "/api/beneficiaries": {
    post: {
      tags: ["Beneficiaries"],
      summary: "Create beneficiary",
      description: "Creates a payout recipient for the authenticated sender.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateBeneficiaryRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Beneficiary created",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BeneficiaryEnvelope" },
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
    get: {
      tags: ["Beneficiaries"],
      summary: "List my beneficiaries",
      description: "Returns beneficiaries owned by the caller (favorites first).",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": {
          description: "Beneficiary list",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BeneficiariesListResponse" },
            },
          },
        },
        ...authResponses,
      },
    },
  },
  "/api/beneficiaries/{id}": {
    get: {
      tags: ["Beneficiaries"],
      summary: "Get beneficiary by ID",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": {
          description: "Beneficiary details",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BeneficiaryEnvelope" },
            },
          },
        },
        "404": {
          description: "Not found or not owned by caller",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
        ...authResponses,
      },
    },
    put: {
      tags: ["Beneficiaries"],
      summary: "Update beneficiary",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateBeneficiaryRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Beneficiary updated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BeneficiaryEnvelope" },
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
          description: "Not found",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
        ...authResponses,
      },
    },
    delete: {
      tags: ["Beneficiaries"],
      summary: "Delete beneficiary",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": {
          description: "Beneficiary deleted",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DeletedResponse" },
            },
          },
        },
        "404": {
          description: "Not found",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
        "409": {
          description: "Linked to existing transfers",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
        ...authResponses,
      },
    },
  },
  "/api/beneficiaries/{id}/favorite": {
    post: {
      tags: ["Beneficiaries"],
      summary: "Toggle favorite",
      description: "Toggles `isFavorite` on the beneficiary.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": {
          description: "Favorite toggled",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BeneficiaryEnvelope" },
            },
          },
        },
        "404": {
          description: "Not found",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
        ...authResponses,
      },
    },
  },
} as const;
