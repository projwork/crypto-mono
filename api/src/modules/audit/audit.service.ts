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

export interface AuditListFilters {
  entityType?: string;
  transferId?: string;
  actorId?: string;
  action?: string;
  limit?: number;
}

export const toPublicAuditEntry = (entry: {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  transferId: string | null;
  metadata: unknown;
  createdAt: Date;
}) => ({
  id: entry.id,
  actorId: entry.actorId,
  action: entry.action,
  entityType: entry.entityType,
  entityId: entry.entityId,
  transferId: entry.transferId,
  metadata: entry.metadata,
  createdAt: entry.createdAt,
});

export const listAuditEntries = async (filters: AuditListFilters = {}) => {
  const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 500) : 100;

  const entries = await prisma.auditLog.findMany({
    where: {
      ...(filters.entityType ? { entityType: filters.entityType } : {}),
      ...(filters.transferId ? { transferId: filters.transferId } : {}),
      ...(filters.actorId ? { actorId: filters.actorId } : {}),
      ...(filters.action ? { action: filters.action } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return entries.map(toPublicAuditEntry);
};

export const auditService = {
  logEvent,
  listAuditEntries,
  getTransferTimeline,
};
