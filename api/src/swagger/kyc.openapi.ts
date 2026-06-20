/** KYC module paths and schemas for the OpenAPI spec. */
export const kycSchemas = {
  KycTier: {
    type: "string",
    enum: ["TIER_1", "TIER_2", "TIER_3"],
  },
  KycStatus: {
    type: "string",
    enum: ["PENDING", "APPROVED", "REJECTED"],
  },
  PublicKycVerification: {
    type: "object",
    properties: {
      id: { type: "string", example: "clxyz123" },
      tier: { $ref: "#/components/schemas/KycTier" },
      status: { $ref: "#/components/schemas/KycStatus" },
      passportUrl: { type: "string", nullable: true, example: "/uploads/kyc/passport.jpg" },
      nationalIdUrl: { type: "string", nullable: true },
      selfieUrl: { type: "string", nullable: true },
      proofOfAddressUrl: { type: "string", nullable: true },
      sourceOfFunds: { type: "string", nullable: true },
      rejectionReason: { type: "string", nullable: true },
      reviewedAt: { type: "string", format: "date-time", nullable: true },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  TransferLimit: {
    type: "object",
    properties: {
      tier: { $ref: "#/components/schemas/KycTier" },
      kycStatus: { $ref: "#/components/schemas/KycStatus" },
      unlimited: { type: "boolean", example: false },
      limitUsd: { type: "number", nullable: true, example: 5000 },
      usedUsd: { type: "number", example: 120.5 },
      remainingUsd: { type: "number", nullable: true, example: 4879.5 },
    },
  },
  TierInfo: {
    type: "object",
    properties: {
      tier: { $ref: "#/components/schemas/KycTier" },
      monthlyLimitUsd: { type: "number", nullable: true, example: 5000 },
      requirements: {
        type: "array",
        items: { type: "string" },
        example: ["Government ID", "Selfie"],
      },
    },
  },
  KycStatusResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          verification: {
            oneOf: [{ $ref: "#/components/schemas/PublicKycVerification" }, { type: "null" }],
          },
          tier: { $ref: "#/components/schemas/KycTier" },
          status: { $ref: "#/components/schemas/KycStatus" },
          limit: { $ref: "#/components/schemas/TransferLimit" },
          tiers: {
            type: "array",
            items: { $ref: "#/components/schemas/TierInfo" },
          },
        },
      },
    },
  },
  KycVerificationEnvelope: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          verification: { $ref: "#/components/schemas/PublicKycVerification" },
        },
      },
    },
  },
  PendingKycUser: {
    type: "object",
    properties: {
      id: { type: "string" },
      firstName: { type: "string", example: "Sara" },
      lastName: { type: "string", example: "Bekele" },
      email: { type: "string", example: "sara@diaspora.test" },
      country: { type: "string", example: "Canada" },
    },
  },
  PendingKycItem: {
    allOf: [
      { $ref: "#/components/schemas/PublicKycVerification" },
      {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/PendingKycUser" },
        },
      },
    ],
  },
  PendingKycResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          pending: {
            type: "array",
            items: { $ref: "#/components/schemas/PendingKycItem" },
          },
        },
      },
    },
  },
  ChooseTierRequest: {
    type: "object",
    required: ["tier"],
    properties: {
      tier: { $ref: "#/components/schemas/KycTier" },
    },
  },
  RejectKycRequest: {
    type: "object",
    required: ["reason"],
    properties: {
      reason: {
        type: "string",
        minLength: 1,
        maxLength: 500,
        example: "Document image is unreadable",
      },
    },
  },
} as const;

export const kycPaths = {
  "/api/kyc/submit": {
    post: {
      tags: ["KYC — User"],
      summary: "Submit KYC verification",
      description:
        "Creates a new PENDING KYC verification and sets the user's `kycStatus` to PENDING.\n\n" +
        "Preferred: **multipart/form-data** with file fields `passport`, `nationalId`, `selfie` " +
        "(jpeg/png/webp/pdf, max 5 MB each).\n\n" +
        "Fallback: JSON body with `*Url` fields instead of file uploads.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                tier: { $ref: "#/components/schemas/KycTier" },
                passport: { type: "string", format: "binary" },
                nationalId: { type: "string", format: "binary" },
                selfie: { type: "string", format: "binary" },
                passportUrl: { type: "string", format: "uri" },
                nationalIdUrl: { type: "string", format: "uri" },
                selfieUrl: { type: "string", format: "uri" },
                proofOfAddressUrl: { type: "string", format: "uri" },
                sourceOfFunds: { type: "string", maxLength: 2000 },
              },
            },
          },
          "application/json": {
            schema: {
              type: "object",
              properties: {
                tier: { $ref: "#/components/schemas/KycTier" },
                passportUrl: { type: "string", format: "uri" },
                nationalIdUrl: { type: "string", format: "uri" },
                selfieUrl: { type: "string", format: "uri" },
                proofOfAddressUrl: { type: "string", format: "uri" },
                sourceOfFunds: { type: "string", maxLength: 2000 },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "KYC submitted",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/KycVerificationEnvelope" },
            },
          },
        },
        "400": {
          description: "Validation or upload error",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
        "401": {
          description: "Missing or invalid token",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
      },
    },
  },
  "/api/kyc/status": {
    get: {
      tags: ["KYC — User"],
      summary: "Get my KYC status",
      description:
        "Returns the latest verification (if any), current user tier/status, monthly transfer " +
        "limit usage, and tier catalog with limits and requirements.",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": {
          description: "Current KYC status and limits",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/KycStatusResponse" },
            },
          },
        },
        "401": {
          description: "Missing or invalid token",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
      },
    },
  },
  "/api/kyc/tier": {
    post: {
      tags: ["KYC — User"],
      summary: "Choose KYC tier",
      description:
        "Sets the desired tier on the user's pending verification, or creates a new pending " +
        "verification if none exists.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ChooseTierRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Tier updated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/KycVerificationEnvelope" },
            },
          },
        },
        "400": {
          description: "Validation error",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
        "401": {
          description: "Missing or invalid token",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
      },
    },
  },
  "/api/kyc/pending": {
    get: {
      tags: ["KYC — Admin"],
      summary: "List pending KYC submissions",
      description: "Admin only. Returns all PENDING verifications with sender summary.",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": {
          description: "Pending queue",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PendingKycResponse" },
            },
          },
        },
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
      },
    },
  },
  "/api/kyc/{id}/approve": {
    post: {
      tags: ["KYC — Admin"],
      summary: "Approve KYC submission",
      description:
        "Admin only. Approves the verification and sets the user `kycStatus=APPROVED` and " +
        "`kycTier` to the verification tier.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "KYC verification ID",
        },
      ],
      responses: {
        "200": {
          description: "KYC approved",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/KycVerificationEnvelope" },
            },
          },
        },
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
        "404": {
          description: "Verification not found",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
      },
    },
  },
  "/api/kyc/{id}/reject": {
    post: {
      tags: ["KYC — Admin"],
      summary: "Reject KYC submission",
      description:
        "Admin only. Rejects the verification with a reason and sets user `kycStatus=REJECTED`.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "KYC verification ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RejectKycRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "KYC rejected",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/KycVerificationEnvelope" },
            },
          },
        },
        "400": {
          description: "Validation error",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
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
        "404": {
          description: "Verification not found",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
      },
    },
  },
} as const;
