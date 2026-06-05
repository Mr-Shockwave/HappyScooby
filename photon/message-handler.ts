import { prisma } from "../butterbase/client.js";
import { runPipeline } from "../rocketride/orchestrator.js";
import { deleteXTraceMemory } from "../xtrace/memory-manager.js";

export const PRIVACY_MESSAGE =
  "🔒 Privacy First: I'm your AI psychologist companion. I analyze your messages and expressions to understand your emotional state. All data is encrypted and stored securely. Reply 'I CONSENT' to begin, or 'NO' to decline.";

export const CONSENT_GRANTED_MESSAGE =
  "✅ Consent recorded. I'm here for you. How are you feeling today?";

export const DELETE_CONFIRMATION_MESSAGE =
  "🗑️ All your data has been permanently deleted. Take care of yourself.";

export const DECLINE_MESSAGE =
  "Understood. I won't analyze your data. Reply 'I CONSENT' whenever you're ready.";

export const PIPELINE_ERROR_MESSAGE =
  "I'm having a little trouble right now. Please try again in a moment — I'm still here for you.";

export interface IncomingTelegramMessage {
  telegramId: string;
  chatId: number;
  text: string;
}

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

async function ensureUser(telegramId: string) {
  return prisma.user.upsert({
    where: { telegramId },
    create: { telegramId, consentGiven: false },
    update: {},
  });
}

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
 * Core Telegram message logic shared by the Spectrum loop and Express fallback.
 */
export async function handleIncomingMessage(
  message: IncomingTelegramMessage,
): Promise<string> {
  const { telegramId, text } = message;

  if (isDeleteCommand(text)) {
    await deleteAllUserData(telegramId);
    return DELETE_CONFIRMATION_MESSAGE;
  }

  if (isConsentGrant(text)) {
    await grantConsent(telegramId);
    return CONSENT_GRANTED_MESSAGE;
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
    return DECLINE_MESSAGE;
  }

  const user = await ensureUser(telegramId);

  if (!user.consentGiven || isStartCommand(text)) {
    return PRIVACY_MESSAGE;
  }

  if (!text) {
    return "I can read text messages. How are you feeling today?";
  }

  return processConsentedMessage(telegramId, text);
}
