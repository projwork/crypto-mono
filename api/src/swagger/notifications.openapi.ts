/** Notifications module paths and schemas for the OpenAPI spec. */

export const notificationsSchemas = {
  NotificationType: {
    type: "string",
    enum: ["TRANSFER_UPDATE", "KYC_UPDATE", "LIQUIDITY_ALERT", "SYSTEM"],
  },
  PublicNotification: {
    type: "object",
    properties: {
      id: { type: "string", example: "notif_xyz123" },
      type: { $ref: "#/components/schemas/NotificationType" },
      title: { type: "string", example: "Transfer update" },
      message: { type: "string", example: "Your transfer TX0001 is now COMPLETED." },
      data: { type: "object", nullable: true },
      transferId: { type: "string", nullable: true },
      isRead: { type: "boolean", example: false },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  NotificationsListResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          notifications: {
            type: "array",
            items: { $ref: "#/components/schemas/PublicNotification" },
          },
        },
      },
    },
  },
  NotificationEnvelope: {
    type: "object",
    properties: {
      success: { type: "boolean", enum: [true] },
      data: {
        type: "object",
        properties: {
          notification: { $ref: "#/components/schemas/PublicNotification" },
        },
      },
    },
  },
} as const;

export const notificationsPaths = {
  "/api/notifications": {
    get: {
      tags: ["Notifications"],
      summary: "List my notifications",
      description: "Returns notifications for the authenticated user (newest first).",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 200, default: 50 },
        },
      ],
      responses: {
        "200": {
          description: "Notification list",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NotificationsListResponse" },
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
  "/api/notifications/{id}/read": {
    post: {
      tags: ["Notifications"],
      summary: "Mark notification as read",
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
          description: "Notification marked read",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NotificationEnvelope" },
            },
          },
        },
        "401": {
          description: "Missing or invalid token",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
        "404": {
          description: "Notification not found",
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ErrorEnvelope" } },
          },
        },
      },
    },
  },
} as const;
