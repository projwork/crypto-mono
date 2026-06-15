import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

export const logEvent = async (input: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  transferId?: string;
  metadata?: Record<string, unknown>;
}) => {
  return prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      transferId: input.transferId ?? null,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
};

export const getTransferTimeline = async (transferId: string) => {
  return prisma.auditLog.findMany({
    where: { transferId },
    orderBy: { createdAt: "asc" },
  });
};
