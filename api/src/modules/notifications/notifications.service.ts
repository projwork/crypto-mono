import { NotificationType, Prisma, type Notification } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/apiResponse.js";

/** Public notification shape — documented in CONTRACTS.md. */
export const toPublicNotification = (notification: Notification) => ({
  id: notification.id,
  type: notification.type,
  message: notification.message,
  data: notification.data,
  transferId: notification.transferId,
  isRead: notification.isRead,
  createdAt: notification.createdAt,
});

export type PublicNotification = ReturnType<typeof toPublicNotification>;

export const notify = async (input: {
  userId: string;
  type?: NotificationType;
  message: string;
  transferId?: string;
  data?: Record<string, unknown>;
}) => {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type ?? NotificationType.TRANSFER_UPDATE,
      message: input.message,
      transferId: input.transferId ?? null,
      data: (input.data ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
};

export const listMyNotifications = async (userId: string, limit = 50) => {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 200),
  });

  return notifications.map(toPublicNotification);
};

export const markNotificationRead = async (userId: string, notificationId: string) => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw AppError.notFound("Notification not found");
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  return toPublicNotification(updated);
};

export const notificationService = {
  notify,
  listMyNotifications,
  markNotificationRead,
  toPublicNotification,
};
