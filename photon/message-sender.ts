/**
 * Photon Message Sender — direct Telegram Bot API fallback.
 *
 * Used when Photon Spectrum credentials are not configured.
 */

const TELEGRAM_API_BASE = "https://api.telegram.org";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

export interface SendMessageResult {
  success: boolean;
  messageId?: number;
  attempts: number;
  error?: string;
}

interface TelegramSendMessageResponse {
  ok: boolean;
  result?: { message_id: number };
  description?: string;
}

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("Photon delivery: TELEGRAM_BOT_TOKEN is not configured");
  }
  return token;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sends a plain-text message to a Telegram chat via the Telegram Bot API.
 */
export async function sendTelegramMessage(
  chatId: number,
  text: string,
): Promise<SendMessageResult> {
  const token = getBotToken();
  const url = `${TELEGRAM_API_BASE}/bot${token}/sendMessage`;

  let lastError = "Unknown error";

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
        }),
      });

      const body = (await response.json()) as TelegramSendMessageResponse;

      if (body.ok && body.result?.message_id !== undefined) {
        return {
          success: true,
          messageId: body.result.message_id,
          attempts: attempt,
        };
      }

      lastError = body.description ?? `Telegram API error (${response.status})`;
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : "Network error sending message";
    }

    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  return {
    success: false,
    attempts: MAX_RETRIES,
    error: lastError,
  };
}
