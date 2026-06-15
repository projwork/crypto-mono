import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

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
