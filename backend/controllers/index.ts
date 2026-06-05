import type { Express } from "express";
import { imagePollerRouter } from "../../hardware-bridge/image-poller.js";
import { telegramRouter } from "../../photon/telegram-bot.js";

/**
 * Route registration helpers for the Behavioral Archaeologist backend.
 *
 * @connects backend/server.ts (mounts all API routers)
 * @connects hardware-bridge/image-poller.ts (Butterbase + RocketRide ingestion)
 * @connects photon/telegram-bot.ts (Photon Telegram webhooks)
 */

/** Registers all API route groups on the Express application. */
export function registerRoutes(app: Express): void {
  app.use("/api/hardware", imagePollerRouter);
  app.use("/photon/telegram", telegramRouter);
}
