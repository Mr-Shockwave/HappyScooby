/**
 * Custom Spectrum platform for Telegram (Bot API).
 *
 * Inbound updates arrive via the Express webhook bridge; outbound delivery uses
 * the Telegram Bot API through Spectrum's send hook.
 */

import { definePlatform } from "spectrum-ts";
import z from "zod";
import { iterateTelegramUpdates } from "./message-bridge.js";

const TELEGRAM_API_BASE = "https://api.telegram.org";

interface TelegramClient {
  botToken: string;
}

interface TelegramSendMessageResponse {
  ok: boolean;
  result?: { message_id: number };
  description?: string;
}

async function sendTelegramText(
  client: TelegramClient,
  chatId: string,
  body: string,
): Promise<number> {
  const response = await fetch(
    `${TELEGRAM_API_BASE}/bot${client.botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: body,
      }),
    },
  );

  const payload = (await response.json()) as TelegramSendMessageResponse;
  if (!payload.ok || payload.result?.message_id === undefined) {
    throw new Error(payload.description ?? `Telegram API error (${response.status})`);
  }

  return payload.result.message_id;
}

export const telegram = definePlatform("telegram", {
  config: z.object({
    botToken: z.string().min(1),
  }),

  user: {
    resolve: async ({ input }) => ({
      id: input.userID,
    }),
  },

  space: {
    params: z.object({
      chatId: z.string(),
    }),
    resolve: async ({ input }) => ({
      id: input.params?.chatId ?? input.users[0]!.id,
    }),
  },

  lifecycle: {
    createClient: async ({ config }) => ({
      botToken: config.botToken,
    }),
  },

  async *messages() {
    for await (const update of iterateTelegramUpdates()) {
      yield {
        id: update.messageId,
        content: { type: "text" as const, text: update.text },
        sender: { id: update.senderId },
        space: { id: update.chatId },
        timestamp: update.timestamp,
      };
    }
  },

  send: async ({ space, content, client }) => {
    if (content.type !== "text") {
      throw new Error(`Telegram provider only supports text content (got ${content.type})`);
    }

    const telegramClient = client as TelegramClient;
    const messageId = await sendTelegramText(telegramClient, space.id, content.text);
    return {
      id: String(messageId),
      content,
      sender: { id: "bot" },
      space: { id: space.id },
      timestamp: new Date(),
    };
  },
});
