import { PrismaClient } from "@prisma/client";
import * as dataApi from "./data-api.js";

/**
 * Butterbase database access — Prisma when DATABASE_URL points at Butterbase Postgres,
 * otherwise REST Data API via BUTTERBASE_API_KEY + BUTTERBASE_PROJECT_ID.
 *
 * @sponsor Butterbase
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function isDirectDbConfigured(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) {
    return false;
  }
  return (
    !url.includes("localhost") &&
    !url.includes("127.0.0.1") &&
    !url.includes("user:password@")
  );
}

const directPrisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = directPrisma;
}

const restDb = {
  user: {
    findUnique: async ({
      where,
    }: {
      where: { telegramId: string };
    }) => dataApi.findUserByTelegramId(where.telegramId),

    upsert: async ({
      where,
      create,
    }: {
      where: { telegramId: string };
      create: { telegramId: string; consentGiven?: boolean };
      update: Record<string, never>;
    }) => {
      const existing = await dataApi.findUserByTelegramId(where.telegramId);
      if (existing) {
        return existing;
      }
      return dataApi.createUser(create.telegramId);
    },

    update: async ({
      where,
      data,
    }: {
      where: { id: string };
      data: { consentGiven?: boolean };
    }) => dataApi.updateUser(where.id, data),

    deleteMany: async ({
      where,
    }: {
      where: { telegramId: string };
    }) => {
      await dataApi.deleteUserByTelegramId(where.telegramId);
      return { count: 1 };
    },
  },
  consentLog: {
    create: async ({
      data,
    }: {
      data: { userId: string; action: string };
    }) => {
      await dataApi.createConsentLog(
        data.userId,
        data.action as "GRANTED" | "REVOKED",
      );
      return { id: "rest", userId: data.userId, action: data.action };
    },
  },
};

export const prisma = (isDirectDbConfigured()
  ? directPrisma
  : restDb) as typeof directPrisma;

export function getDbMode(): "prisma" | "rest" {
  return isDirectDbConfigured() ? "prisma" : "rest";
}
