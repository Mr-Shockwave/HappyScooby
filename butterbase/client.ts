import { PrismaClient } from "@prisma/client";

/**
 * Butterbase Prisma Client — singleton database access layer.
 *
 * @sponsor Butterbase
 * Connects to the Butterbase-backed PostgreSQL database defined in schema.prisma.
 * Used by consent middleware, mood snapshot persistence, and consent audit logging.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
