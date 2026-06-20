/** Auth module paths and schemas for the OpenAPI spec. */
export const authSchemas = {
  Role: {
    type: "string",
    enum: ["SENDER", "ADMIN"],
  },
  PublicUser: {
    type: "object",
    properties: {
      id: { type: "string", example: "clxyz123" },
      firstName: { type: "string", example: "Abel" },
      lastName: { type: "string", example: "Tesfaye" },
      email: { type: "string", format: "email", example: "abel@diaspora.test" },
      phone: { type: "string", example: "+41790000001" },
      country: { type: "string", example: "Switzerland" },
      role: { $ref: "#/components/schemas/Role" },
      kycTier: { $ref: "#/components/schemas/KycTier" },
      kycStatus: { $ref: "#/components/schemas/KycStatus" },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  AuthTokens: {
    type: "object",
    required: ["accessToken", "refreshToken"],
    properties: {
      accessToken: {
        type: "string",
        description: "JWT access token — use in `Authorization: Bearer <token>` header",
        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
      refreshToken: {
        type: "string",
        description: "JWT refresh token — use with POST /api/auth/refresh or /logout",
        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
    },
  },
  RegisterRequest: {
    type: "object",
    required: ["firstName", "lastName", "email", "phone", "country", "password"],
    properties: {
      firstName: { type: "string", minLength: 1, maxLength: 100, example: "John" },
      lastName: { type: "string", minLength: 1, maxLength: 100, example: "Doe" },
      email: { type: "string", format: "email", example: "john@example.com" },
      phone: { type: "string", minLength: 5, maxLength: 30, example: "+41790000099" },
      country: { type: "string", minLength: 2, maxLength: 100, example: "Switzerland" },
      password: { type: "string", minLength: 8, maxLength: 128, example: "Password123!" },
    },
  },
  LoginRequest: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email", example: "abel@diaspora.test" },
      password: { type: "string", example: "Password123!" },
    },
  },
  RefreshRequest: {
    type: "object",
    required: ["refreshToken"],
    properties: {
      refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
    },
  },
  AuthUserTokensResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/PublicUser" },
          tokens: { $ref: "#/components/schemas/AuthTokens" },
        },
      },
    },
  },
  AuthTokensResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: { $ref: "#/components/schemas/AuthTokens" },
    },
  },
  MeResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/PublicUser" },
        },
      },
    },
  },
  LogoutResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          loggedOut: { type: "boolean", example: true },
        },
      },
    },
  },
} as const;

export const authPaths = {
  "/api/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Register a new sender account",
      description:
        "Creates a new SENDER user and returns a JWT token pair. No authentication required.",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RegisterRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Account created",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthUserTokensResponse" },
            },
          },
        },
        "400": {
          description: "Validation error",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
        "409": {
          description: "Email already registered",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
      },
    },
  },
  "/api/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Login and obtain JWT tokens",
      description:
        "Returns `accessToken` and `refreshToken`. Copy `data.tokens.accessToken`, click " +
        "**Authorize** at the top of this page, and paste the token (Swagger adds the `Bearer` prefix).\n\n" +
        "**Demo accounts** (password `Password123!`):\n" +
        "- Sender: `abel@diaspora.test`\n" +
        "- Admin: `admin@remittance.test`",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LoginRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Login successful",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthUserTokensResponse" },
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
          description: "Invalid email or password",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
      },
    },
  },
  "/api/auth/refresh": {
    post: {
      tags: ["Auth"],
      summary: "Refresh access token",
      description:
        "Rotates the refresh token and returns a new access/refresh pair. No Bearer header required.",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RefreshRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Tokens refreshed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthTokensResponse" },
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
          description: "Invalid or expired refresh token",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
      },
    },
  },
  "/api/auth/logout": {
    post: {
      tags: ["Auth"],
      summary: "Logout (revoke refresh token)",
      description: "Revokes the supplied refresh token. Idempotent. No Bearer header required.",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RefreshRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Logged out",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LogoutResponse" },
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
  "/api/auth/me": {
    get: {
      tags: ["Auth"],
      summary: "Get current user profile",
      description: "Returns the authenticated user's profile. Requires a valid Bearer access token.",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": {
          description: "Current user",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MeResponse" },
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
} as const;
