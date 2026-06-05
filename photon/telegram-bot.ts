import { Router, type Request, type Response } from "express";
import { prisma } from "../butterbase/client.js";
import { runPipeline } from "../rocketride/orchestrator.js";
import { deleteXTraceMemory } from "../xtrace/memory-manager.js";
import { sendTelegramMessage } from "./message-sender.js";

/**
 * Photon Telegram Bot — the user's ONLY interface (no web frontend).
 *
 * @sponsor Photon
 * Photon framework webhook handler for native Telegram delivery.
 * Manages consent via Butterbase, runs the RocketRide pipeline, and
 * returns empathetic responses through Photon's message sender.
 *
 * Endpoint: POST /photon/telegram/webhook
 */

const PRIVACY_MESSAGE =
  "🔒 Privacy First: I'm your AI psychologist companion. I analyze your messages and expressions to understand your emotional state. All data is encrypted and stored securely. Reply 'I CONSENT' to begin, or 'NO' to decline.";

const CONSENT_GRANTED_MESSAGE =
  "✅ Consent recorded. I'm here for you. How are you feeling today?";

const DELETE_CONFIRMATION_MESSAGE =
  "🗑️ All your data has been permanently deleted. Take care of yourself.";

const DECLINE_MESSAGE =
  "Understood. I won't analyze your data. Reply 'I CONSENT' whenever you're ready.";

const PIPELINE_ERROR_MESSAGE =
  "I'm having a little trouble right now. Please try again in a moment — I'm still here for you.";

/** Telegram update payload from the Bot API webhook. */
export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

export interface TelegramMessage {
  message_id: number;
  from: { id: number; first_name: string };
  chat: { id: number; type: string };
  text?: string;
  date: number;
}

export const telegramRouter = Router();

function normalizeText(text: string): string {
  return text.trim();
}

function isConsentGrant(text: string): boolean {
  return normalizeText(text).toUpperCase() === "I CONSENT";
}

function isConsentDecline(text: string): boolean {
  return normalizeText(text).toUpperCase() === "NO";
}

function isDeleteCommand(text: string): boolean {
  return normalizeText(text) === "/delete";
}

function isStartCommand(text: string): boolean {
  return normalizeText(text).startsWith("/start");
}

/**
 * Ensures a Butterbase User record exists for the Telegram ID.
 */
async function ensureUser(telegramId: string) {
  return prisma.user.upsert({
    where: { telegramId },
    create: { telegramId, consentGiven: false },
    update: {},
  });
}

/**
 * Grants consent: updates Butterbase User and logs to ConsentLog.
 */
async function grantConsent(telegramId: string): Promise<void> {
  const user = await ensureUser(telegramId);

  await prisma.user.update({
    where: { id: user.id },
    data: { consentGiven: true },
  });

  await prisma.consentLog.create({
    data: {
      userId: user.id,
      action: "GRANTED",
    },
  });
}

/**
 * Wipes Butterbase user data and XTrace memory for privacy /delete command.
 */
async function deleteAllUserData(telegramId: string): Promise<void> {
  try {
    await deleteXTraceMemory(telegramId);
  } catch {
    // XTrace may not have data yet — continue with Butterbase deletion
  }

  await prisma.user.deleteMany({
    where: { telegramId },
  });
}

/**
 * Processes an incoming message from a consenting user through RocketRide.
 */
async function processConsentedMessage(
  telegramId: string,
  telegramText: string,
): Promise<string> {
  const state = await runPipeline(telegramId, "text", { telegramText });
  return (
    state.photonPayload?.message ??
    "I'm here with you. Tell me more about how you're feeling."
  );
}

/**
 * Handles a single Telegram message and sends the appropriate reply.
 */
async function handleMessage(message: TelegramMessage): Promise<void> {
  const chatId = message.chat.id;
  const telegramId = String(message.from.id);
  const text = message.text ?? "";

  if (isDeleteCommand(text)) {
    await deleteAllUserData(telegramId);
    await sendTelegramMessage(chatId, DELETE_CONFIRMATION_MESSAGE);
    return;
  }

  if (isConsentGrant(text)) {
    await grantConsent(telegramId);
    await sendTelegramMessage(chatId, CONSENT_GRANTED_MESSAGE);
    return;
  }

  if (isConsentDecline(text)) {
    const user = await ensureUser(telegramId);
    await prisma.user.update({
      where: { id: user.id },
      data: { consentGiven: false },
    });
    await prisma.consentLog.create({
      data: {
        userId: user.id,
        action: "REVOKED",
      },
    });
    await sendTelegramMessage(chatId, DECLINE_MESSAGE);
    return;
  }

  const user = await ensureUser(telegramId);

  if (!user.consentGiven || isStartCommand(text)) {
    await sendTelegramMessage(chatId, PRIVACY_MESSAGE);
    return;
  }

  if (!text) {
    await sendTelegramMessage(
      chatId,
      "I can read text messages. How are you feeling today?",
    );
    return;
  }

  try {
    const reply = await processConsentedMessage(telegramId, text);
    await sendTelegramMessage(chatId, reply);
  } catch (error) {
    console.error("Photon pipeline error:", error);
    await sendTelegramMessage(chatId, PIPELINE_ERROR_MESSAGE);
  }
}

/**
 * POST /webhook — Photon framework Telegram webhook receiver.
 * Mounted at /photon/telegram/webhook by backend/controllers.
 */
telegramRouter.post("/webhook", async (req: Request, res: Response) => {
  const update = req.body as TelegramUpdate;

  if (!update?.update_id) {
    res.status(400).json({ error: "Invalid Telegram update payload" });
    return;
  }

  // Acknowledge immediately — Telegram expects a fast 200 OK
  res.status(200).json({ ok: true });

  const message = update.message;
  if (!message) {
    return;
  }

  try {
    await handleMessage(message);
  } catch (error) {
    console.error("Photon webhook handler error:", error);
  }
});
