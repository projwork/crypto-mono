import { PrismaClient } from "@prisma/client";
import { isProduction } from "../config/index.js";

/**
 * Shared Prisma client singleton. Reused across modules so we don't open a new
 * connection pool per import. In dev, cached on globalThis to survive HMR/reloads.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProduction ? ["error"] : ["query", "warn", "error"],
  });

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}
