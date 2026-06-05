import { Router, type Request, type Response } from "express";
import { pushBridgedMessage } from "./message-bridge.js";
import {
  handleIncomingMessage,
  PIPELINE_ERROR_MESSAGE,
} from "./message-handler.js";
import { sendTelegramMessage } from "./message-sender.js";
import { isPhotonConfigured } from "./config.js";

/**
 * Photon Telegram Bot — the user's ONLY interface (no web frontend).
 *
 * @sponsor Photon
 * When Photon Spectrum credentials are configured, inbound webhooks feed
 * app.messages via message-bridge.ts and replies are sent through space.send().
 * Otherwise this handler processes messages directly as a fallback.
 *
 * Endpoint: POST /photon/telegram/webhook
 */

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

async function handleMessageDirect(message: TelegramMessage): Promise<void> {
  const chatId = message.chat.id;
  const telegramId = String(message.from.id);
  const text = message.text ?? "";

  try {
    const reply = await handleIncomingMessage({ telegramId, chatId, text });
    await sendTelegramMessage(chatId, reply);
  } catch (error) {
    console.error("Photon pipeline error:", error);
    await sendTelegramMessage(chatId, PIPELINE_ERROR_MESSAGE);
  }
}

/**
 * POST /webhook — Telegram webhook receiver.
 * Mounted at /photon/telegram/webhook by backend/controllers.
 */
telegramRouter.post("/webhook", async (req: Request, res: Response) => {
  const update = req.body as TelegramUpdate;

  if (!update?.update_id) {
    res.status(400).json({ error: "Invalid Telegram update payload" });
    return;
  }

  res.status(200).json({ ok: true });

  const message = update.message;
  if (!message) {
    return;
  }

  try {
    if (isPhotonConfigured()) {
      pushBridgedMessage({
        messageId: String(message.message_id),
        senderId: String(message.from.id),
        chatId: String(message.chat.id),
        text: message.text ?? "",
        timestamp: new Date(message.date * 1000),
      });
      return;
    }

    await handleMessageDirect(message);
  } catch (error) {
    console.error("Photon webhook handler error:", error);
  }
});
